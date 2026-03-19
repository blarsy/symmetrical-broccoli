CREATE OR REPLACE FUNCTION sb.register_account_external_auth(
	email character varying,
	token character varying,
	account_name character varying,
	language character varying,
	auth_provider integer)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id uuid;
BEGIN
	IF EXISTS(SELECT *
		FROM sb.external_auth_tokens eat
		WHERE eat.email = LOWER(register_account_external_auth.email) AND
			eat.token = register_account_external_auth.token AND
			eat.auth_provider = register_account_external_auth.auth_provider) THEN
	
		INSERT INTO sb.accounts_public_data(name)
		VALUES (account_name)
		RETURNING id INTO inserted_id;
		
		INSERT INTO sb.accounts_private_data(account_id, email, language, activated)
		VALUES (inserted_id, LOWER(register_account_external_auth.email), 
			register_account_external_auth.language, now());	

		INSERT INTO sb.broadcast_prefs (event_type, account_id, days_between_summaries)
		VALUES (2, inserted_id, 1);
		INSERT INTO sb.broadcast_prefs (event_type, account_id, days_between_summaries)
		VALUES (3, inserted_id, 1);

		PERFORM sb.create_notification(inserted_id, json_build_object(
			'info', 'COMPLETE_PROFILE'
		));
	
		RETURN (
			inserted_id,
			EXTRACT(epoch FROM now() + interval '100 day'),
			'identified_account'
		)::sb.jwt_token;
	
  	END IF;
	RETURN NULL;
END;
$BODY$;

CREATE OR REPLACE FUNCTION sb.request_account_recovery(
	email character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE code TEXT;
DECLARE language TEXT;
begin
	SELECT array_to_string(array(select substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
	INTO code;
	
	SELECT a.language
	INTO block.language
	FROM sb.accounts_private_data a
	WHERE a.email = LOWER(request_account_recovery.email);
	
	UPDATE sb.accounts_private_data SET recovery_code = code, recovery_code_expiration = NOW() + interval '15 minutes'
	WHERE accounts.email = LOWER(request_account_recovery.email);
	
	IF FOUND THEN
		PERFORM sb.add_job('mailPasswordRecovery', 
			json_build_object('email', LOWER(request_account_recovery.email), 'code', code, 'lang', block.language));
	END IF;
	
	RETURN 1;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.is_password_valid(
	password character varying)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	
	RETURN LENGTH(password) >= 8 AND regexp_count(password, '[A-Z]') > 0 AND (regexp_count(password, '[0-9]') > 0 OR regexp_count(password, '^\w') > 0);
END;
$BODY$;

CREATE OR REPLACE FUNCTION sb.request_account_recovery(
	email character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE code TEXT;
DECLARE language TEXT;
begin
	SELECT array_to_string(array(select substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
	INTO code;
	
	SELECT a.language
	INTO block.language
	FROM sb.accounts_private_data a
	WHERE a.email = LOWER(request_account_recovery.email);
	
	UPDATE sb.accounts_private_data apr SET recovery_code = code, recovery_code_expiration = NOW() + interval '15 minutes'
	WHERE apr.email = LOWER(request_account_recovery.email);
	
	IF FOUND THEN
		PERFORM sb.add_job('mailPasswordRecovery', 
			json_build_object('email', LOWER(request_account_recovery.email), 'code', code, 'lang', block.language));
	END IF;
	
	RETURN 1;
end;
$BODY$;


CREATE OR REPLACE FUNCTION sb.send_activation_again(
	)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE activation_code character varying;
DECLARE activated_email character varying;
DECLARE account_language character varying;
begin
	SELECT ea.activation_code, ea.email, a.language
	INTO block.activation_code, block.activated_email, block.account_language
	FROM sb.email_activations ea 
	INNER JOIN sb.accounts_private_data a ON a.account_id = ea.account_id
	WHERE a.account_id = current_account_id() AND ea.activated IS NULL
	ORDER BY ea.created DESC
	LIMIT 1;
	
	IF block.activation_code IS NULL THEN
		RETURN 2;
	END IF;
	
	PERFORM sb.add_job('mailActivation',
		json_build_object('email', LOWER(block.activated_email), 'code', block.activation_code, 'lang', block.account_language));
	
	RETURN 1;
end;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.12.2', minimum_client_version = '0.12.0';
END;
$body$
LANGUAGE 'plpgsql'; 