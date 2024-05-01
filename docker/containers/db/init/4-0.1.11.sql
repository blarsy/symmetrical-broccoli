GRANT EXECUTE ON FUNCTION sb.sync_push_token(character varying) TO identified_account;

CREATE OR REPLACE FUNCTION sb.recover_account(
	recovery_code character varying,
	new_password character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE code TEXT;
begin
	UPDATE sb.accounts SET hash = phs.hash, salt = phs.salt, recovery_code = null, recovery_code_expiration = null
	FROM sb.get_password_hash_salt(recover_account.new_password) phs
	WHERE accounts.recovery_code = recover_account.recovery_code AND recovery_code_expiration > NOW();
	
	RETURN 1;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.sync_push_token(
	token character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	UPDATE sb.accounts_push_tokens SET token = sync_push_token.token, last_time_used = NOW()
	WHERE account_id = sb.current_account_id();
	
	IF NOT FOUND THEN
		INSERT INTO sb.accounts_push_tokens (account_id, token, last_time_used)
		VALUES (sb.current_account_id(), sync_push_token.token, NOW());
	END IF;
	
	RETURN 1;
END;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.11';
END;
$body$
LANGUAGE 'plpgsql'; 