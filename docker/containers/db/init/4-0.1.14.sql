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

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.14';
END;
$body$
LANGUAGE 'plpgsql'; 