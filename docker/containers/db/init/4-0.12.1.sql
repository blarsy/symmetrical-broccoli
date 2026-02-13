CREATE OR REPLACE FUNCTION sb.get_admin_token(
	exchange_token character varying)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id INTEGER;
BEGIN
	IF EXISTS (SELECT * FROM sb.admins_public_keys apk WHERE apk.exchange_token = get_admin_token.exchange_token AND exchange_token_expires > NOW()) THEN
		RETURN (
		  null,
		  extract(epoch from now() + interval '1 day'),
		  'admin'
		)::sb.jwt_token;
	END IF;
END;
$BODY$;

ALTER FUNCTION sb.get_admin_token(character varying)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_admin_token(character varying) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_admin_token(character varying) TO anonymous;

GRANT EXECUTE ON FUNCTION sb.get_admin_token(character varying) TO sb;


GRANT SELECT ON TABLE sb.accounts_public_data TO admin;
GRANT SELECT ON TABLE sb.accounts_private_data TO admin;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.12.0', minimum_client_version = '0.12.0';
END;
$body$
LANGUAGE 'plpgsql'; 