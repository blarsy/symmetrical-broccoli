GRANT SELECT ON TABLE sb.accounts TO anonymous;
GRANT SELECT ON TABLE sb.resource_categories TO anonymous;
GRANT SELECT ON TABLE sb.images TO anonymous;
GRANT SELECT ON TABLE sb.resources_images TO anonymous;
GRANT SELECT ON TABLE sb.resources_resource_categories TO anonymous;
GRANT SELECT ON TABLE sb.resources TO anonymous;

CREATE OR REPLACE FUNCTION sb.is_password_valid(
	password character varying)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	
	RETURN LENGTH(password) >= 8 AND regexp_count(password, '[A-Z]') > 0 AND regexp_count(password, '^[A-Z]') > 0;
END;
$BODY$;

CREATE OR REPLACE FUNCTION sb.delete_resource(
	resource_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE ids_images_to_delete INTEGER[];
begin
	--Detect attempt to delete a resource owned by another account
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = delete_resource.resource_id AND account_id = sb.current_account_id()) THEN
		RETURN 0;
	END IF;

	--Prevent deleting a resource linked to a conversation
	IF EXISTS(SELECT * FROM sb.conversations c WHERE c.resource_id = delete_resource.resource_id) THEN
		RETURN -1;
	END IF;

	DELETE FROM sb.resources_resource_categories rrc WHERE rrc.resource_id = delete_resource.resource_id;
	
	ids_images_to_delete = ARRAY(
		SELECT image_id FROM sb.resources_images ri
		WHERE ri.resource_id = delete_resource.resource_id
	);
	
	DELETE FROM sb.resources_images ri WHERE ri.resource_id = delete_resource.resource_id;
	DELETE FROM sb.images i WHERE i.id IN (SELECT UNNEST(ids_images_to_delete));
	
	DELETE FROM sb.resources r
	WHERE r.id = delete_resource.resource_id;
	
	RETURN 1;
end;
$BODY$;

ALTER TABLE IF EXISTS sb.accounts DROP CONSTRAINT IF EXISTS name_unique;

REVOKE ALL ON TABLE sb.email_activations FROM identified_account;
GRANT UPDATE, INSERT, SELECT, DELETE ON TABLE sb.email_activations TO identified_account;

ALTER TABLE IF EXISTS sb.accounts
    ALTER COLUMN email DROP NOT NULL;

CREATE OR REPLACE FUNCTION sb.delete_account()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE resource RECORD;
BEGIN
	DELETE FROM sb.images WHERE id = (SELECT avatar_image_id FROM sb.accounts WHERE id = sb.current_account_id());
	
	UPDATE sb.accounts
	SET name='', email=NULL, hash='', salt='', recovery_code='',recovery_code_expiration=null, avatar_image_id=null, activated=null, language=''
	WHERE id = sb.current_account_id();

	DELETE FROM sb.accounts_push_tokens WHERE account_id = sb.current_account_id();
	DELETE FROM sb.email_activations WHERE account_id = sb.current_account_id();

	FOR resource IN (SELECT id FROM sb.resources WHERE account_id = sb.current_account_id())
	LOOP
		PERFORM sb.delete_resource(resource.id);
	END LOOP;

	RETURN 1;
END;
$BODY$;

CREATE OR REPLACE VIEW sb.active_accounts
 AS
 SELECT accounts.id,
    accounts.name,
    accounts.email,
    accounts.hash,
    accounts.salt,
    accounts.recovery_code,
    accounts.recovery_code_expiration,
    accounts.created,
    accounts.avatar_image_id,
    accounts.activated,
    accounts.language
   FROM accounts
  WHERE accounts.activated IS NOT NULL AND accounts.name <> '' AND accounts.name IS NOT NULL;

CREATE OR REPLACE FUNCTION sb.create_message(
	resource_id integer,
	other_account_id integer,
	text character varying,
	image_public_id character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE conversation_id INTEGER;
DECLARE created_message_id INTEGER = 0;
DECLARE created_message_text TEXT;
DECLARE created_message_sender TEXT;
DECLARE inserted_image_id INTEGER;
DECLARE destinator_participant_id INTEGER;
DECLARE destinator_id INTEGER;
DECLARE target_push_token TEXT;

BEGIN
	SELECT c.id FROM sb.conversations c
	INTO conversation_id
	WHERE c.resource_id = create_message.resource_id AND EXISTS(
		SELECT * FROM sb.participants p
		WHERE p.conversation_id = c.id AND p.account_id = sb.current_account_id()
	) AND EXISTS(
		SELECT * FROM sb.participants p
		WHERE p.conversation_id = c.id AND p.account_id = create_message.other_account_id
	);
	
	IF conversation_id IS NULL THEN
		INSERT INTO sb.conversations (resource_id)
		VALUES (create_message.resource_id)
		RETURNING id INTO conversation_id;
		
		INSERT INTO sb.participants (account_id, conversation_id)
		VALUES (sb.current_account_id(), block.conversation_id);
		INSERT INTO sb.participants (account_id, conversation_id)
		VALUES ((SELECT account_id FROM sb.resources r WHERE r.id = create_message.resource_id), block.conversation_id);
		
	END IF;
	
	IF create_message.image_public_id IS NOT NULL THEN
		INSERT INTO sb.images (public_id)
		VALUES (create_message.image_public_id)
		RETURNING id INTO inserted_image_id;
	END IF;
	
	INSERT INTO sb.messages(participant_id, text, image_id, received)
	SELECT (
			SELECT p.id FROM sb.participants p
			WHERE p.conversation_id = block.conversation_id AND account_id = sb.current_account_id()
	), create_message.text, block.inserted_image_id, null
	RETURNING id, messages.text INTO created_message_id, created_message_text;
	
	SELECT p.id INTO destinator_participant_id FROM sb.participants p
	WHERE p.conversation_id = block.conversation_id AND p.account_id <> sb.current_account_id();
	
	INSERT INTO sb.unread_messages (participant_id, message_id)
	SELECT destinator_participant_id, created_message_id;
	
	UPDATE sb.conversations c SET last_message = created_message_id
	WHERE c.id = block.conversation_id;
	
	SELECT a.id, a.name, apt.token INTO destinator_id, created_message_sender, target_push_token FROM sb.accounts a
	INNER JOIN sb.participants p ON a.id = p.account_id
	left JOIN sb.accounts_push_tokens apt ON a.id = apt.account_id
	WHERE p.id = destinator_participant_id;

	-- Emit notification for graphql/postgraphile's subscription plugin
	PERFORM pg_notify('graphql:message_account:' || destinator_id, json_build_object(
		'event', 'message_created',
		'subject', created_message_id
	)::text);
	
	IF target_push_token IS NOT NULL THEN
		-- Emit notification for push notification handling
		PERFORM pg_notify('message_created', json_build_object(
			'message_id', created_message_id,
			'text', created_message_text,
			'sender', created_message_sender,
			'push_token', target_push_token,
			'resource_id', create_message.resource_id,
			'other_account_id', create_message.other_account_id
		)::text);
	END IF;
	
	RETURN created_message_id;
END;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.9';
END;
$body$
LANGUAGE 'plpgsql'; 