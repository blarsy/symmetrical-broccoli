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



DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.9.0', minimum_client_version = '0.9.0';
END;
$body$
LANGUAGE 'plpgsql'; 