GRANT EXECUTE ON FUNCTION sb.sync_push_token(character varying) TO identified_account;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.1.11';
END;
$body$
LANGUAGE 'plpgsql'; 