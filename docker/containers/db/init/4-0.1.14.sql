CREATE TABLE IF NOT EXISTS sb.client_logs
(
    created timestamp without time zone NOT NULL DEFAULT now(),
    account_id integer,
	activity_id character varying COLLATE pg_catalog."default" NOT NULL,
    data character varying COLLATE pg_catalog."default" NOT NULL,
    level integer NOT NULL,
    CONSTRAINT accounts_client_log FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.client_logs
    OWNER to sb;

GRANT INSERT ON TABLE sb.client_logs TO anonymous;

GRANT INSERT, SELECT ON TABLE sb.client_logs TO identified_account;

GRANT ALL ON TABLE sb.client_logs TO sb;


CREATE OR REPLACE FUNCTION sb.create_client_log(
	data character varying,
	level integer,
	activity_id character varying,
	account_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	INSERT INTO sb.client_logs (account_id, data, level, activity_id)
	VALUES (create_client_log.account_id, create_client_log.data, create_client_log.level, create_client_log.activity_id);
	
	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.create_client_log(character varying, integer, character varying, integer)
    OWNER TO sb;

ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN log_level integer NOT NULL DEFAULT 3;

ALTER TYPE sb.session_data
    ADD ATTRIBUTE log_level integer;

CREATE OR REPLACE FUNCTION sb.get_session_data(
	)
    RETURNS session_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
SELECT a.id, a.name, a.email, sb.current_role(), 
i.public_id as avatar_public_id, a.activated, a.log_level
FROM sb.accounts a
LEFT JOIN sb.images i ON a.avatar_image_id = i.id
WHERE a.id = (SELECT NULLIF(current_setting('jwt.claims.account_id', true), '')::integer)
$BODY$;

ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN deleted timestamp without time zone;

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
	
	RETURN 1;
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
	category_codes character varying[])
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE ids_images_to_delete INTEGER[];
begin
	--Detect attempt to update a resource owned by another account
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = update_resource.resource_id AND account_id = sb.current_account_id()) THEN
		RETURN 0;
	END IF;
	
	--Detect attempt to update a resource already deleted
	IF (SELECT * FROM sb.resources WHERE id = update_resource.resource_id AND deleted IS NOT NULL) THEN
		RETURN -1;
	END IF;

	UPDATE sb.resources r SET title = update_resource.title, description = update_resource.description, 
		expiration = update_resource.expiration, is_service = update_resource.is_service, 
		is_product = update_resource.is_product, can_be_delivered = update_resource.can_be_delivered, 
		can_be_taken_away = update_resource.can_be_taken_away, can_be_exchanged = update_resource.can_be_exchanged, 
		can_be_gifted = update_resource.can_be_gifted
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
end;
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
	(r.title ILIKE '%' || search_term || '%' OR r.description ILIKE '%' || search_term || '%'))
  ORDER BY COALESCE(r.deleted, LOCALTIMESTAMP) DESC, r.expiration DESC;
 
$BODY$;


DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.14';
END;
$body$
LANGUAGE 'plpgsql'; 