CREATE TABLE sb.link_types
(
    id integer NOT NULL,
    name character varying NOT NULL,
    CONSTRAINT link_types_pk PRIMARY KEY (id)
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.link_types
    OWNER to sb;

GRANT SELECT ON TABLE sb.link_types TO anonymous;

GRANT INSERT, DELETE, SELECT, UPDATE ON TABLE sb.link_types TO identified_account;

GRANT ALL ON TABLE sb.link_types TO sb;

DO
$body$
BEGIN
    INSERT INTO sb.link_types (id, name) VALUES (1, 'Facebook');
    INSERT INTO sb.link_types (id, name) VALUES (2, 'Instagram');
    INSERT INTO sb.link_types (id, name) VALUES (3, 'Twitter');
    INSERT INTO sb.link_types (id, name) VALUES (4, 'Web');
END;
$body$
LANGUAGE 'plpgsql'; 

CREATE SEQUENCE IF NOT EXISTS sb.accounts_links_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE sb.accounts_links_id_seq
    OWNER TO sb;

GRANT USAGE ON SEQUENCE sb.accounts_links_id_seq TO identified_account;

GRANT ALL ON SEQUENCE sb.accounts_links_id_seq TO sb;

CREATE TABLE IF NOT EXISTS sb.accounts_links
(
    id integer  NOT NULL DEFAULT nextval('accounts_links_id_seq'::regclass),
    url character varying COLLATE pg_catalog."default" NOT NULL,
	label character varying COLLATE pg_catalog."default" NULL,
    link_type_id integer NOT NULL,
    account_id integer NOT NULL,
    CONSTRAINT accounts_links_pkey PRIMARY KEY (id),
    CONSTRAINT accounts_accounts_links FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT accounts_links_link_types FOREIGN KEY (link_type_id)
        REFERENCES sb.link_types (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.accounts_links
    OWNER to sb;

GRANT SELECT ON TABLE sb.accounts_links TO anonymous;

GRANT INSERT, DELETE, SELECT, UPDATE ON TABLE sb.accounts_links TO identified_account;

GRANT ALL ON TABLE sb.accounts_links TO sb;

CREATE TYPE sb.account_link AS
(
	url text,
	label text,
	link_type_id integer
);

ALTER TYPE sb.account_link
    OWNER TO sb;

GRANT USAGE ON TYPE sb.account_link TO anonymous;

GRANT USAGE ON TYPE sb.account_link TO identified_account;

DROP FUNCTION IF EXISTS sb.update_account(character varying, character varying, character varying);

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
BEGIN
	SELECT a.email, a.language
	INTO current_email, account_language
	FROM sb.accounts a
	WHERE a.id = sb.current_account_id();
	
	IF update_account.email IS NOT NULL AND update_account.email <> '' AND current_email <> LOWER(update_account.email) THEN
		SELECT array_to_string(ARRAY(SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
		INTO block.activation_code;
		
		INSERT INTO sb.email_activations (account_id, email, activation_code)
		VALUES (sb.current_account_id(), LOWER(update_account.email), block.activation_code);
		
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

ALTER FUNCTION sb.update_account(character varying, character varying, character varying)
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.update_account_public_info(
	links sb.account_link[])
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
BEGIN
	DELETE FROM sb.accounts_links
	WHERE account_id = sb.current_account_id();
	
	INSERT INTO sb.accounts_links(url, label, link_type_id, account_id)
	SELECT l.url, l.label, l.link_type_id, sb.current_account_id()
	FROM UNNEST(links) l;
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.update_account_public_info(sb.account_link[])
    OWNER TO sb;

-- Broadcaster
CREATE SEQUENCE IF NOT EXISTS sb.broadcast_prefs_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE sb.broadcast_prefs_id_seq
    OWNER TO sb;

GRANT USAGE ON SEQUENCE sb.broadcast_prefs_id_seq TO identified_account;

GRANT ALL ON SEQUENCE sb.broadcast_prefs_id_seq TO sb;

CREATE TABLE sb.broadcast_prefs
(
    id integer NOT NULL DEFAULT nextval('broadcast_prefs_id_seq'::regclass),
    event_type integer NOT NULL,
    account_id integer NOT NULL,
    days_between_summaries integer,
	last_summary_sent timestamp without time zone NULL,
    created timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT broadcast_prefs_pk PRIMARY KEY (id),
    CONSTRAINT broadcast_prefs_accounts_fk FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS sb.broadcast_prefs
    OWNER to sb;

GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE sb.broadcast_prefs TO sb;

GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE sb.broadcast_prefs TO identified_account;

INSERT INTO sb.broadcast_prefs (event_type, account_id, days_between_summaries)
SELECT 2, a.id, 1
FROM sb.accounts a;

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
DECLARE destinator_name TEXT;
DECLARE target_push_token TEXT;
DECLARE days_summary INTEGER;

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

    SELECT a.name INTO created_message_sender
    FROM sb.accounts a
    WHERE a.id = sb.current_account_id();
	
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
	
	SELECT a.id, a.name, apt.token INTO destinator_id, destinator_name, target_push_token FROM sb.accounts a
	INNER JOIN sb.participants p ON a.id = p.account_id
	LEFT JOIN sb.accounts_push_tokens apt ON a.id = apt.account_id
	WHERE p.id = destinator_participant_id;

	-- Emit notification for graphql/postgraphile's subscription plugin
	PERFORM pg_notify('graphql:message_account:' || destinator_id, json_build_object(
		'event', 'message_created',
		'subject', created_message_id
	)::text);
	
	SELECT days_between_summaries INTO days_summary FROM sb.broadcast_prefs bp
	WHERE bp.account_id = sb.current_account_id() AND bp.event_type = 1;

	IF days_summary IS NULL THEN
		IF target_push_token IS NOT NULL THEN
			-- Emit notification for push notification handling
			PERFORM pg_notify('message_created', json_build_object(
				'message_id', created_message_id,
				'text', created_message_text,
				'sender', created_message_sender,
				'push_token', target_push_token,
				'resource_id', create_message.resource_id,
				'other_account_id', create_message.other_account_id,
				'other_account_name', destinator_name
			)::text);
		END IF;
	END IF;
	
	RETURN created_message_id;
END;
$BODY$;

CREATE OR REPLACE FUNCTION sb.create_resource(
	title character varying,
	description character varying,
	expiration timestamp without time zone,
	is_service boolean,
	is_product boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	can_be_exchanged boolean,
	can_be_gifted boolean,
	images_public_ids character varying[],
	category_codes character varying[])
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
declare inserted_id integer;
DECLARE days_summary INTEGER;
begin
	INSERT INTO sb.resources(
	title, description, expiration, account_id, created, is_service, is_product, can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted)
	VALUES (create_resource.title, create_resource.description, create_resource.expiration, sb.current_account_id(),
			NOW(), create_resource.is_service, create_resource.is_product, create_resource.can_be_delivered,
			create_resource.can_be_taken_away, create_resource.can_be_exchanged, create_resource.can_be_gifted)
	RETURNING id INTO inserted_id;
	
	INSERT INTO sb.resources_resource_categories (resource_id, resource_category_code)
	SELECT inserted_id, UNNEST(category_codes);
	
	WITH inserted_images AS (
		INSERT INTO sb.images (public_id)
		SELECT UNNEST(images_public_ids)
		RETURNING id AS inserted_image_id
	)
	INSERT INTO sb.resources_images (resource_id, image_id)
	SELECT inserted_id, inserted_images.inserted_image_id FROM inserted_images;
	
	SELECT days_between_summaries INTO days_summary FROM sb.broadcast_prefs bp
	WHERE bp.account_id = sb.current_account_id() AND bp.event_type = 2;

	IF days_summary IS NULL THEN
		-- Emit notification for push notification handling
		PERFORM pg_notify('resource_created', json_build_object(
			'resource_id', inserted_id,
			'title', create_resource.title,
			'account_name', (SELECT name FROM sb.accounts WHERE id = sb.current_account_id()),
			'push_token', (SELECT token FROM sb.accounts_push_tokens apt WHERE 
				NOT EXISTS (SELECT bp.id FROM sb.broadcast_prefs bp WHERE apt.account_id = bp.account_id)
				AND account_id != sb.current_account_id())
		)::text);
	END IF;
	
	RETURN inserted_id;
end;
$BODY$;

DROP VIEW sb.active_accounts;

ALTER TABLE sb.resources
    ALTER COLUMN expiration TYPE timestamp with time zone ;

ALTER TABLE sb.resources
    ALTER COLUMN created TYPE timestamp with time zone ;

ALTER TABLE sb.resources
    ALTER COLUMN deleted TYPE timestamp with time zone ;
	
ALTER TABLE sb.accounts
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.accounts_push_tokens
    ALTER COLUMN last_time_used TYPE timestamp with time zone ;
	
ALTER TABLE sb.broadcast_prefs
    ALTER COLUMN last_summary_sent TYPE timestamp with time zone ;
	
ALTER TABLE sb.broadcast_prefs
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.client_logs
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.conversations
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.email_activations
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.email_activations
    ALTER COLUMN activated TYPE timestamp with time zone ;
	
ALTER TABLE sb.images
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.messages
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.messages
    ALTER COLUMN received TYPE timestamp with time zone ;
	
ALTER TABLE sb.participants
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.resource_categories
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.resources_images
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.resources_resource_categories
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.system
    ALTER COLUMN created TYPE timestamp with time zone ;
	
ALTER TABLE sb.unread_messages
    ALTER COLUMN created TYPE timestamp with time zone ;


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
  WHERE accounts.activated IS NOT NULL AND accounts.name::text <> ''::text AND accounts.name IS NOT NULL;

ALTER TABLE sb.active_accounts
    OWNER TO sb;

GRANT SELECT ON TABLE sb.active_accounts TO anonymous;
GRANT SELECT ON TABLE sb.active_accounts TO identified_account;
GRANT ALL ON TABLE sb.active_accounts TO sb;



CREATE TYPE sb.broadcast_pref_type AS
(
	event_type integer,
	days_between_summaries integer
);

ALTER TYPE sb.broadcast_pref_type
    OWNER TO sb;

GRANT USAGE ON TYPE sb.broadcast_pref_type TO PUBLIC;

GRANT USAGE ON TYPE sb.broadcast_pref_type TO anonymous;

GRANT USAGE ON TYPE sb.broadcast_pref_type TO identified_account;

GRANT USAGE ON TYPE sb.broadcast_pref_type TO sb;

CREATE OR REPLACE FUNCTION sb.update_account_broadcast_prefs(
	prefs broadcast_pref_type[])
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
BEGIN
	DELETE FROM sb.broadcast_prefs
	WHERE account_id = sb.current_account_id();
	
	INSERT INTO sb.broadcast_prefs(event_type, account_id, days_between_summaries)
	SELECT p.event_type, sb.current_account_id(), p.days_between_summaries
	FROM UNNEST(prefs) p;
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.update_account_broadcast_prefs(broadcast_pref_type[])
    OWNER TO sb;

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
    accounts.language,
	accounts.log_level
   FROM accounts
  WHERE accounts.activated IS NOT NULL AND accounts.name::text <> ''::text AND accounts.name IS NOT NULL;

CREATE OR REPLACE FUNCTION sb.top_accounts(
	)
    RETURNS SETOF accounts 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

SELECT *
FROM sb.active_accounts aa
WHERE aa.avatar_image_id IS NOT NULL AND
(SELECT COUNT(*) FROM sb.resources WHERE account_id = aa.id) > 1
ORDER BY aa.created DESC LIMIT 10;

$BODY$;

ALTER FUNCTION sb.top_accounts()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.top_accounts() TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.top_accounts() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.top_accounts() TO sb;

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
	
	INSERT INTO sb.broadcast_prefs (event_type, account_id, days_between_summaries)
	VALUES (2, inserted_id, 1);
	
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

CREATE OR REPLACE FUNCTION sb.create_resource(
	title character varying,
	description character varying,
	expiration timestamp without time zone,
	is_service boolean,
	is_product boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	can_be_exchanged boolean,
	can_be_gifted boolean,
	images_public_ids character varying[],
	category_codes character varying[])
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
declare inserted_id integer;
begin
	INSERT INTO sb.resources(
	title, description, expiration, account_id, created, is_service, is_product, can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted)
	VALUES (create_resource.title, create_resource.description, create_resource.expiration, sb.current_account_id(),
			NOW(), create_resource.is_service, create_resource.is_product, create_resource.can_be_delivered,
			create_resource.can_be_taken_away, create_resource.can_be_exchanged, create_resource.can_be_gifted)
	RETURNING id INTO inserted_id;
	
	INSERT INTO sb.resources_resource_categories (resource_id, resource_category_code)
	SELECT inserted_id, UNNEST(category_codes);
	
	WITH inserted_images AS (
		INSERT INTO sb.images (public_id)
		SELECT UNNEST(images_public_ids)
		RETURNING id AS inserted_image_id
	)
	INSERT INTO sb.resources_images (resource_id, image_id)
	SELECT inserted_id, inserted_images.inserted_image_id FROM inserted_images;
	
	-- Emit notification for push notification handling
	PERFORM pg_notify('resource_created', json_build_object(
		'resource_id', inserted_id,
		'title', create_resource.title,
		'account_name', (SELECT name FROM sb.accounts WHERE id = sb.current_account_id()),
		'push_tokens', (SELECT ARRAY(SELECT token FROM sb.accounts_push_tokens apt WHERE 
			(NOT EXISTS (SELECT bp.id FROM sb.broadcast_prefs bp WHERE apt.account_id = bp.account_id AND bp.event_type = 2) OR 
			(SELECT bp.days_between_summaries FROM sb.broadcast_prefs bp WHERE apt.account_id = bp.account_id AND bp.event_type = 2) = -1 )
			AND account_id != sb.current_account_id()))
	)::text);
	
	RETURN inserted_id;
end;
$BODY$;

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
DECLARE destinator_name TEXT;
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

    SELECT a.name INTO created_message_sender
    FROM sb.accounts a
    WHERE a.id = sb.current_account_id();
	
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
	
	SELECT a.id, a.name, apt.token INTO destinator_id, destinator_name, target_push_token FROM sb.accounts a
	INNER JOIN sb.participants p ON a.id = p.account_id
	LEFT JOIN sb.accounts_push_tokens apt ON a.id = apt.account_id
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
			'other_account_id', create_message.other_account_id,
			'other_account_name', destinator_name
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
  AND r.deleted IS NULL
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
	(r.title ILIKE '%' || search_term || '%' OR 
	 r.description ILIKE '%' || search_term || '%' OR
	 a.name ILIKE '%' || search_term || '%'))
  ORDER BY COALESCE(r.deleted, LOCALTIMESTAMP) DESC, r.expiration DESC;
 
$BODY$;


DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.6.0', minimum_client_version = '0.6.0';
END;
$body$
LANGUAGE 'plpgsql'; 