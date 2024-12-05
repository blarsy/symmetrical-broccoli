ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN willing_to_contribute boolean NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN amount_of_topes integer NOT NULL DEFAULT 0;

CREATE TABLE sb.topes_transaction_types
(
    id integer NOT NULL,
    code character varying NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS sb.topes_transaction_types
    OWNER to sb;
	
GRANT SELECT ON TABLE sb.topes_transaction_types TO identified_account;

CREATE TABLE sb.accounts_topes_transactions
(
    id serial NOT NULL,
    account_id integer NOT NULL,
    topes_transaction_type_id integer NOT NULL,
    movement integer NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT fk_accounts_topes_transactions_accounts FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT fk_accounts_topes_transactions_topes_transaction_types FOREIGN KEY (topes_transaction_type_id)
        REFERENCES sb.topes_transaction_types (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS sb.accounts_topes_transactions
    OWNER to sb;

GRANT SELECT ON TABLE sb.accounts_topes_transactions TO identified_account;

ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN suspended timestamp with time zone;
ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN paid_until timestamp with time zone;

CREATE OR REPLACE FUNCTION sb.suggested_resources(
	search_term text,
	is_product boolean,
	is_service boolean,
	can_be_gifted boolean,
	can_be_exchanged boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	category_codes integer[],
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
	  AND r.suspended IS NULL
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
		 (suggested_resources.reference_location_latitude = 0 AND suggested_resources.reference_location_longitude = 0)
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

CREATE OR REPLACE FUNCTION sb.top_resources(
	)
    RETURNS SETOF resources 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

SELECT *
FROM sb.resources r
WHERE deleted IS NULL AND suspended IS NULL AND expiration > NOW() AND
(SELECT COUNT(*) FROM sb.resources_images WHERE resource_id = r.id) > 0
ORDER BY r.created DESC LIMIT 10;

$BODY$;

CREATE OR REPLACE FUNCTION sb.apply_resources_consumption(
	account_id integer)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE current_amount_of_topes INTEGER;
DECLARE amount_to_burn INTEGER = 0;
DECLARE idx INTEGER = 0;
DECLARE r RECORD;
DECLARE new_paid_until TIMESTAMPTZ;
BEGIN
	SELECT amount_of_topes INTO current_amount_of_topes
	FROM sb.accounts
	WHERE activated IS NOT NULL AND 
		id = apply_resources_consumption.account_id AND
		(
			SELECT COUNT(*) 
			FROM sb.resources res
			WHERE res.account_id = apply_resources_consumption.account_id AND 
				deleted IS NULL AND expiration > NOW()
		) > 2;

	IF current_amount_of_topes IS NOT NULL THEN
		FOR r IN
			SELECT id, paid_until, suspended FROM sb.resources res
			WHERE res.account_id = apply_resources_consumption.account_id AND 
				deleted IS NULL AND expiration > NOW() AND 
				(paid_until <= NOW() OR paid_until IS NULL)
			ORDER BY created ASC
		LOOP
			-- skip free resources
			IF idx > 1 THEN
				IF amount_to_burn = current_amount_of_topes THEN
					UPDATE sb.resources SET suspended = NOW()
					WHERE id = r.id;
				ELSE
					IF r.paid_until < (NOW() - INTERVAL '1 day') OR r.paid_until IS NULL THEN
						new_paid_until = NOW() + INTERVAL '1 day';
					ELSE
						new_paid_until = r.paid_until + INTERVAL '1 day';
					END IF;

					UPDATE sb.resources SET paid_until = new_paid_until, suspended = NULL
					WHERE id = r.id;
					amount_to_burn = amount_to_burn + 1;
				END IF;
			ELSE
				-- If the resource was suspended, make it available again
				UPDATE sb.resources SET suspended = NULL
				WHERE id = r.id;
			END IF;
			
			idx = idx + 1;
		END LOOP;
		
		IF amount_to_burn > 0 THEN
			UPDATE sb.accounts SET amount_of_topes = amount_of_topes - amount_to_burn
			WHERE id = apply_resources_consumption.account_id;
			
			PERFORM pg_notify('graphql:account_changed:' || account_id, json_build_object(
				'event', 'account_changed',
				'subject', apply_resources_consumption.account_id
			)::text);
		END IF;

	END IF;
END;
$BODY$;

ALTER FUNCTION sb.apply_resources_consumption(integer)
    OWNER TO sb;
	
GRANT EXECUTE ON FUNCTION sb.apply_resources_consumption(integer) TO identified_account;

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
	category_codes integer[],
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
		title, description, expiration, account_id, created, is_service, is_product, can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted, specific_location_id, paid_until)
	VALUES (create_resource.title, create_resource.description, create_resource.expiration, sb.current_account_id(),
			NOW(), create_resource.is_service, create_resource.is_product, create_resource.can_be_delivered,
			create_resource.can_be_taken_away, create_resource.can_be_exchanged, create_resource.can_be_gifted, location_id, NOW())
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
	
	PERFORM sb.apply_resources_consumption(sb.current_account_id());
	
	IF (SELECT activated FROM sb.accounts WHERE id = sb.current_account_id()) IS NOT NULL AND
		(SELECT suspended FROM sb.resources WHERE id = inserted_id) IS NULL THEN
		-- Emit notification for push notification handling
		PERFORM pg_notify('resource_created', json_build_object(
			'resource_id', inserted_id
		)::text);
	END IF;
	
	RETURN inserted_id;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.update_resource(
	resource_id integer,
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
	category_codes integer[],
	specific_location new_location)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE ids_images_to_delete INTEGER[];
DECLARE location_id INTEGER = NULL;
DECLARE location_to_delete_id INTEGER = NULL;
BEGIN
	--Detect attempt to update a resource owned by another account
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = update_resource.resource_id AND account_id = sb.current_account_id()) THEN
		RETURN 0;
	END IF;
	
	--Detect attempt to update a resource already deleted
	IF EXISTS(SELECT * FROM sb.resources WHERE id = update_resource.resource_id AND deleted IS NOT NULL) THEN
		RETURN -1;
	END IF;
	
	SELECT specific_location_id INTO location_id
	FROM sb.resources
	WHERE id = resource_id;

	IF specific_location IS NOT NULL THEN
		IF location_id IS NULL THEN
			INSERT INTO sb.locations (address, latitude, longitude)
			VALUES (specific_location.address, specific_location.latitude, specific_location.longitude)
			RETURNING id INTO location_id;
		ELSE
			UPDATE sb.locations SET address = specific_location.address, latitude = specific_location.latitude, longitude = specific_location.longitude
			WHERE id = location_id;
		END IF;
	ELSE
		IF location_id IS NOT NULL THEN
			SELECT location_id INTO location_to_delete_id;
		END IF;
		SELECT null INTO location_id;
	END IF;

	UPDATE sb.resources r SET title = update_resource.title, description = update_resource.description, 
		expiration = update_resource.expiration, is_service = update_resource.is_service, 
		is_product = update_resource.is_product, can_be_delivered = update_resource.can_be_delivered, 
		can_be_taken_away = update_resource.can_be_taken_away, can_be_exchanged = update_resource.can_be_exchanged, 
		can_be_gifted = update_resource.can_be_gifted, specific_location_id = location_id
	WHERE r.id = update_resource.resource_id;
	
	IF location_to_delete_id IS NOT NULL THEN
		DELETE FROM sb.locations WHERE id = location_to_delete_id;
	END IF;
	DELETE FROM sb.resources_resource_categories rrc WHERE rrc.resource_id = update_resource.resource_id;
	INSERT INTO sb.resources_resource_categories (resource_id, resource_category_code)
	SELECT update_resource.resource_id, UNNEST(category_codes);
	
	ids_images_to_delete = ARRAY(SELECT image_id FROM sb.resources_images ri
		WHERE ri.resource_id = update_resource.resource_id);
	
	DELETE FROM sb.resources_images ri WHERE ri.resource_id = update_resource.resource_id;
	DELETE FROM sb.images i WHERE i.id IN (SELECT UNNEST(ids_images_to_delete));
	WITH inserted_images AS (
		INSERT INTO sb.images (public_id)
		SELECT UNNEST(images_public_ids)
		RETURNING id AS inserted_image_id
	)
	INSERT INTO sb.resources_images (resource_id, image_id)
	SELECT update_resource.resource_id, inserted_images.inserted_image_id FROM inserted_images;
	
	PERFORM sb.apply_resources_consumption(sb.current_account_id());
	
	RETURN 1;
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
	
	UPDATE sb.resources r
	SET deleted = NOW()
	WHERE r.id = delete_resource.resource_id;
	
	PERFORM sb.apply_resources_consumption(sb.current_account_id());
	
	RETURN 1;
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
DECLARE res record;
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
		
		UPDATE sb.resources SET paid_until = NOW()
		WHERE deleted IS NULL AND expiration > NOW() AND 
				account_id = id_account_to_activate;
		
		PERFORM sb.apply_resources_consumption(sb.current_account_id());
		
		FOR res IN
			SELECT id 
			FROM sb.resources
			WHERE deleted IS NULL AND expiration > NOW() AND 
				account_id = id_account_to_activate AND
				suspended IS NULL
		LOOP
			-- Emit notification for push notification handling
			PERFORM pg_notify('resource_created', json_build_object(
				'resource_id', res.id
			)::text);
		END LOOP;
	ELSE
		UPDATE sb.accounts SET email = new_email
		WHERE id = id_account_to_activate;
	END IF;
	
	UPDATE sb.email_activations ea
	SET activated = NOW()
	WHERE ea.activation_code = activate_account.activation_code;
	
	PERFORM pg_notify('graphql:account_changed:' || id_account_to_activate, json_build_object(
		'event', 'account_changed',
		'subject', id_account_to_activate
	)::text);
	
	RETURN account_lang;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.apply_resources_consumption()
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE r RECORD;
BEGIN
	FOR r IN
		SELECT id FROM sb.accounts
		WHERE email IS NOT NULL AND email <> '' AND
			activated IS NOT NULL
	LOOP
		PERFORM sb.apply_resources_consumption(r.id);
	END LOOP;
END;
$BODY$;

ALTER FUNCTION sb.apply_resources_consumption()
    OWNER TO sb;

ALTER TYPE sb.session_data
    ADD ATTRIBUTE willing_to_contribute boolean;
	
ALTER TYPE sb.session_data
    ADD ATTRIBUTE amount_of_topes integer;

CREATE OR REPLACE FUNCTION sb.switch_to_contribution_mode()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
BEGIN
	IF NOT EXISTS(SELECT * FROM sb.accounts WHERE id = sb.current_account_id() AND willing_to_contribute) THEN
		UPDATE sb.accounts
		SET willing_to_contribute = true, amount_of_topes = amount_of_topes + 30
		WHERE id = sb.current_account_id();
	
		PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
			'event', 'account_changed',
			'subject', sb.current_account_id()
		)::text);
	
		RETURN 1;
	END IF;
	
	RETURN 0;
end;
$BODY$;

ALTER FUNCTION sb.switch_to_contribution_mode()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.switch_to_contribution_mode() TO identified_account;

CREATE OR REPLACE FUNCTION sb.get_session_data()
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
	) as number_of_unread_notifications,
	a.willing_to_contribute, a.amount_of_topes

	FROM sb.accounts a
	LEFT JOIN sb.images i ON a.avatar_image_id = i.id
	WHERE a.id = sb.current_account_id()
$BODY$;

CREATE OR REPLACE FUNCTION sb.get_my_resources_without_picture()
    RETURNS SETOF resources 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT r.*
	FROM sb.resources r
	LEFT JOIN sb.resources_images ri ON ri.resource_id = r.id
	WHERE r.account_id = sb.current_account_id() AND r.deleted IS NULL AND r.expiration > NOW()
		AND ri.resource_id IS NULL;
$BODY$;

ALTER FUNCTION sb.get_my_resources_without_picture()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_my_resources_without_picture() TO identified_account;

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
	
	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN 1;
end;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.9.0', minimum_client_version = '0.9.0';
END;
$body$
LANGUAGE 'plpgsql'; 