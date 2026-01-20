-- Add uuid fields

ALTER TABLE IF EXISTS sb.images
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
	
ALTER TABLE IF EXISTS sb.locations
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
	
ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.resources_images
    ADD COLUMN resource_uid uuid;

ALTER TABLE IF EXISTS sb.resources_images
    ADD COLUMN image_uid uuid;
	
ALTER TABLE IF EXISTS sb.accounts_links
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
	
ALTER TABLE IF EXISTS sb.accounts_links
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.accounts_push_tokens
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.client_logs
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.bids
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.broadcast_prefs
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
	
ALTER TABLE IF EXISTS sb.mails
    ADD COLUMN uid uuid NOT NULL DEFAULT ALTER TABLE IF EXISTS sb.broadcast_prefs     ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();;

ALTER TABLE IF EXISTS sb.mails
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD COLUMN target_account_uid uuid;

ALTER TABLE IF EXISTS sb.notifications
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE IF EXISTS sb.notifications
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.participants
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE IF EXISTS sb.participants
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.searches
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.grants_accounts
    ADD COLUMN account_uid uuid;
	
--Add new accounts tables
CREATE TABLE sb.accounts_private_data
(
    account_id uuid NOT NULL,
    email character varying,
    hash character varying,
    salt character varying,
    recovery_code character varying,
    recovery_code_expiration timestamp with time zone,
    created timestamp with time zone,
    activated timestamp with time zone,
    log_level integer,
    can_be_showcased boolean NOT NULL DEFAULT false,
    amount_of_tokens numeric NOT NULL DEFAULT 0,
    knows_about_campaigns boolean NOT NULL DEFAULT false,
    language character varying NOT NULL,
    PRIMARY KEY (account_id)
);

ALTER TABLE IF EXISTS sb.accounts_private_data
    OWNER to sb;

GRANT SELECT, UPDATE, DELETE ON TABLE sb.accounts_private_data TO identified_account;

CREATE TABLE sb.accounts_public_data
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
	old_id INTEGER NOT NULL,
    name character varying NOT NULL,
    bio character varying,
    avatar_image_id uuid,
    location_id uuid,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS sb.accounts_public_data
    OWNER to sb;

GRANT SELECT ON TABLE sb.accounts_public_data TO anonymous;

GRANT SELECT, UPDATE ON TABLE sb.accounts_public_data TO identified_account;

--TODO: 'omit' new tables

--Migrate data to use uuid's
UPDATE sb.resources_images ri
SET image_uid=(SELECT i.uid FROM sb.images i WHERE i.id = ri.image_id), 
resource_uid= (SELECT r.uid FROM sb.resources r WHERE r.id = ri.resource_id);

INSERT INTO sb.accounts_public_data (old_id, name, bio, avatar_image_id, location_id)
SELECT a.id, a.name, '', 
	(SELECT uid FROM sb.images WHERE id = a.avatar_image_id), 
	(SELECT uid FROM sb.locations WHERE id = a.location_id)
FROM sb.accounts a;

INSERT INTO sb.accounts_private_data (account_id, email, hash, salt, recovery_code,
    recovery_code_expiration, created, activated, log_level, can_be_showcased,
    amount_of_tokens, knows_about_campaigns, language)
SELECT apd.id, a.email, a.hash, a.salt, a.recovery_code,
    a.recovery_code_expiration, a.created, a.activated, a.log_level, a.can_be_showcased,
    a.amount_of_tokens, a.knows_about_campaigns, a.language
FROM sb.accounts a
INNER JOIN sb.accounts_public_data apd ON apd.old_id = a.id ;

UPDATE sb.resources SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.accounts_links SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.accounts_push_tokens SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.client_logs SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.bids SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.broadcast_prefs SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.mails SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.accounts_token_transactions 
SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id),
target_account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = target_account_id);

UPDATE sb.notifications SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.participants SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.searches SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.grants_accounts SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

-- Modify functions impacted by table updates
CREATE OR REPLACE FUNCTION sb.me(
	)
    RETURNS accounts
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
select *
  from sb.accounts_public_data
  where id = sb.current_account_id();
 
$BODY$;

ALTER TYPE sb.jwt_token
        ALTER ATTRIBUTE account_id SET DATA TYPE uuid;

CREATE OR REPLACE FUNCTION sb.current_account_id(
	)
    RETURNS integer
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
select nullif(current_setting('jwt.claims.account_id', true), '')::uuid;
$BODY$;

CREATE OR REPLACE FUNCTION sb.me(
	)
    RETURNS accounts_public_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
select *
  from sb.accounts_public_data
  where id = sb.current_account_id();
 
$BODY$;

CREATE OR REPLACE FUNCTION sb.search_accounts(
	search_term character varying)
    RETURNS SETOF accounts_public_data 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

SELECT apu.*
FROM sb.accounts_public_data apu 
INNER JOIN sb.accounts_private_data apr ON apu.id = apr.account_id
WHERE name ILIKE '%' || search_term || '%' OR email ILIKE '%' || search_term || '%'
ORDER BY created DESC;

$BODY$;

DROP VIEW sb.active_accounts;

CREATE OR REPLACE VIEW sb.active_accounts
 AS
 SELECT a.*
   FROM sb.accounts_public_data a
  WHERE a.activated IS NOT NULL AND a.name::text <> ''::text AND a.name IS NOT NULL;

ALTER TABLE sb.active_accounts
    OWNER TO sb;
COMMENT ON VIEW sb.active_accounts
    IS '@omit all';

GRANT SELECT ON TABLE sb.active_accounts TO admin;
GRANT SELECT ON TABLE sb.active_accounts TO anonymous;
GRANT SELECT ON TABLE sb.active_accounts TO identified_account;
GRANT ALL ON TABLE sb.active_accounts TO sb;

DROP TABLE IF EXISTS sb.accounts;

-- Remove integer id columns & fk contraints
ALTER TABLE IF EXISTS sb.accounts_links DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.accounts_links DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.images
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.images
    ADD CONSTRAINT accounts_links_pk PRIMARY KEY (id);

ALTER TABLE IF EXISTS sb.accounts_public_data DROP COLUMN IF EXISTS old_id;

ALTER TABLE IF EXISTS sb.images DROP COLUMN IF EXISTS id;

ALTER TABLE IF EXISTS sb.images
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.images
    ADD CONSTRAINT images_pk PRIMARY KEY (id);
	
-- Rename uid columns in id columns

-- Recreate fk's on uuid columns
