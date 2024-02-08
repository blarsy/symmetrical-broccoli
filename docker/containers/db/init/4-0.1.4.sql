ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN activated timestamp without time zone;

ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN language character varying NOT NULL DEFAULT 'fr';

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
  WHERE accounts.activated IS NOT NULL;

ALTER TABLE sb.active_accounts
    OWNER TO sb;

GRANT SELECT ON TABLE sb.active_accounts TO anonymous;
GRANT SELECT ON TABLE sb.active_accounts TO identified_account;
GRANT ALL ON TABLE sb.active_accounts TO sb;

DROP FUNCTION IF EXISTS sb.create_message(integer, character varying, character varying);

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
  WHERE (ARRAY_LENGTH(category_codes, 1) IS NULL OR EXISTS(
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

DROP FUNCTION IF EXISTS sb.register_account(character varying, character varying, character varying);

CREATE OR REPLACE FUNCTION sb.register_account(
	name character varying,
	email character varying,
	password character varying,
	language character varying)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare inserted_id integer;
declare hash character varying;
declare salt character varying;
declare activation_code character varying;
begin
	IF sb.is_password_valid(register_account.password) = FALSE THEN
		RAISE EXCEPTION 'Password invalid';
	ELSE
		IF EXISTS(SELECT id FROM sb.accounts a WHERE a.email = LOWER(register_account.email)) THEN
			RAISE EXCEPTION 'Email is in use';
		END IF;
	END IF;
	
	INSERT INTO sb.accounts(
		name, email, hash, salt, language)
	SELECT register_account.name, LOWER(register_account.email), phs.hash, phs.salt, register_account.language
	FROM sb.get_password_hash_salt(register_account.password) phs
	RETURNING id INTO inserted_id;
	
	SELECT array_to_string(array(select substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) 
	INTO activation_code
	FROM generate_series(1,32)),'');
	
	INSERT INTO sb.email_activations (account_id, email, activation_code)
	VALUES (inserted_id, LOWER(register_account.email), activation_code);
	
	PERFORM sb.add_job('mailActivation', 
		json_build_object('email', LOWER(register_account.email), 'code', activation_code, 'lang', register_account.language));
	
	RETURN (
		inserted_id,
		EXTRACT(epoch FROM now() + interval '100 day'),
		'identified_account'
    )::sb.jwt_token;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.request_account_recovery(
	email character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE code TEXT;
DECLARE language TEXT;
begin
	SELECT array_to_string(array(select substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
	INTO code;
	
	SELECT a.language
	INTO block.language
	FROM sb.accounts a;
	
	UPDATE sb.accounts SET recovery_code = code, recovery_code_expiration = NOW() + interval '15 minutes'
	WHERE accounts.email = LOWER(request_account_recovery.email);
	
	IF FOUND THEN
		PERFORM sb.add_job('mailPasswordRecovery', 
			json_build_object('email', LOWER(request_account_recovery.email), 'code', code, 'lang', block.language));
	END IF;
	
	RETURN 1;
end;
$BODY$;

DROP FUNCTION IF EXISTS sb.conversation_messages(integer);

CREATE OR REPLACE FUNCTION sb.conversation_messages(
	resource_id integer,
	other_account_id integer)
    RETURNS SETOF messages 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT m.*
  	FROM sb.messages m
  	WHERE m.participant_id IN (
		SELECT p.id FROM sb.participants p
		WHERE p.conversation_id = (
			SELECT c.id FROM sb.conversations c
			WHERE c.resource_id = conversation_messages.resource_id AND EXISTS(
				SELECT * FROM sb.participants p2
				WHERE p2.conversation_id = c.id AND p2.account_id = sb.current_account_id()
			) AND EXISTS(
				SELECT * FROM sb.participants p2
				WHERE p2.conversation_id = c.id AND p2.account_id = other_account_id
			)
		)
	)
	ORDER BY m.created DESC
 
$BODY$;

CREATE TABLE sb.email_activations
(
    account_id integer NOT NULL,
    email character varying NOT NULL,
    activation_code character varying NOT NULL,
    activated timestamp without time zone,
    created timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT email_activations_pk PRIMARY KEY (account_id, activation_code, email)
);

ALTER TABLE IF EXISTS sb.email_activations
    OWNER to sb;

GRANT UPDATE, SELECT, INSERT ON TABLE sb.email_activations TO identified_account;

DROP FUNCTION IF EXISTS sb.get_session_data();

DROP TYPE IF EXISTS sb.session_data;

CREATE TYPE sb.session_data AS
(
	account_id integer,
	name character varying,
	email character varying,
	role character varying,
	avatar_public_id character varying,
	activated timestamp
);

CREATE OR REPLACE FUNCTION sb.get_session_data(
	)
    RETURNS session_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
SELECT a.id, a.name, a.email, sb.current_role(), i.public_id as avatar_public_id, a.activated
FROM sb.accounts a
LEFT JOIN sb.images i ON a.avatar_image_id = i.id
WHERE a.id = (SELECT NULLIF(current_setting('jwt.claims.account_id', true), '')::integer)
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

CREATE OR REPLACE FUNCTION sb.activate_account(
	activation_code character varying)
    RETURNS character varying
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE new_email text;
DECLARE id_account_to_activate integer;
DECLARE current_activated timestamp;
DECLARE account_lang character varying;
begin
	SELECT ea.email, ea.account_id
	INTO new_email, id_account_to_activate
	FROM sb.email_activations ea
	WHERE ea.activation_code = activate_account.activation_code;
	
	SELECT a.activated, a.language
	INTO current_activated, account_lang
	FROM sb.accounts a
	WHERE a.id = id_account_to_activate;
	
	IF current_activated IS NULL THEN
		UPDATE sb.accounts SET email = new_email, activated = NOW()
		WHERE id = id_account_to_activate;
	ELSE
		UPDATE sb.accounts SET email = new_email
		WHERE id = id_account_to_activate;
	END IF;
	
	UPDATE sb.email_activations ea
	SET activated = NOW()
	WHERE ea.activation_code = activate_account.activation_code;
	
	RETURN account_lang;
end;
$BODY$;

ALTER FUNCTION sb.activate_account(character varying)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.activate_account(character varying) TO anonymous;

GRANT EXECUTE ON FUNCTION sb.activate_account(character varying) TO sb;

CREATE OR REPLACE FUNCTION sb.update_account(
	name character varying,
	email character varying,
	avatar_public_id character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE current_email character varying;
DECLARE activation_code character varying;
DECLARE account_language character varying;
begin
	SELECT a.email, a.language
	INTO current_email, account_language
	FROM sb.accounts a
	WHERE a.id = sb.current_account_id();
	
	IF update_account.email IS NOT NULL AND update_account.email <> '' AND current_email <> LOWER(update_account.email) THEN
		SELECT array_to_string(array(select substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
		INTO block.activation_code;
		
		INSERT INTO sb.email_activations (account_id, email, activation_code)
		VALUES (sb.current_account_id(), update_account.email, block.activation_code);
		
		PERFORM sb.add_job('mailActivation', 
			json_build_object('email', LOWER(update_account.email), 'code', block.activation_code, 'lang', account_language));
	
	END IF;

	IF avatar_public_id IS NOT NULL AND NOT EXISTS (SELECT * FROM sb.accounts a LEFT JOIN sb.images i ON a.avatar_image_id = i.id WHERE a.id = sb.current_account_id() AND i.public_id = avatar_public_id) THEN
		INSERT INTO sb.images (public_id) VALUES (avatar_public_id);
	END IF;
	
	UPDATE sb.accounts
	SET name = update_account.name, avatar_image_id = (
		SELECT id FROM sb.images i WHERE i.public_id = avatar_public_id
	)
	WHERE id = sb.current_account_id();
	
	RETURN 1;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.send_activation_again(
	)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE activation_code character varying;
DECLARE activated_email character varying;
DECLARE account_language character varying;
begin
	SELECT ea.activation_code, ea.email, a.language
	INTO block.activation_code, block.activated_email, block.account_language
	FROM sb.email_activations ea INNER JOIN sb.accounts a ON a.id = ea.account_id
	WHERE a.id = current_account_id() AND ea.activated IS NULL
	ORDER BY ea.created DESC
	LIMIT 1;
	
	IF block.activation_code IS NULL THEN
		RETURN 2;
	END IF;
	
	PERFORM sb.add_job('mailActivation',
		json_build_object('email', LOWER(block.activated_email), 'code', block.activation_code, 'lang', block.account_language));
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.send_activation_again()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.send_activation_again() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.send_activation_again() TO sb;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.4';
END;
$body$
LANGUAGE 'plpgsql'; 