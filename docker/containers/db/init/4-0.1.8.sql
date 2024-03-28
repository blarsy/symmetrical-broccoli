GRANT SELECT ON TABLE sb.accounts TO anonymous;
GRANT SELECT ON TABLE sb.resource_categories TO anonymous;
GRANT SELECT ON TABLE sb.images TO anonymous;
GRANT SELECT ON TABLE sb.resources_images TO anonymous;
GRANT SELECT ON TABLE sb.resources_resource_categories TO anonymous;
GRANT SELECT ON TABLE sb.resources TO anonymous;

CREATE OR REPLACE FUNCTION sb.is_password_valid(
	password character varying)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	
	RETURN LENGTH(password) >= 8 AND regexp_count(password, '[A-Z]') > 0 AND regexp_count(password, '^[A-Z]') > 0;
END;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.8';
END;
$body$
LANGUAGE 'plpgsql'; 