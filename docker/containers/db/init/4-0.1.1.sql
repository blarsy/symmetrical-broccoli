
CREATE OR REPLACE FUNCTION sb.create_message(
	resource_id integer,
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

BEGIN
	SELECT c.id FROM sb.conversations c
	INTO conversation_id
	WHERE c.resource_id = create_message.resource_id AND EXISTS(
		SELECT * FROM sb.participants p
		WHERE p.conversation_id = c.id AND p.account_id = sb.current_account_id()
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
	
	IF create_message.image_public_id THEN
		INSERT INTO sb.images (public_id)
		VALUES (create_message.image_public_id)
		RETURNING id INTO inserted_image_id;
	END IF;
	
	INSERT INTO sb.messages(participant_id, text, image_id, received)
	SELECT (
			SELECT p.id FROM sb.participants p
			WHERE p.conversation_id = block.conversation_id AND account_id = sb.current_account_id()
	), create_message.text, inserted_image_id, null
	RETURNING id, text INTO created_message_id, created_message_text;
	
	SELECT p.id INTO destinator_participant_id FROM sb.participants p
	WHERE p.conversation_id = block.conversation_id AND p.account_id <> sb.current_account_id();
	
	INSERT INTO sb.unread_messages (participant_id, message_id)
	SELECT destinator_participant_id, created_message_id;
	
	UPDATE sb.conversations c SET last_message = created_message_id
	WHERE c.id = block.conversation_id;
	
	SELECT a.id, a.name INTO destinator_id, created_message_sender FROM sb.accounts a
	INNER JOIN sb.participants p ON a.id = p.account_id
	WHERE p.id = destinator_participant_id;

	-- Emit notification for graphql/postgraphile's subscription plugin
	PERFORM pg_notify('graphql:message_account:' || destinator_id, json_build_object(
		'event', 'message_created',
		'subject', created_message_id
	)::text);
	
	-- Emit notification for push notification handling
	PERFORM pg_notify('message_created', json_build_object(
		'message_id', created_message_id,
		'text', created_message_text,
		'sender', created_message_sender,
		'conversation_id', block.conversation_id
	)::text);
	
	RETURN created_message_id;
END;
$BODY$;

CREATE TABLE IF NOT EXISTS sb.accounts_push_tokens
(
    account_id integer NOT NULL,
    token character varying COLLATE pg_catalog."default" NOT NULL,
    last_time_used timestamp without time zone NOT NULL DEFAULT now(),
    created timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT accounts_push_tokens_pk PRIMARY KEY (account_id, token),
    CONSTRAINT accounts_accounts_push_tokens_fk FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.accounts_push_tokens
    OWNER to sb;

REVOKE ALL ON TABLE sb.accounts_push_tokens FROM identified_account;

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE sb.accounts_push_tokens TO identified_account;

GRANT ALL ON TABLE sb.accounts_push_tokens TO sb;

CREATE OR REPLACE FUNCTION sb.sync_push_token(
	token CHARACTER VARYING)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	UPDATE sb.accounts_push_tokens SET last_time_used = NOW()
	WHERE account_id = sb.current_account_id();
	
	IF NOT FOUND THEN
		INSERT INTO sb.accounts_push_tokens (account_id, token, last_time_used)
		VALUES (sb.current_account_id(), sync_push_token.token, NOW());
	END IF;
	
	RETURN 1;
END;
$BODY$;

CREATE OR REPLACE FUNCTION sb.authenticate(
	email character varying,
	password character varying)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare account_id INTEGER;
begin
  select a.id into account_id
    from sb.accounts as a
    where a.email = LOWER(authenticate.email) and a.hash = crypt(password, a.salt);

  if account_id IS NOT NULL then
    return (
      account_id,
      extract(epoch from now() + interval '100 day'),
      'identified_account'
    )::sb.jwt_token;
  else
    return null;
  end if;
end;
$BODY$;

CREATE TABLE IF NOT EXISTS sb.system
(
    version character varying COLLATE pg_catalog."default" NOT NULL,
    created timestamp without time zone NOT NULL DEFAULT NOW()
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.system
    OWNER to sb;
	
DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.1';

	IF NOT FOUND THEN
		INSERT INTO sb.system (version)
		VALUES ('0.1.1');
	END IF;
END;
$body$
LANGUAGE 'plpgsql'; 
