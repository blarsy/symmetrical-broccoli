CREATE OR REPLACE FUNCTION sb.delete_account(
	)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE resource RECORD;
DECLARE avatar_image_id_to_delete INTEGER;
BEGIN
	SELECT avatar_image_id FROM sb.accounts
	INTO avatar_image_id_to_delete
	WHERE id = sb.current_account_id();
	
	UPDATE sb.accounts
	SET name='', email=NULL, hash='', salt='', recovery_code='',recovery_code_expiration=null, avatar_image_id=null, activated=null, language=''
	WHERE id = sb.current_account_id();

	DELETE FROM sb.images WHERE id = avatar_image_id_to_delete;
	DELETE FROM sb.accounts_push_tokens WHERE account_id = sb.current_account_id();
	DELETE FROM sb.email_activations WHERE account_id = sb.current_account_id();

	FOR resource IN (SELECT id FROM sb.resources WHERE account_id = sb.current_account_id())
	LOOP
		PERFORM sb.delete_resource(resource.id);
	END LOOP;

	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.delete_account()
    OWNER TO sb;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.2.5', minimum_client_version = '0.2.5';
END;
$body$
LANGUAGE 'plpgsql'; 