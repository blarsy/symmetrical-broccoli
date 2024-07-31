CREATE SEQUENCE IF NOT EXISTS sb.locations_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE sb.locations_id_seq
    OWNER TO sb;

GRANT USAGE ON SEQUENCE sb.locations_id_seq TO identified_account;

GRANT ALL ON SEQUENCE sb.locations_id_seq TO sb;

CREATE TABLE IF NOT EXISTS sb.locations
(
    id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
    address character varying COLLATE pg_catalog."default" NOT NULL,
    latitude decimal,
    longitude decimal,
    created timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT locations_pk PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.locations
    OWNER to sb;

GRANT SELECT ON TABLE sb.locations TO anonymous;

GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE sb.locations TO identified_account;

GRANT ALL ON TABLE sb.locations TO sb;

ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN location_id integer;
ALTER TABLE IF EXISTS sb.accounts
    ADD CONSTRAINT accounts_locations_fk FOREIGN KEY (location_id)
    REFERENCES sb.locations (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

CREATE TYPE sb.new_location AS
(
	address text,
	latitude decimal,
	longitude decimal
);

ALTER TYPE sb.new_location
    OWNER TO sb;

GRANT USAGE ON TYPE sb.new_location TO PUBLIC;

GRANT USAGE ON TYPE sb.new_location TO anonymous;

GRANT USAGE ON TYPE sb.new_location TO identified_account;

GRANT USAGE ON TYPE sb.new_location TO sb;

DROP FUNCTION IF EXISTS sb.update_account_public_info(account_link[]);

CREATE OR REPLACE FUNCTION sb.update_account_public_info(
	links account_link[],
	location new_location default null)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE location_id integer;
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
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.update_account_public_info(account_link[], new_location)
    OWNER TO sb;

ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN specific_location_id integer;
ALTER TABLE IF EXISTS sb.resources
    ADD CONSTRAINT resource_location_fk FOREIGN KEY (specific_location_id)
    REFERENCES sb.locations (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

DROP FUNCTION IF EXISTS sb.create_resource(character varying, character varying, timestamp without time zone, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], character varying[]);

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
DECLARE days_summary INTEGER;
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
	
	SELECT days_between_summaries INTO days_summary FROM sb.broadcast_prefs bp
	WHERE bp.account_id = sb.current_account_id() AND bp.event_type = 2;

	IF days_summary IS NULL THEN
		-- Emit notification for push notification handling
		PERFORM pg_notify('resource_created', json_build_object(
			'resource_id', inserted_id,
			'title', create_resource.title,
			'account_name', (SELECT name FROM sb.accounts WHERE id = sb.current_account_id()),
			'destinations', (SELECT (json_build_object('token', apt.token, 'language', a.language)) FROM sb.accounts_push_tokens apt
				INNER JOIN sb.accounts a ON a.id = apt.account_id
				WHERE 
				(NOT EXISTS (SELECT bp.id FROM sb.broadcast_prefs bp WHERE apt.account_id = bp.account_id AND bp.event_type = 2) OR 
				(SELECT bp.days_between_summaries FROM sb.broadcast_prefs bp WHERE apt.account_id = bp.account_id AND bp.event_type = 2) = -1 )
				AND account_id != sb.current_account_id())
		)::text);
	END IF;
	
	RETURN inserted_id;
end;
$BODY$;

DROP FUNCTION IF EXISTS sb.update_resource(integer, character varying, character varying, timestamp without time zone, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], character varying[]);

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
	category_codes character varying[],
	specific_location new_location)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE ids_images_to_delete INTEGER[];
DECLARE location_id INTEGER = NULL;
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
	END IF;

	UPDATE sb.resources r SET title = update_resource.title, description = update_resource.description, 
		expiration = update_resource.expiration, is_service = update_resource.is_service, 
		is_product = update_resource.is_product, can_be_delivered = update_resource.can_be_delivered, 
		can_be_taken_away = update_resource.can_be_taken_away, can_be_exchanged = update_resource.can_be_exchanged, 
		can_be_gifted = update_resource.can_be_gifted, specific_location_id = location_id
	WHERE r.id = update_resource.resource_id;
	
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
	
	RETURN 1;
END;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.7.0', minimum_client_version = '0.7.0';
END;
$body$
LANGUAGE 'plpgsql'; 