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
	WHERE m.participant_id IN (
		SELECT id FROM sb.participants p
		WHERE p.conversation_id = conversation_messages_by_conversation_id.id
	)
	ORDER BY m.created DESC

$BODY$;

ALTER FUNCTION sb.conversation_messages_by_conversation_id(integer)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.conversation_messages_by_conversation_id(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.conversation_messages_by_conversation_id(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.conversation_messages_by_conversation_id(integer) TO sb;

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

ALTER FUNCTION sb.get_session_data()
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.get_session_data() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_session_data() TO identified_account;

CREATE OR REPLACE FUNCTION sb.get_session_data_web(
	)
    RETURNS session_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
	SELECT a.id, a.name, a.email, sb.current_role(), 
	i.public_id as avatar_public_id, a.activated, a.log_level,
	ARRAY(
		SELECT DISTINCT p.conversation_id
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

ALTER FUNCTION sb.get_session_data_web()
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.get_session_data_web() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_session_data_web() TO identified_account;

REVOKE ALL ON FUNCTION sb.conversation_messages(integer, integer) FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.get_conversation_for_resource(
	resource_id integer)
    RETURNS conversations 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
	SELECT c.*
  	FROM sb.conversations c
	INNER JOIN sb.resources r ON
		c.resource_id = r.id
  	WHERE c.resource_id = get_conversation_for_resource.resource_id AND
	EXISTS (SELECT * FROM sb.participants WHERE conversation_id = c.id AND account_id = r.account_id) AND
	EXISTS (SELECT * FROM sb.participants WHERE conversation_id = c.id AND account_id = sb.current_account_id())
 
$BODY$;

ALTER FUNCTION sb.get_conversation_for_resource(integer)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.get_conversation_for_resource(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_conversation_for_resource(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.get_conversation_for_resource(integer) TO sb;

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
	
		RAISE EXCEPTION 'ACCOUNT_CANNOT_CREATE_NON_FREE_RESOURCES';
	
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

ALTER FUNCTION sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location)
    OWNER TO sb;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.10.0', minimum_client_version = '0.10.0';
END;
$body$
LANGUAGE 'plpgsql'; 