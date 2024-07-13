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
	
	-- Emit notification for push notification handling
	PERFORM pg_notify('resource_created', json_build_object(
		'resource_id', inserted_id,
		'title', create_resource.title,
		'account_name', (SELECT name FROM sb.accounts WHERE id = sb.current_account_id()),
		'push_tokens', (SELECT ARRAY(SELECT token FROM sb.accounts_push_tokens apt WHERE 
			NOT EXISTS (SELECT bp.id FROM sb.broadcast_prefs bp WHERE apt.account_id = bp.account_id AND bp.event_type = 2)
			AND account_id != sb.current_account_id()))
	)::text);
	
	RETURN inserted_id;
end;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.3.2', minimum_client_version = '0.3.0';
END;
$body$
LANGUAGE 'plpgsql'; 