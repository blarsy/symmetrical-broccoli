CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE sb.grants
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title character varying NOT NULL,
    description character varying NOT NULL,
	amount integer NOT NULL,
    expiration timestamp with time zone NOT NULL,
	data json NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS sb.grants
    OWNER to sb;

GRANT INSERT, SELECT, UPDATE ON TABLE sb.grants TO admin;

GRANT SELECT ON TABLE sb.grants TO PUBLIC;

COMMENT ON TABLE grants IS '@omit';

COMMENT ON TABLE campaigns IS '@omit';
GRANT EXECUTE ON FUNCTION sb.create_campaign(character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone) TO admin;
REVOKE ALL ON FUNCTION sb.get_campaigns() FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.create_grant(
	title character varying,
	description character varying,
	amount integer,
	data json,
	expiration timestamp with time zone)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	INSERT INTO sb.grants(
		title, description, amount, data, expiration)
	VALUES (create_grant.title, create_grant.description, create_grant.amount,
		   create_grant.data, create_grant.expiration);
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.create_grant(character varying, character varying, integer, json, timestamp with time zone)
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.get_grants(
	)
    RETURNS SETOF grants 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT *
	FROM sb.grants
	WHERE expiration > NOW()
	ORDER BY created DESC;
$BODY$;

ALTER FUNCTION sb.get_grants()
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.get_grants() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_grants() TO admin;

GRANT EXECUTE ON FUNCTION sb.get_grants() TO sb;

CREATE OR REPLACE FUNCTION sb.get_campaigns(
	)
    RETURNS SETOF campaigns 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT *
	FROM sb.campaigns
	ORDER BY created DESC;
$BODY$;

REVOKE ALL ON FUNCTION sb.get_campaigns() FROM PUBLIC;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.11.0', minimum_client_version = '0.11.0';
END;
$body$
LANGUAGE 'plpgsql'; 