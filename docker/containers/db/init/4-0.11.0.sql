INSERT INTO sb.token_transaction_types (id, code)
VALUES (17, 'GRANT_HIT');

CREATE TABLE sb.grants_accounts
(
    grant_id uuid NOT NULL,
    account_id integer NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (grant_id, account_id),
    CONSTRAINT grants_accounts_grants FOREIGN KEY (grant_id)
        REFERENCES sb.grants (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT grants_accounts_accounts FOREIGN KEY (account_id)
        REFERENCES sb.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS sb.grants_accounts
    OWNER to sb;

GRANT INSERT, SELECT ON TABLE sb.grants_accounts TO identified_account;

COMMENT ON TABLE sb.grants_accounts IS '@omit';


CREATE OR REPLACE FUNCTION sb.get_grant_by_uid(
	uid uuid)
    RETURNS grants
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$

	SELECT id, title, description, amount, expiration, '{}'::json, NOW()
	FROM sb.grants
	WHERE id = uid;
 
$BODY$;

ALTER FUNCTION sb.get_grant_by_uid(uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_grant_by_uid(uuid) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_grant_by_uid(uuid) TO identified_account;


CREATE OR REPLACE FUNCTION sb.grant_hit(
	grant_id uuid)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE grant_amount INTEGER;
DECLARE grant_expiration timestamp with time zone;
DECLARE grant_data JSON;
DECLARE grant_title CHARACTER VARYING;
BEGIN
	-- grant exists
	SELECT amount, expiration, data, title
	INTO grant_amount, grant_expiration, grant_data, grant_title
	FROM sb.grants
	WHERE id = grant_id;

	IF grant_expiaration > NOW() THEN
		RETURN -1; -- expired grant
	END IF;

	IF grant_data -> 'maxNumberOfGrants' IS NOT NULL AND
		(SELECT COUNT(*) FROM sb.grants_accounts ga WHERE ga.grant_id = grant_hit.grant_id) >= grant_data -> 'maxNumberOfGrants' THEN

		RETURN -2; -- max number of grants reached

	END IF;
	
	IF grant_data -> 'emails' IS NOT NULL AND
		NOT EXISTS (SELECT json_array_elements_text(grant_data -> 'emails') as email 
				WHERE LOWER(email) = (SELECT email FROM sb.accounts WHERE id = sb.current_account_id()) ) THEN
		
		RETURN -3; -- not on the whitelist
		
	END IF;
	
	IF grant_data -> 'activeInCampaign' IS NOT NULL AND
		NOT EXISTS ( SELECT * 
					FROM sb.campaigns_resources cr 
					INNER JOIN sb.resources r ON cr.resource_id = r.id
					WHERE campaign_id = (grant_data ->> 'activeInCampaign')::integer AND
				    r.account_id = sb.current_account_id()) THEN
					
		RETURN -4; -- Not a participant to the campaign
		
	END IF;
	
	-- insert grant_account
	INSERT INTO sb.grants_accounts (grant_id, account_id)
	VALUES (grant_hit.grant_id, sb.current_user_id());
	
	-- create transaction history record
	INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
	VALUES (sb.current_user_id(), 17, grant_amount);
	
	-- increase account token amount
	UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + grant_amount
	WHERE id = sb.current_account_id();
	
	-- Create notification
	PERFORM sb.create_notification(sb.current_account_id(), json_build_object(
		'info', 'GRANT_RECEIVED',
		'amount', grant_amount,
		'title', grant_title
	));

	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.grant_hit(uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.grant_hit(uuid) TO identified_account;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.11.0', minimum_client_version = '0.11.0';
END;
$body$
LANGUAGE 'plpgsql'; 