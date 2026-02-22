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


DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.12.2', minimum_client_version = '0.12.0';
END;
$body$
LANGUAGE 'plpgsql'; 