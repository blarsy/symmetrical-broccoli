
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
	
	RETURN inserted_id;
end;
$BODY$;

CREATE TABLE sb.mails
(
    id serial NOT NULL,
    account_id integer NOT NULL,
    email character varying NOT NULL,
	sent_from character varying NOT NULL,
    subject character varying NOT NULL,
    text_content character varying NOT NULL,
    html_content character varying NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT mails_pk PRIMARY KEY (id),
    CONSTRAINT mails_accounts_fk FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS sb.mails
    OWNER to sb;

GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE sb.mails TO sb;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.7.3', minimum_client_version = '0.7.3';
END;
$body$
LANGUAGE 'plpgsql'; 