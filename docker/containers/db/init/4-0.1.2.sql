ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN avatar_image_id integer;

ALTER TABLE IF EXISTS sb.accounts
    ADD CONSTRAINT accounts_images_fk FOREIGN KEY (avatar_image_id)
    REFERENCES sb.images (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

ALTER TABLE IF EXISTS sb.images
    ADD CONSTRAINT public_id_uniquer UNIQUE (public_id);

DROP FUNCTION IF EXISTS sb.get_session_data();

DROP TYPE IF EXISTS sb.session_data;

CREATE TYPE sb.session_data AS
(
	account_id integer,
	name character varying,
	email character varying,
	role character varying,
	avatar_public_id character varying
);

CREATE OR REPLACE FUNCTION sb.get_session_data(
	)
    RETURNS session_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
SELECT a.id, a.name, a.email, sb.current_role(), i.public_id as avatar_public_id
FROM sb.accounts a
LEFT JOIN sb.images i ON a.avatar_image_id = i.id
WHERE a.id = (SELECT NULLIF(current_setting('jwt.claims.account_id', true), '')::integer)
$BODY$;

DROP FUNCTION IF EXISTS sb.update_account(character varying, character varying);

CREATE OR REPLACE FUNCTION sb.update_account(
	name character varying,
	email character varying,
	avatar_public_id character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
begin
	IF avatar_public_id IS NOT NULL AND NOT EXISTS (SELECT * FROM sb.accounts a LEFT JOIN sb.images i ON a.avatar_image_id = i.id WHERE a.id = sb.current_account_id() AND i.public_id = avatar_public_id) THEN
		INSERT INTO sb.images (public_id) VALUES (avatar_public_id);
	END IF;
	UPDATE sb.accounts
	SET name = update_account.name, email = LOWER(update_account.email), avatar_image_id = (
		SELECT id FROM sb.images i WHERE i.public_id = avatar_public_id
	)
	WHERE id = sb.current_account_id();
	
	RETURN 1;
end;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.2';
END;
$body$
LANGUAGE 'plpgsql'; 