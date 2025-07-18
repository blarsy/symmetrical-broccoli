ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN willing_to_contribute boolean NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN amount_of_tokens integer NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN unlimited_until timestamp with time zone NULL;
	
ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN last_suspension_warning timestamp with time zone;

ALTER TABLE IF EXISTS sb.system
    ADD COLUMN amount_hours_to_warn_before_suspension integer;

ALTER TABLE IF EXISTS sb.system
    ADD COLUMN amount_free_resources integer;
	
UPDATE sb.system SET amount_hours_to_warn_before_suspension = 48, amount_free_resources = 2;

ALTER TABLE IF EXISTS sb.system
    ALTER COLUMN minimum_client_version SET NOT NULL;

ALTER TABLE IF EXISTS sb.system
    ALTER COLUMN amount_hours_to_warn_before_suspension SET NOT NULL;

ALTER TABLE IF EXISTS sb.system
    ALTER COLUMN amount_free_resources SET NOT NULL;

CREATE TABLE sb.token_transaction_types
(
    id serial NOT NULL,
    code character varying NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS sb.token_transaction_types
    OWNER to sb;
	
GRANT SELECT ON TABLE sb.token_transaction_types TO identified_account;

DO
$body$
BEGIN
	INSERT INTO sb.token_transaction_types(code) VALUES ('ADD_LOGO');
	INSERT INTO sb.token_transaction_types(code) VALUES ('ADD_LOCATION');
	INSERT INTO sb.token_transaction_types(code) VALUES ('ADD_LINK');
	INSERT INTO sb.token_transaction_types(code) VALUES ('ADD_RESOURCE_PICTURE');
	INSERT INTO sb.token_transaction_types(code) VALUES ('CREATE_RESOURCE');
	INSERT INTO sb.token_transaction_types(code) VALUES ('RESOURCE_BURN_TOKEN');
	INSERT INTO sb.token_transaction_types(code) VALUES ('BECOME_CONTRIBUTOR');
END;
$body$
LANGUAGE 'plpgsql'; 

CREATE TABLE sb.accounts_token_transactions
(
    id serial NOT NULL,
    account_id integer NOT NULL,
    token_transaction_type_id integer NOT NULL,
    movement integer NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT fk_accounts_token_transactions_accounts FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT fk_accounts_token_transactions_token_transaction_types FOREIGN KEY (token_transaction_type_id)
        REFERENCES sb.token_transaction_types (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS sb.accounts_token_transactions
    OWNER to sb;

GRANT SELECT, INSERT ON TABLE sb.accounts_token_transactions TO identified_account;

GRANT USAGE ON SEQUENCE sb.accounts_token_transactions_id_seq TO identified_account;

CREATE TABLE sb.resources_accounts_token_transactions
(
    id serial NOT NULL,
    accounts_token_transaction_id integer NOT NULL,
    resource_id integer NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT fk_resources_accounts_token_transactions_resources FOREIGN KEY (resource_id)
        REFERENCES sb.resources (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT fk_resources_accounts_token_transactions_accounts_token_transactions FOREIGN KEY (accounts_token_transaction_id)
        REFERENCES sb.accounts_token_transactions (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    OWNER to sb;

GRANT INSERT, SELECT ON TABLE sb.resources_accounts_token_transactions TO identified_account;

ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN suspended timestamp with time zone;
ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN paid_until timestamp with time zone;
ALTER TABLE IF EXISTS sb.resources
    ALTER COLUMN expiration DROP NOT NULL;
ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN subjective_value integer;

CREATE OR REPLACE FUNCTION sb.apply_resources_rewards(
	resource_id integer)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE amount_to_add integer = 0;
DECLARE att_id integer;
DECLARE resource_account_id integer;
BEGIN
	SELECT account_id FROM sb.resources WHERE id = apply_resources_rewards.resource_id INTO resource_account_id;
	
	-- Check account is activated, and resource is not expired, not deleted, and least 1 day old
	IF EXISTS (SELECT * FROM sb.accounts WHERE id = resource_account_id AND activated IS NOT NULL 
		AND (unlimited_until IS NULL OR unlimited_until < NOW())) 
		AND NOT EXISTS(SELECT * FROM sb.resources WHERE id = apply_resources_rewards.resource_id AND (
			deleted IS NOT NULL OR (expiration IS NOT NULL AND expiration < NOW()) OR created > (NOW() - INTERVAL '1 day')))
	THEN
		-- If there has not been any reward for creating the resource, grant it
		IF NOT EXISTS ( SELECT * 
						FROM sb.resources_accounts_token_transactions ratt
						INNER JOIN sb.accounts_token_transactions att ON ratt.accounts_token_transaction_id = att.id  AND att.token_transaction_type_id = 5
						WHERE ratt.resource_id = apply_resources_rewards.resource_id ) THEN
			amount_to_add = amount_to_add + 20;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 5, 20)
			RETURNING id INTO att_id;
			
			INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
			VALUES (att_id, apply_resources_rewards.resource_id);
		END IF;
		
		-- If a resource image has been added, give the reward
		IF (SELECT COUNT(*) FROM sb.resources_images ri WHERE ri.resource_id = apply_resources_rewards.resource_id) > 0 
			AND NOT EXISTS (SELECT * 
							FROM sb.resources_accounts_token_transactions ratt
							INNER JOIN sb.accounts_token_transactions att ON ratt.accounts_token_transaction_id = att.id  AND att.token_transaction_type_id = 4
							WHERE ratt.resource_id = apply_resources_rewards.resource_id ) THEN
			amount_to_add = amount_to_add + 5;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 4, 5)
			RETURNING id INTO att_id;
			
			INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
			VALUES (att_id, apply_resources_rewards.resource_id);
		END IF;
		
		IF amount_to_add > 0 THEN
			UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + amount_to_add
			WHERE id = resource_account_id;
		END IF;
	END IF;
END;
$BODY$;

ALTER FUNCTION sb.apply_resources_rewards(integer)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.apply_resources_rewards(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sb.apply_resources_rewards(integer) TO identified_account;

CREATE OR REPLACE FUNCTION sb.apply_my_resources_rewards()
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE res record;
BEGIN
	FOR res IN
		SELECT id 
		FROM sb.resources
		WHERE deleted IS NULL AND (expiration IS NULL OR expiration > NOW()) AND 
			account_id = sb.current_account_id()
	-- Loop through active resources - including suspended - to award applicable token rewards
	LOOP
		PERFORM sb.apply_resources_rewards(res.id);
	END LOOP;
END;
$BODY$;

ALTER FUNCTION sb.apply_my_resources_rewards()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.apply_my_resources_rewards() TO identified_account;

CREATE OR REPLACE FUNCTION sb.apply_account_resources_rewards(
	account_id integer) RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE res record;
BEGIN
	FOR res IN
		SELECT id 
		FROM sb.resources r
		WHERE r.deleted IS NULL AND (r.expiration IS NULL OR r.expiration > NOW()) AND 
			r.account_id = apply_account_resources_rewards.account_id
	-- Loop through active resources - including suspended - to award applicable token rewards
	LOOP
		PERFORM sb.apply_resources_rewards(res.id);
	END LOOP;
END;
$BODY$;

ALTER FUNCTION sb.apply_account_resources_rewards(integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.apply_account_resources_rewards(integer) TO sb;

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
	  WHERE (r.expiration > LOCALTIMESTAMP OR r.expiration IS NULL)
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
	  ORDER BY created DESC, r.expiration DESC
	  LIMIT 50;
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
WHERE r.deleted IS NULL AND r.suspended IS NULL AND (r.expiration IS NULL OR r.expiration > NOW()) AND
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
DECLARE current_amount_of_tokens INTEGER;
DECLARE amount_to_burn INTEGER = 0;
DECLARE idx INTEGER = 0;
DECLARE r RECORD;
DECLARE new_paid_until TIMESTAMPTZ;
DECLARE some_resource_suspended BOOLEAN = false;
DECLARE free_resources INTEGER;
DECLARE number_of_resources INTEGER;
DECLARE hours_before_warning INTEGER;
BEGIN
	SELECT amount_free_resources, amount_hours_to_warn_before_suspension 
	FROM sb.system INTO free_resources, hours_before_warning;

	SELECT COUNT(*)
	FROM sb.resources res
	WHERE res.account_id = apply_resources_consumption.account_id AND 
		res.deleted IS NULL AND (res.expiration IS NULL OR res.expiration > NOW())
	INTO number_of_resources;
	-- Make sure current_amount_of_tokens is not null when the account is active, and it has at
	-- least 3 active resources
	SELECT amount_of_tokens INTO current_amount_of_tokens
	FROM sb.accounts
	WHERE (unlimited_until IS NULL OR unlimited_until < NOW()) AND activated IS NOT NULL AND 
		id = apply_resources_consumption.account_id AND
		number_of_resources > free_resources;

	IF current_amount_of_tokens IS NOT NULL THEN
		FOR r IN
			SELECT id, paid_until, suspended FROM sb.resources res
			WHERE res.account_id = apply_resources_consumption.account_id AND 
				res.deleted IS NULL AND (res.expiration IS NULL OR res.expiration > NOW()) AND 
				(res.paid_until <= NOW() OR res.paid_until IS NULL)
			ORDER BY res.created ASC
		LOOP
			-- skip free resources
			IF idx > (free_resources - 1) THEN
				IF amount_to_burn = current_amount_of_tokens AND
					(SELECT suspended FROM sb.resources WHERE id = r.id) IS NULL THEN
					UPDATE sb.resources SET suspended = NOW()
					WHERE id = r.id;
					
					some_resource_suspended = true;
				ELSE
					IF(current_amount_of_tokens - amount_to_burn > 0) THEN
						IF r.paid_until < (NOW() - INTERVAL '1 day') OR r.paid_until IS NULL THEN
							new_paid_until = NOW() + INTERVAL '1 day';
						ELSE
							new_paid_until = r.paid_until + INTERVAL '1 day';
						END IF;

						UPDATE sb.resources SET paid_until = new_paid_until, suspended = NULL
						WHERE id = r.id;
						amount_to_burn = amount_to_burn + 1;
					END IF;
				END IF;
			ELSE
				-- If the free resource was suspended, make it available again
				UPDATE sb.resources SET suspended = NULL
				WHERE id = r.id;
			END IF;
			
			idx = idx + 1;
		END LOOP;
		
		--Warn if the account is at risk of running out of tokens within the configured amount of hours
		IF NOT some_resource_suspended AND number_of_resources > free_resources AND EXISTS (
			SELECT * FROM sb.accounts 
			WHERE id = apply_resources_consumption.account_id 
				AND (last_suspension_warning IS NULL OR last_suspension_warning < (NOW() - hours_before_warning * INTERVAL '1 hour'))
		) AND ((number_of_resources - free_resources) * (hours_before_warning / 24)) > current_amount_of_tokens THEN
			PERFORM sb.create_notification(apply_resources_consumption.account_id, json_build_object(
				'info', 'WARNING_LOW_TOKEN_AMOUNT'
			));
			UPDATE sb.accounts SET last_suspension_warning = NOW() WHERE id = apply_resources_consumption.account_id;
		END IF;
		
		IF amount_to_burn > 0 THEN
			UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens - amount_to_burn
			WHERE id = apply_resources_consumption.account_id;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (apply_resources_consumption.account_id, 6, -amount_to_burn);
			
			PERFORM pg_notify('graphql:account_changed:' || account_id, json_build_object(
				'event', 'account_changed',
				'subject', apply_resources_consumption.account_id
			)::text);
		END IF;
		
		IF some_resource_suspended THEN
			PERFORM sb.create_notification(apply_resources_consumption.account_id, json_build_object(
				'info', 'SOME_RESOURCES_SUSPENDED'
			));
		END IF;

	END IF;
END;
$BODY$;

ALTER FUNCTION sb.apply_resources_consumption(integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.apply_resources_consumption(integer) TO identified_account;
GRANT EXECUTE ON FUNCTION sb.apply_resources_consumption(integer) TO sb;

DROP FUNCTION IF EXISTS sb.create_resource(character varying, character varying, timestamp without time zone, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location);

CREATE OR REPLACE FUNCTION sb.create_resource(
	title character varying,
	description character varying,
	expiration timestamp with time zone,
	subjective_value integer,
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
	-- Prevent creating a resource if the account already has 2 active
	-- and is not either contributor, or unlimited account
	IF NOT EXISTS (SELECT *
		FROM sb.accounts a
		WHERE id = sb.current_account_id()
		AND ((
			(a.unlimited_until IS NOT NULL AND a.unlimited_until > NOW())
		) OR (
			(SELECT COUNT(*) FROM sb.resources r WHERE r.account_id = sb.current_account_id()
			AND (r.expiration is NULL OR r.expiration > NOW())
			AND r.deleted IS NULL
			AND r.suspended IS NULL) < (SELECT amount_free_resources FROM sb.system)
		) OR (
			a.willing_to_contribute
		))) THEN
	
		RAISE EXCEPTION 'This account cannot create non-free resource';
	
	END IF;
	
	IF specific_location IS NOT NULL THEN
		INSERT INTO sb.locations (address, latitude, longitude)
		VALUES (specific_location.address, specific_location.latitude, specific_location.longitude)
		RETURNING id INTO location_id;
	END IF;

	INSERT INTO sb.resources(
		title, description, expiration, account_id, created, is_service, is_product, 
		can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted, 
		specific_location_id, paid_until, subjective_value)
	VALUES (create_resource.title, create_resource.description, create_resource.expiration, sb.current_account_id(),
			NOW(), create_resource.is_service, create_resource.is_product, create_resource.can_be_delivered,
			create_resource.can_be_taken_away, create_resource.can_be_exchanged, create_resource.can_be_gifted, 
			location_id, NOW(), create_resource.subjective_value)
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

DROP FUNCTION IF EXISTS sb.update_resource(integer, character varying, character varying, timestamp without time zone, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location);

CREATE OR REPLACE FUNCTION sb.update_resource(
	resource_id integer,
	title character varying,
	description character varying,
	expiration timestamp with time zone,
	subjective_value integer,
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
		can_be_gifted = update_resource.can_be_gifted, specific_location_id = location_id,
		subjective_value = update_resource.subjective_value
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
	
	PERFORM sb.apply_resources_rewards(update_resource.resource_id);
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
	
	-- In case a free resource was deleted, run apply_resources_consumption,
	-- which could un-suspend a suspended resource
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
		WHERE deleted IS NULL AND (expiration IS NULL OR expiration > NOW()) AND 
				account_id = id_account_to_activate;
		
		PERFORM sb.apply_my_resources_rewards();
		PERFORM sb.apply_resources_consumption(sb.current_account_id());
		
		-- Loop through active resources to send notifications
		FOR res IN
			SELECT id 
			FROM sb.resources
			WHERE deleted IS NULL AND (expiration IS NULL OR expiration > NOW()) AND 
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

CREATE OR REPLACE FUNCTION sb.apply_resources_token_transactions()
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE acc RECORD;
BEGIN
	FOR acc IN
		SELECT id FROM sb.accounts
		WHERE email IS NOT NULL AND email <> '' AND
			activated IS NOT NULL AND (unlimited_until IS NULL OR unlimited_until < NOW())
	LOOP
		PERFORM sb.apply_account_resources_rewards(acc.id);
		PERFORM sb.apply_resources_consumption(acc.id);
	END LOOP;
END;
$BODY$;

ALTER FUNCTION sb.apply_resources_token_transactions()
    OWNER TO sb;

ALTER TYPE sb.session_data
    ADD ATTRIBUTE willing_to_contribute boolean;
	
ALTER TYPE sb.session_data
    ADD ATTRIBUTE amount_of_tokens integer;
	
ALTER TYPE sb.session_data
    ADD ATTRIBUTE unlimited_until timestamp with time zone;

ALTER TYPE sb.session_data
    ADD ATTRIBUTE number_of_external_auth_providers integer;
	
ALTER TYPE sb.session_data
    RENAME ATTRIBUTE number_of_unread_notifications TO unread_notifications;
ALTER TYPE sb.session_data
        ALTER ATTRIBUTE unread_notifications SET DATA TYPE integer[];

CREATE OR REPLACE FUNCTION sb.grant_applicable_rewards(
	notify_if_token_amount_changed BOOLEAN = true
) RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE amount_tokens_to_add integer = 0;
BEGIN
	IF (SELECT COUNT(*) FROM sb.accounts_links
		WHERE account_id = sb.current_account_id()) > 0 AND
		NOT EXISTS (SELECT * FROM sb.accounts_token_transactions WHERE account_id = sb.current_account_id() AND token_transaction_type_id = 3)
	THEN
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 3, 20);
		
		amount_tokens_to_add = amount_tokens_to_add + 20;
	END IF;
		
	IF EXISTS(SELECT * FROM sb.accounts
		WHERE id = sb.current_account_id() AND location_id IS NOT NULL)  AND
		NOT EXISTS (SELECT * FROM sb.accounts_token_transactions WHERE account_id = sb.current_account_id() AND token_transaction_type_id = 2)
	THEN
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 2, 20);
		
		amount_tokens_to_add = amount_tokens_to_add + 20;
	END IF;
	
	IF EXISTS(SELECT * FROM sb.accounts
		WHERE id = sb.current_account_id() AND avatar_image_id IS NOT NULL)  AND
		NOT EXISTS (SELECT * FROM sb.accounts_token_transactions WHERE account_id = sb.current_account_id() AND token_transaction_type_id = 1)
	THEN
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 1, 20);
		
		amount_tokens_to_add = amount_tokens_to_add + 20;
	END IF;
	
	IF amount_tokens_to_add > 0 THEN
		UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + amount_tokens_to_add
		WHERE id = sb.current_account_id();
		
		IF notify_if_token_amount_changed THEN
		
			PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
				'event', 'account_changed',
				'subject', sb.current_account_id()
			)::text);
		END IF;
	END IF;
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.grant_applicable_rewards(boolean)
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.switch_to_contribution_mode()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
BEGIN
	IF NOT EXISTS(SELECT * FROM sb.accounts WHERE id = sb.current_account_id() AND willing_to_contribute) THEN
		PERFORM sb.grant_applicable_rewards();
		
		-- When switching to contribution mode: 30 topes reward
		UPDATE sb.accounts
		SET willing_to_contribute = true, amount_of_tokens = amount_of_tokens + 30
		WHERE id = sb.current_account_id();
		
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 7, 30);
	
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

ALTER TABLE IF EXISTS sb.google_auth_tokens
    RENAME TO external_auth_tokens;

ALTER TABLE IF EXISTS sb.external_auth_tokens
    ADD COLUMN auth_provider integer NOT NULL DEFAULT 0;

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
	ARRAY(
		SELECT id
		FROM sb.my_notifications()
		WHERE read IS NULL
	) as unread_notifications,
	a.willing_to_contribute, a.amount_of_tokens, a.unlimited_until,
	(SELECT COUNT(*) 
	 FROM sb.external_auth_tokens eat 
	 WHERE eat.email = a.email) as number_of_external_auth_providers

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
	WHERE r.account_id = sb.current_account_id() AND r.deleted IS NULL AND (r.expiration IS NULL OR r.expiration > NOW())
		AND ri.resource_id IS NULL;
$BODY$;

ALTER FUNCTION sb.get_my_resources_without_picture()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_my_resources_without_picture() TO identified_account;

DROP FUNCTION IF EXISTS sb.update_account(character varying, character varying, character varying);

CREATE OR REPLACE FUNCTION sb.update_account(
	name character varying,
	avatar_public_id character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
BEGIN
	IF avatar_public_id IS NOT NULL AND NOT EXISTS (
		SELECT *
		FROM sb.accounts a
		LEFT JOIN sb.images i ON a.avatar_image_id = i.id
		WHERE a.id = sb.current_account_id() AND i.public_id = avatar_public_id) THEN

		INSERT INTO sb.images (public_id) VALUES (avatar_public_id);
	END IF;
	
	UPDATE sb.accounts
	SET name = update_account.name, avatar_image_id = (
		SELECT id FROM sb.images i WHERE i.public_id = avatar_public_id
	)
	WHERE id = sb.current_account_id();
	
	-- Ensure the reward for setting the logo is granted, if applicable (no need to notify from that function, it is done anyway on the next line)
	PERFORM sb.grant_applicable_rewards(false);
	
	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN 1;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.update_account_email(
	new_email character varying)
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
	WHERE a.id = sb.current_account_id() AND
	-- Fail any attempt to change the email of an account linked to one or more extarnal auth provider
	(SELECT COUNT(*) FROM sb.external_auth_tokens eat WHERE eat.email = a.email) = 0;
	
	IF new_email IS NOT NULL AND new_email <> '' AND current_email <> LOWER(new_email) THEN
		SELECT array_to_string(ARRAY(SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
		INTO block.activation_code;
		
		INSERT INTO sb.email_activations (account_id, email, activation_code)
		VALUES (sb.current_account_id(), LOWER(new_email), block.activation_code);
		
		PERFORM sb.add_job('mailActivation', 
			json_build_object('email', LOWER(new_email), 'code', block.activation_code, 'lang', account_language));
	
	END IF;
	
	RETURN 1;
end;
$BODY$;

GRANT EXECUTE ON FUNCTION sb.update_account_email(character varying) TO identified_account;

ALTER FUNCTION sb.update_account_email(character varying)
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.update_account_public_info(
	links account_link[],
	location new_location DEFAULT NULL::new_location)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE location_id integer;
DECLARE amount_tokens_to_add integer = 0;
BEGIN

	DELETE FROM sb.accounts_links
	WHERE account_id = sb.current_account_id();
	
	INSERT INTO sb.accounts_links(url, label, link_type_id, account_id)
	SELECT l.url, l.label, l.link_type_id, sb.current_account_id()
	FROM UNNEST(links) l;
	
	SELECT a.location_id INTO block.location_id
	FROM sb.accounts a
	WHERE id = sb.current_account_id();
	
	IF location IS NULL THEN
		IF block.location_id IS NOT NULL THEN
			UPDATE sb.accounts SET location_id = null WHERE id = sb.current_account_id();
			
			DELETE FROM sb.locations WHERE id = block.location_id;
		END IF;
	ELSE
		IF block.location_id IS NULL THEN
			INSERT INTO sb.locations (address, latitude, longitude)
			VALUES (location.address, location.latitude, location.longitude)
			RETURNING id INTO block.location_id;
			
			UPDATE sb.accounts SET location_id = block.location_id WHERE id = sb.current_account_id();
		ELSE
			UPDATE sb.locations SET address = location.address, latitude = location.latitude, longitude = location.longitude
			WHERE id = block.location_id;
		END IF;
	END IF;
	
	PERFORM sb.grant_applicable_rewards(false);
	
	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN 1;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.get_tokens_history()
    RETURNS SETOF accounts_token_transactions
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT *
	FROM sb.accounts_token_transactions
	WHERE account_id = sb.current_account_id()
	ORDER BY created DESC;
$BODY$;

ALTER FUNCTION sb.get_tokens_history()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_tokens_history() TO identified_account;

DROP VIEW sb.active_accounts;

ALTER TABLE sb.accounts
    ALTER COLUMN recovery_code_expiration TYPE timestamp with time zone ;

ALTER TABLE sb.accounts
    ALTER COLUMN activated TYPE timestamp with time zone ;
	
ALTER TABLE sb.accounts_push_tokens
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
    accounts.language,
    accounts.log_level,
    accounts.location_id,
    accounts.can_be_showcased,
    accounts.willing_to_contribute,
    accounts.amount_of_tokens,
    accounts.unlimited_until,
	accounts.last_suspension_warning
   FROM accounts
  WHERE accounts.activated IS NOT NULL AND accounts.name::text <> ''::text AND accounts.name IS NOT NULL;

ALTER TABLE sb.active_accounts
    OWNER TO sb;

GRANT SELECT ON TABLE sb.active_accounts TO anonymous;
GRANT SELECT ON TABLE sb.active_accounts TO identified_account;
GRANT ALL ON TABLE sb.active_accounts TO sb;

CREATE OR REPLACE FUNCTION sb.my_notifications()
    RETURNS SETOF notifications 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT n.*
	FROM sb.notifications n
	LEFT JOIN sb.resources r ON r.id = (data ->>'resource_id')::INTEGER
	WHERE n.account_id = sb.current_account_id() AND
	-- filter out 'new resource' notifications of deleted resources
	((data ->>'resource_id') IS NULL OR r.deleted IS NULL)
	ORDER BY created DESC;
$BODY$;

ALTER FUNCTION sb.my_notifications()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.my_notifications() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.my_notifications() TO sb;

REVOKE ALL ON FUNCTION sb.my_notifications() FROM PUBLIC;

DROP FUNCTION IF EXISTS sb.myresources();

CREATE OR REPLACE FUNCTION sb.my_resources(
	)
    RETURNS SETOF resources 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
select r.*
  from sb.resources r
  where r.account_id = sb.current_account_id()
  and r.deleted is null
  order by created DESC;
 
$BODY$;

ALTER FUNCTION sb.my_resources()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.my_resources() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.my_resources() TO sb;

--Reward current users

--Reward for links on account
INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
SELECT account_id, 3, 20 FROM sb.accounts_links
GROUP BY account_id;

UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + 20
WHERE id IN (
	SELECT account_id 
	FROM sb.accounts_links
	GROUP BY account_id);

--Reward for address defined on account
INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
SELECT id, 2, 20
FROM sb.accounts
WHERE location_id IS NOT NULL
GROUP BY id;
	
UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + 20
WHERE id IN (
	SELECT id
	FROM sb.accounts
	WHERE location_id IS NOT NULL);

--Reward for presence of logo image
INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
SELECT id, 1, 20 FROM sb.accounts
WHERE avatar_image_id IS NOT NULL;

UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + 20
WHERE id IN (
	SELECT id FROM sb.accounts
	WHERE avatar_image_id IS NOT NULL);

SELECT sb.apply_account_resources_rewards(id) FROM sb.active_accounts;

CREATE OR REPLACE FUNCTION sb.create_notification(IN account_id integer,IN data json)
    RETURNS integer
    LANGUAGE 'plpgsql'
    VOLATILE SECURITY DEFINER
    PARALLEL UNSAFE
    COST 100
    
AS $BODY$
declare inserted_id integer;
begin
	INSERT INTO sb.notifications (account_id, data)
	VALUES (create_notification.account_id, create_notification.data)
	RETURNING id into inserted_id;
	
	PERFORM pg_notify('graphql:notification_account:' || account_id, json_build_object(
		'event', 'notification_created',
		'subject', inserted_id
	)::text);
	
	RETURN 1;
END;
$BODY$;

ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD COLUMN target_account_id integer;
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD CONSTRAINT fk_accounts_token_transactions_target_accounts FOREIGN KEY (target_account_id)
    REFERENCES sb.accounts (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

INSERT INTO sb.token_transaction_types(
	id, code)
	VALUES (8, 'SENT_TOKEN_TO_ACCOUNT');
INSERT INTO sb.token_transaction_types(
	id, code)
	VALUES (9, 'RECEIVED_TOKEN_FROM_ACCOUNT');

CREATE OR REPLACE FUNCTION sb.send_tokens(
	target_account_id integer,
	amount_to_send integer
)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	IF(target_account_id = sb.current_account_id()) THEN
		RETURN 0;
	END IF;
	
	INSERT INTO sb.accounts_token_transactions(
		account_id, token_transaction_type_id, movement, target_account_id)
	VALUES (sb.current_account_id(), 8, -amount_to_send, send_tokens.target_account_id);
	INSERT INTO sb.accounts_token_transactions(
		account_id, token_transaction_type_id, movement, target_account_id)
	VALUES (send_tokens.target_account_id, 9, amount_to_send, sb.current_account_id());

	UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens - amount_to_send
	WHERE id = sb.current_account_id();
	UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + amount_to_send
	WHERE id = send_tokens.target_account_id;
	
	-- Create a notification for the sender, and one for the receiver
	PERFORM sb.create_notification(target_account_id, json_build_object(
		'info', 'TOKENS_RECEIVED', 'fromAccount', (SELECT name FROM sb.accounts WHERE id = sb.current_account_id()), 'amountReceived', amount_to_send
	));
	PERFORM sb.create_notification(sb.current_account_id(), json_build_object(
		'info', 'TOKENS_SENT', 'toAccount', (SELECT name FROM sb.accounts WHERE id = target_account_id), 'amountSent', amount_to_send
	));
	
	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.send_tokens(integer, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.send_tokens(integer, integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.send_tokens(integer, integer) TO sb;

REVOKE ALL ON FUNCTION sb.send_tokens(integer, integer) FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.conversation_messages_by_conversation_id(
	id integer)
    RETURNS SETOF messages 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT m.*
  	FROM sb.messages m
  	WHERE id = conversation_messages_by_conversation_id.id
	AND EXISTS (
		SELECT * FROM sb.participants p
		WHERE p.conversation_id = conversation_messages_by_conversation_id.id
		AND account_id = sb.current_account_id())
	ORDER BY m.created DESC
 
$BODY$;

ALTER FUNCTION sb.conversation_messages_by_conversation_id(integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.conversation_messages_by_conversation_id(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.conversation_messages_by_conversation_id(integer) TO sb;

DROP FUNCTION IF EXISTS sb.authenticate_external_auth(character varying, character varying);

CREATE OR REPLACE FUNCTION sb.authenticate_external_auth(
	email character varying,
	token character varying,
	auth_provider integer)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare account_id INTEGER;
begin
  select a.id into account_id
    from sb.accounts as a
	inner join sb.external_auth_tokens eat ON eat.email = a.email AND eat.auth_provider = authenticate_external_auth.auth_provider
    where a.email = LOWER(authenticate_external_auth.email) and eat.token = authenticate_external_auth.token;

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

ALTER FUNCTION sb.authenticate_external_auth(character varying, character varying, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.authenticate_external_auth(character varying, character varying, integer) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.authenticate_external_auth(character varying, character varying, integer) TO anonymous;

GRANT EXECUTE ON FUNCTION sb.authenticate_external_auth(character varying, character varying, integer) TO sb;

DROP FUNCTION IF EXISTS sb.register_account_external_auth(character varying, character varying, character varying, character varying);

CREATE OR REPLACE FUNCTION sb.register_account_external_auth(
	email character varying,
	token character varying,
	account_name character varying,
	language character varying,
	auth_provider integer)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id integer;
BEGIN
	IF EXISTS(SELECT *
		FROM sb.external_auth_tokens eat
		WHERE eat.email = LOWER(register_account_external_auth.email) AND
			eat.token = register_account_external_auth.token AND
			eat.auth_provider = register_account_external_auth.auth_provider) THEN
	
		INSERT INTO sb.accounts(name, email, language, activated)
		VALUES (account_name, LOWER(register_account_external_auth.email), 
			register_account_external_auth.language, now())
		RETURNING id INTO inserted_id;

		INSERT INTO sb.broadcast_prefs (event_type, account_id, days_between_summaries)
		VALUES (2, inserted_id, 1);

		PERFORM sb.create_notification(inserted_id, json_build_object(
			'info', 'COMPLETE_PROFILE'
		));
	
		RETURN (
			inserted_id,
			EXTRACT(epoch FROM now() + interval '100 day'),
			'identified_account'
		)::sb.jwt_token;
	
  	END IF;
	RETURN NULL;
END;
$BODY$;

ALTER FUNCTION sb.register_account_external_auth(character varying, character varying, character varying, character varying, integer)
    OWNER TO sb;

DROP FUNCTION IF EXISTS sb.update_google_auth_status(character varying, character varying);

CREATE OR REPLACE FUNCTION sb.update_external_auth_status(
	email character varying,
	token character varying,
	auth_provider integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare account_id INTEGER;
declare current_token character varying;
begin
  SELECT a.id, eat.token INTO account_id, current_token
    FROM sb.accounts AS a
	LEFT JOIN sb.external_auth_tokens eat ON eat.email = a.email AND
		eat.auth_provider = update_external_auth_status.auth_provider
    WHERE a.email = LOWER(update_external_auth_status.email);

  IF account_id IS NOT NULL THEN
    IF current_token IS NULL THEN
		INSERT INTO sb.external_auth_tokens (email, token, auth_provider)
		VALUES (update_external_auth_status.email, update_external_auth_status.token, update_external_auth_status.auth_provider);
	ELSE
		UPDATE sb.external_auth_tokens eat
		SET token = update_external_auth_status.token, updated = now()
		WHERE eat.email = update_external_auth_status.email AND eat.auth_provider = update_external_auth_status.auth_provider;
	END IF;
	RETURN 2;
  ELSE
  	IF EXISTS(SELECT * FROM sb.external_auth_tokens eat WHERE eat.email = update_external_auth_status.email AND
		eat.auth_provider = update_external_auth_status.auth_provider) THEN
		UPDATE sb.external_auth_tokens eat
		SET token = update_external_auth_status.token, updated = now()
		WHERE eat.email = update_external_auth_status.email AND eat.auth_provider = update_external_auth_status.auth_provider;
	ELSE
		INSERT INTO sb.external_auth_tokens (email, token, auth_provider)
		VALUES (update_external_auth_status.email, update_external_auth_status.token, update_external_auth_status.auth_provider);
	END IF;
    RETURN 1;
  END IF;
end;
$BODY$;

ALTER FUNCTION sb.update_external_auth_status(character varying, character varying, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.update_external_auth_status(character varying, character varying, integer) TO sb;

REVOKE ALL ON FUNCTION sb.update_external_auth_status(character varying, character varying, integer) FROM PUBLIC;


DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.9.0', minimum_client_version = '0.9.14';
END;
$body$
LANGUAGE 'plpgsql'; 