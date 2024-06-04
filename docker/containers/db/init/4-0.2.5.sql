DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.2.5', minimum_client_version = '0.2.5';
END;
$body$
LANGUAGE 'plpgsql'; 