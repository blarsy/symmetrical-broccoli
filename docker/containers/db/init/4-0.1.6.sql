
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
	
	SELECT a.id, a.name, apt.token INTO destinator_id, created_message_sender, target_push_token FROM sb.active_accounts a
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

CREATE OR REPLACE FUNCTION sb.suggested_resources(
	search_term text,
	is_product boolean,
	is_service boolean,
	can_be_gifted boolean,
	can_be_exchanged boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	category_codes character varying[])
    RETURNS SETOF resources 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT r.*
  FROM sb.resources r
  LEFT JOIN sb.active_accounts a ON a.id = r.account_id
  WHERE r.expiration > LOCALTIMESTAMP
  AND (ARRAY_LENGTH(category_codes, 1) IS NULL OR EXISTS(
	  SELECT * 
	  FROM sb.resources_resource_categories rrc 
	  WHERE r.id = rrc.resource_id AND rrc.resource_category_code IN (SELECT UNNEST(category_codes))))
  AND (r.account_id = sb.current_account_id() OR a.id IS NOT NULL)
  AND
  (NOT suggested_resources.is_product OR r.is_product)
  AND
  (NOT suggested_resources.is_service OR r.is_service)
  AND
  (NOT suggested_resources.can_be_gifted OR r.can_be_gifted)
  AND
  (NOT suggested_resources.can_be_exchanged OR r.can_be_exchanged)
  AND
  (NOT suggested_resources.can_be_delivered OR r.can_be_delivered)
  AND
  (NOT suggested_resources.can_be_taken_away OR r.can_be_taken_away)
  AND
  (search_term = '' OR 
	(r.title ILIKE '%' || search_term || '%' OR r.description ILIKE '%' || search_term || '%'));
 
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.6';
END;
$body$
LANGUAGE 'plpgsql'; 