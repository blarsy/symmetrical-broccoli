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
	category_codes character varying[],
	specific_location new_location)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id INTEGER;
DECLARE location_id INTEGER = NULL;
BEGIN
	IF specific_location IS NOT NULL THEN
		INSERT INTO sb.locations (address, latitude, longitude)
		VALUES (specific_location.address, specific_location.latitude, specific_location.longitude)
		RETURNING id INTO location_id;
	END IF;

	INSERT INTO sb.resources(
	title, description, expiration, account_id, created, is_service, is_product, can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted, specific_location_id)
	VALUES (create_resource.title, create_resource.description, create_resource.expiration, sb.current_account_id(),
			NOW(), create_resource.is_service, create_resource.is_product, create_resource.can_be_delivered,
			create_resource.can_be_taken_away, create_resource.can_be_exchanged, create_resource.can_be_gifted, location_id)
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
        'resource_id', inserted_id
    )::text);
	
	RETURN inserted_id;
end;
$BODY$;

CREATE TABLE sb.notifications
(
    id serial NOT NULL,
    account_id integer NOT NULL,
    data json NOT NULL,
    read timestamp with time zone,
    created timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT notifications_pk PRIMARY KEY (id),
    CONSTRAINT notifications_accounts_fk FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS sb.notifications
    OWNER to sb;

GRANT SELECT, UPDATE ON TABLE sb.notifications TO identified_account;

GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE sb.notifications TO sb;

CREATE OR REPLACE FUNCTION sb.get_accounts_to_notify_of_new_resource(
	resource_id integer)
    RETURNS integer[]
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE results INTEGER[];
BEGIN
	results := ARRAY(SELECT 
		id
	FROM sb.active_accounts
	WHERE id <> (SELECT account_id FROM sb.resources WHERE id = resource_id));
	
	RETURN results;
end;
$BODY$;

ALTER FUNCTION sb.get_accounts_to_notify_of_new_resource(integer)
    OWNER TO sb;


CREATE OR REPLACE FUNCTION sb.create_new_resource_notifications(
	resource_id integer,
	accounts_to_notify integer[])
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE n RECORD;
BEGIN
	FOR n IN
		INSERT INTO sb.notifications (account_id, data)
		SELECT
			UNNEST(accounts_to_notify), 
			json_build_object('resource_id', resource_id)
		RETURNING id, account_id
	LOOP
		-- Emit notification for graphql/postgraphile's subscription plugin
		PERFORM pg_notify('graphql:notification_account:' || n.account_id, json_build_object(
			'event', 'notification_created',
			'subject', n.id
		)::text);
	END LOOP;
		
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.create_new_resource_notifications(integer, integer[])
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.my_notifications()
    RETURNS SETOF notifications
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$
	SELECT *
	FROM sb.notifications
	WHERE account_id = sb.current_account_id()
	ORDER BY created DESC;
$BODY$;

ALTER FUNCTION sb.my_notifications()
    OWNER TO sb;
GRANT EXECUTE ON FUNCTION sb.my_notifications() TO identified_account;

CREATE OR REPLACE FUNCTION sb.get_resources(
		resource_ids INTEGER[]
	)
    RETURNS SETOF resources
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$
	SELECT *
	FROM sb.resources r
	WHERE id = ANY(resource_ids);
$BODY$;

ALTER FUNCTION sb.get_resources(integer[])
    OWNER TO sb;
GRANT EXECUTE ON FUNCTION sb.get_resources(integer[]) TO identified_account;

CREATE OR REPLACE FUNCTION sb.set_notifications_read()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	UPDATE sb.notifications SET read = NOW()
	WHERE account_id = sb.current_account_id();

	PERFORM pg_notify('graphql:notification_account:' || sb.current_account_id(), json_build_object(
		'event', 'notifications_read',
		'subject', ''
	)::text);

	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.set_notifications_read()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.set_notifications_read() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.set_notifications_read() TO sb;

CREATE OR REPLACE FUNCTION sb.set_notification_read(
	notification_id INTEGER)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	UPDATE sb.notifications SET read = NOW()
	WHERE id = notification_id AND account_id = sb.current_account_id();

	PERFORM pg_notify('graphql:notification_account:' || sb.current_account_id(), json_build_object(
		'event', 'notifications_read',
		'subject', ''
	)::text);

	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.set_notification_read(integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.set_notification_read(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.set_notification_read(integer) TO sb;

ALTER TYPE sb.session_data
    ADD ATTRIBUTE unread_conversations integer[];
ALTER TYPE sb.session_data
    ADD ATTRIBUTE number_of_unread_notifications integer;

CREATE OR REPLACE FUNCTION sb.get_session_data(
	)
    RETURNS session_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
SELECT a.id, a.name, a.email, sb.current_role(), 
i.public_id as avatar_public_id, a.activated, a.log_level,
ARRAY(
	SELECT DISTINCT um.participant_id
	FROM sb.unread_messages um
	INNER JOIN sb.participants p ON p.id = um.participant_id
	WHERE p.account_id = sb.current_account_id()
) as unread_conversations,
(
	SELECT COUNT(*) 
	FROM sb.notifications n 
	WHERE n.account_id = sb.current_account_id() AND n.read IS NULL
) as number_of_unread_notifications

FROM sb.accounts a
LEFT JOIN sb.images i ON a.avatar_image_id = i.id
WHERE a.id = sb.current_account_id()
$BODY$;

CREATE TABLE sb.searches
(
    id serial NOT NULL,
    term character varying,
    is_product boolean,
    is_service boolean,
    can_be_gifted boolean,
    can_be_exchanged boolean,
    can_be_delivered boolean,
    can_be_taken_away boolean,
    category_codes character varying[],
    reference_location_latitude numeric,
    reference_location_longitude numeric,
    distance_to_reference_location numeric,
	exclude_unlocated boolean,
    account_id integer NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT searches_pk PRIMARY KEY (id)
        INCLUDE(id),
    CONSTRAINT searches_account_fk FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS sb.searches
    OWNER to sb;
	
GRANT INSERT ON TABLE sb.searches TO anonymous;

GRANT INSERT ON TABLE sb.searches TO identified_account;

GRANT USAGE ON SEQUENCE sb.searches_id_seq TO anonymous;

GRANT USAGE ON SEQUENCE sb.searches_id_seq TO identified_account;

CREATE OR REPLACE FUNCTION sb.geodistance(alat double precision, alng double precision, blat double precision, blng double precision)
  RETURNS double precision AS
$BODY$
SELECT asin(
  sqrt(
    sin(radians($3-$1)/2)^2 +
    sin(radians($4-$2)/2)^2 *
    cos(radians($1)) *
    cos(radians($3))
  )
) * 12742 AS distance;
$BODY$
  LANGUAGE sql IMMUTABLE
  COST 100;

DROP FUNCTION IF EXISTS sb.suggested_resources(text, boolean, boolean, boolean, boolean, boolean, boolean, character varying[]);

CREATE OR REPLACE FUNCTION sb.suggested_resources(
	search_term text,
	is_product boolean,
	is_service boolean,
	can_be_gifted boolean,
	can_be_exchanged boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	category_codes character varying[],
	reference_location_latitude numeric,
	reference_location_longitude numeric,
	distance_to_reference_location numeric,
	exclude_unlocated boolean)
    RETURNS SETOF resources 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
	INSERT INTO sb.searches (term, is_product, is_service, can_be_gifted, 
		can_be_exchanged, can_be_delivered, can_be_taken_away, category_codes, 
		reference_location_latitude, reference_location_longitude, 
		distance_to_reference_location, account_id, exclude_unlocated) 
	VALUES
		(suggested_resources.search_term, suggested_resources.is_product, suggested_resources.is_service, 
		 suggested_resources.can_be_gifted, suggested_resources.can_be_exchanged, 
		 suggested_resources.can_be_delivered, suggested_resources.can_be_taken_away, 
		 suggested_resources.category_codes, suggested_resources.reference_location_latitude, 
		 suggested_resources.reference_location_longitude, suggested_resources.distance_to_reference_location,
		 sb.current_account_id(), suggested_resources.exclude_unlocated);

	RETURN QUERY
	SELECT r.*
	  FROM sb.resources r
	  LEFT JOIN sb.active_accounts a ON a.id = r.account_id
	  LEFT JOIN sb.locations l ON l.id = r.specific_location_id
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
	  AND(
		 distance_to_reference_location = 0 
		 OR 
		 (r.specific_location_id IS NULL AND NOT suggested_resources.exclude_unlocated)
		 OR
		 (select sb.geodistance(suggested_resources.reference_location_latitude, suggested_resources.reference_location_longitude, l.latitude, l.longitude) <= suggested_resources.distance_to_reference_location)
	  )
	  AND
	  (search_term = '' OR 
		(r.title ILIKE '%' || search_term || '%' OR 
		 r.description ILIKE '%' || search_term || '%' OR
		 a.name ILIKE '%' || search_term || '%'))
	  ORDER BY created DESC, r.expiration DESC;
END;
$BODY$;

CREATE TABLE IF NOT EXISTS sb.google_auth_tokens
(
    email character varying COLLATE pg_catalog."default" NOT NULL,
    token character varying COLLATE pg_catalog."default" NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    updated timestamp with time zone NOT NULL DEFAULT now()
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.google_auth_tokens
    OWNER to sb;

GRANT SELECT ON TABLE sb.google_auth_tokens TO anonymous;

GRANT SELECT ON TABLE sb.google_auth_tokens TO identified_account;

GRANT ALL ON TABLE sb.google_auth_tokens TO sb;

CREATE OR REPLACE FUNCTION sb.update_google_auth_status(
	email character varying,
	token character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare account_id INTEGER;
declare current_token character varying;
begin
  SELECT a.id, gat.token INTO account_id, current_token
    FROM sb.accounts AS a
	LEFT JOIN sb.google_auth_tokens gat ON gat.email = a.email
    WHERE a.email = LOWER(update_google_auth_status.email);

  IF account_id IS NOT NULL THEN
    IF current_token IS NULL THEN
		INSERT INTO sb.google_auth_tokens (email, token)
		VALUES (update_google_auth_status.email, update_google_auth_status.token);
	ELSE
		UPDATE sb.google_auth_tokens gat
		SET token = update_google_auth_status.token, updated = now()
		WHERE gat.email = update_google_auth_status.email;
	END IF;
	RETURN 2;
  ELSE
  	IF EXISTS(SELECT * FROM sb.google_auth_tokens gat WHERE gat.email = update_google_auth_status.email) THEN
		UPDATE sb.google_auth_tokens gat
		SET token = update_google_auth_status.token, updated = now()
		WHERE gat.email = update_google_auth_status.email;
	ELSE
		INSERT INTO sb.google_auth_tokens (email, token)
		VALUES (update_google_auth_status.email, update_google_auth_status.token);
	END IF;
    RETURN 1;
  END IF;
end;
$BODY$;

ALTER FUNCTION sb.update_google_auth_status(character varying, character varying)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.update_google_auth_status(character varying, character varying) TO sb;

REVOKE ALL ON FUNCTION sb.update_google_auth_status(character varying, character varying) FROM PUBLIC;

ALTER TABLE IF EXISTS sb.accounts
    ALTER COLUMN hash DROP NOT NULL;

ALTER TABLE IF EXISTS sb.accounts
    ALTER COLUMN salt DROP NOT NULL;

CREATE OR REPLACE FUNCTION sb.register_account_external_auth(
	email character varying,
	token character varying,
	account_name character varying,
	language character varying)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id integer;
BEGIN
	IF EXISTS(SELECT *
		FROM sb.google_auth_tokens gat
		WHERE gat.email = LOWER(register_account_external_auth.email) AND
			gat.token = register_account_external_auth.token) THEN
	
		INSERT INTO sb.accounts(name, email, language, activated)
		VALUES (account_name, LOWER(register_account_external_auth.email), 
			register_account_external_auth.language, now())
		RETURNING id INTO inserted_id;

		INSERT INTO sb.broadcast_prefs (event_type, account_id, days_between_summaries)
		VALUES (2, inserted_id, 1);

		RETURN (
			inserted_id,
			EXTRACT(epoch FROM now() + interval '100 day'),
			'identified_account'
		)::sb.jwt_token;
	
  	END IF;
	RETURN NULL;
END;
$BODY$;

ALTER FUNCTION sb.register_account_external_auth(character varying, character varying, character varying, character varying)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.register_account_external_auth(character varying, character varying, character varying, character varying) TO sb;

GRANT EXECUTE ON FUNCTION sb.register_account_external_auth(character varying, character varying, character varying, character varying) TO PUBLIC;

CREATE OR REPLACE FUNCTION sb.authenticate_external_auth(
	email character varying,
	token character varying)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare account_id INTEGER;
begin
  select a.id into account_id
    from sb.accounts as a
	inner join sb.google_auth_tokens gat ON gat.email = a.email
    where a.email = LOWER(authenticate_external_auth.email) and gat.token = authenticate_external_auth.token;

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

ALTER FUNCTION sb.authenticate_external_auth(character varying, character varying)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.authenticate_external_auth(character varying, character varying) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.authenticate_external_auth(character varying, character varying) TO anonymous;

GRANT EXECUTE ON FUNCTION sb.authenticate_external_auth(character varying, character varying) TO sb;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.8.0', minimum_client_version = '0.8.0';
END;
$body$
LANGUAGE 'plpgsql'; 