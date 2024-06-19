CREATE TABLE sb.link_types
(
    id integer NOT NULL,
    name character varying NOT NULL,
    CONSTRAINT link_types_pk PRIMARY KEY (id)
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.link_types
    OWNER to sb;

GRANT SELECT ON TABLE sb.link_types TO anonymous;

GRANT INSERT, DELETE, SELECT, UPDATE ON TABLE sb.link_types TO identified_account;

GRANT ALL ON TABLE sb.link_types TO sb;

DO
$body$
BEGIN
    INSERT INTO sb.link_types (id, name) VALUES (1, 'Facebook');
    INSERT INTO sb.link_types (id, name) VALUES (2, 'Instagram');
    INSERT INTO sb.link_types (id, name) VALUES (3, 'Twitter');
    INSERT INTO sb.link_types (id, name) VALUES (4, 'Web');
END;
$body$
LANGUAGE 'plpgsql'; 

CREATE SEQUENCE IF NOT EXISTS sb.accounts_links_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE sb.accounts_links_id_seq
    OWNER TO sb;

GRANT USAGE ON SEQUENCE sb.accounts_links_id_seq TO identified_account;

GRANT ALL ON SEQUENCE sb.accounts_links_id_seq TO sb;

CREATE TABLE IF NOT EXISTS sb.accounts_links
(
    id integer  NOT NULL DEFAULT nextval('accounts_links_id_seq'::regclass),
    url character varying COLLATE pg_catalog."default" NOT NULL,
	label character varying COLLATE pg_catalog."default" NULL,
    link_type_id integer NOT NULL,
    account_id integer NOT NULL,
    CONSTRAINT accounts_links_pkey PRIMARY KEY (id),
    CONSTRAINT accounts_accounts_links FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT accounts_links_link_types FOREIGN KEY (link_type_id)
        REFERENCES sb.link_types (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.accounts_links
    OWNER to sb;

GRANT SELECT ON TABLE sb.accounts_links TO anonymous;

GRANT INSERT, DELETE, SELECT, UPDATE ON TABLE sb.accounts_links TO identified_account;

GRANT ALL ON TABLE sb.accounts_links TO sb;

CREATE TYPE sb.account_link AS
(
	url text,
	label text,
	link_type_id integer
);

ALTER TYPE sb.account_link
    OWNER TO sb;

GRANT USAGE ON TYPE sb.account_link TO anonymous;

GRANT USAGE ON TYPE sb.account_link TO identified_account;

DROP FUNCTION IF EXISTS sb.update_account(character varying, character varying, character varying);

CREATE OR REPLACE FUNCTION sb.update_account(
	name character varying,
	email character varying,
	avatar_public_id character varying,
	links sb.account_link[])
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE current_email character varying;
DECLARE activation_code character varying;
DECLARE account_language character varying;
BEGIN
	SELECT a.email, a.language
	INTO current_email, account_language
	FROM sb.accounts a
	WHERE a.id = sb.current_account_id();
	
	IF update_account.email IS NOT NULL AND update_account.email <> '' AND current_email <> LOWER(update_account.email) THEN
		SELECT array_to_string(ARRAY(SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
		INTO block.activation_code;
		
		INSERT INTO sb.email_activations (account_id, email, activation_code)
		VALUES (sb.current_account_id(), LOWER(update_account.email), block.activation_code);
		
		PERFORM sb.add_job('mailActivation', 
			json_build_object('email', LOWER(update_account.email), 'code', block.activation_code, 'lang', account_language));
	
	END IF;

	IF avatar_public_id IS NOT NULL AND NOT EXISTS (SELECT * FROM sb.accounts a LEFT JOIN sb.images i ON a.avatar_image_id = i.id WHERE a.id = sb.current_account_id() AND i.public_id = avatar_public_id) THEN
		INSERT INTO sb.images (public_id) VALUES (avatar_public_id);
	END IF;
	
	UPDATE sb.accounts
	SET name = update_account.name, avatar_image_id = (
		SELECT id FROM sb.images i WHERE i.public_id = avatar_public_id
	)
	WHERE id = sb.current_account_id();
	
	DELETE FROM sb.accounts_links
	WHERE account_id = sb.current_account_id();
	
	INSERT INTO sb.accounts_links(url, label, link_type_id, account_id)
	SELECT l.url, l.label, l.link_type_id, sb.current_account_id()
	FROM UNNEST(links) l;
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.update_account(character varying, character varying, character varying, sb.account_link[])
    OWNER TO sb;


DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.3.0', minimum_client_version = '0.3.0';
END;
$body$
LANGUAGE 'plpgsql'; 