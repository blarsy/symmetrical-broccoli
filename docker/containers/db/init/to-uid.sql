ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

CREATE TABLE sb.accounts_private_data
(
    uid uuid NOT NULL,
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
    PRIMARY KEY (uid)
);

ALTER TABLE IF EXISTS sb.accounts_private_data
    OWNER to sb;

GRANT SELECT, UPDATE ON TABLE sb.accounts_private_data TO identified_account;

INSERT INTO sb.accounts_private_data (email, hash, salt, recovery_code,
    recovery_code_expiration, created, activated, log_level, can_be_showcased,
    amount_of_tokens, knows_about_campaigns, uid, language)
SELECT email, hash, salt, recovery_code,
    recovery_code_expiration, created, activated, log_level, can_be_showcased,
    amount_of_tokens, knows_about_campaigns, uid, language
FROM sb.accounts;