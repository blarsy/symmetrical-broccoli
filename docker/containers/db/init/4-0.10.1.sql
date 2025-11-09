CREATE OR REPLACE FUNCTION sb.apply_resources_rewards(
	resource_id integer)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE amount_to_add integer = 0;
DECLARE att_id integer;
DECLARE resource_account_id integer;
DECLARE campaign_multiplier integer;
BEGIN
	SELECT account_id FROM sb.resources WHERE id = apply_resources_rewards.resource_id INTO resource_account_id;
	
	-- Check account is activated, and resource is not expired, not deleted, and least 1 day old
	IF EXISTS (SELECT * FROM sb.accounts WHERE id = resource_account_id AND activated IS NOT NULL 
		AND (unlimited_until IS NULL OR unlimited_until < NOW())) 
		AND NOT EXISTS(SELECT * FROM sb.resources WHERE id = apply_resources_rewards.resource_id AND (
			deleted IS NOT NULL OR (expiration IS NOT NULL AND expiration < NOW()) OR created > (NOW() - INTERVAL '1 day')))
	THEN
		-- If there has not been any reward for creating the resource, grant it
		IF NOT EXISTS ( SELECT * 
						FROM sb.resources_accounts_token_transactions ratt
						INNER JOIN sb.accounts_token_transactions att ON ratt.accounts_token_transaction_id = att.id  AND att.token_transaction_type_id = 5
						WHERE ratt.resource_id = apply_resources_rewards.resource_id ) THEN
			
			SELECT COALESCE(resource_rewards_multiplier, 1) INTO campaign_multiplier
			FROM sb.get_active_campaign() c
			INNER JOIN sb.campaigns_resources cr ON cr.campaign_id = c.id AND cr.resource_id = apply_resources_rewards.resource_id;
			
			IF campaign_multiplier IS NULL THEN
				SELECT 1 into campaign_multiplier;
			END IF;
			
			amount_to_add = amount_to_add + 20 * campaign_multiplier;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 5, 20 * campaign_multiplier)
			RETURNING id INTO att_id;
			
			INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
			VALUES (att_id, apply_resources_rewards.resource_id);
		END IF;
		
		-- If a resource image has been added, give the reward
		IF (SELECT COUNT(*) FROM sb.resources_images ri WHERE ri.resource_id = apply_resources_rewards.resource_id) > 0 
			AND NOT EXISTS (SELECT * 
							FROM sb.resources_accounts_token_transactions ratt
							INNER JOIN sb.accounts_token_transactions att ON ratt.accounts_token_transaction_id = att.id  AND att.token_transaction_type_id = 4
							WHERE ratt.resource_id = apply_resources_rewards.resource_id ) THEN
			amount_to_add = amount_to_add + 5 * campaign_multiplier;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 4, 5 * campaign_multiplier)
			RETURNING id INTO att_id;
			
			INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
			VALUES (att_id, apply_resources_rewards.resource_id);
		END IF;

		-- If a resource price has been set, give the reward
		IF (SELECT COUNT(*) FROM sb.resources r WHERE r.id = apply_resources_rewards.resource_id AND r.price IS NOT NULL) > 0 
			AND NOT EXISTS (SELECT * 
							FROM sb.resources_accounts_token_transactions ratt
							INNER JOIN sb.accounts_token_transactions att ON ratt.accounts_token_transaction_id = att.id  AND att.token_transaction_type_id = 14
							WHERE ratt.resource_id = apply_resources_rewards.resource_id ) THEN
			amount_to_add = amount_to_add + 15 * campaign_multiplier;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 14, 15 * campaign_multiplier)
			RETURNING id INTO att_id;
			
			INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
			VALUES (att_id, apply_resources_rewards.resource_id);
		END IF;

		IF amount_to_add > 0 THEN
			UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + amount_to_add
			WHERE id = resource_account_id;
		END IF;
	END IF;
END;
$BODY$;

CREATE TABLE IF NOT EXISTS sb.server_logs
(
    id integer NOT NULL DEFAULT nextval('server_logs_id_seq'::regclass),
    level character varying COLLATE pg_catalog."default",
    "timestamp" timestamp without time zone,
    context character varying COLLATE pg_catalog."default",
    message character varying COLLATE pg_catalog."default",
    stack json,
    CONSTRAINT server_logs_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.server_logs
    OWNER to sb;
	
GRANT SELECT ON TABLE sb.server_logs TO admin;
	
COMMENT ON TABLE server_logs IS '@omit';

CREATE OR REPLACE FUNCTION sb.search_server_logs(
	search_term character varying)
    RETURNS SETOF server_logs
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$

SELECT *
FROM sb.server_logs m
WHERE message ILIKE '%' || search_term || '%' OR context ILIKE '%' || search_term || '%' OR level ILIKE '%' || search_term || '%'
ORDER BY timestamp DESC;

$BODY$;

ALTER FUNCTION sb.search_server_logs(character varying)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.search_server_logs(character varying) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.search_server_logs(character varying) TO admin;

CREATE OR REPLACE FUNCTION sb.search_client_logs(
	search_term character varying)
    RETURNS SETOF client_logs
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$

SELECT *
FROM sb.client_logs m
WHERE cast(account_id as text) ILIKE '%' || search_term || '%' OR activity_id ILIKE '%' || search_term || '%' OR data ILIKE '%' || search_term || '%' OR cast(level as text) ILIKE '%' || search_term || '%'
ORDER BY created DESC;

$BODY$;

ALTER FUNCTION sb.search_client_logs(character varying)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.search_client_logs(character varying) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.search_client_logs(character varying) TO admin;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.10.1', minimum_client_version = '0.10.3';
END;
$body$
LANGUAGE 'plpgsql'; 