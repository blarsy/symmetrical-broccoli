DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.10.0', minimum_client_version = '0.10.0';
END;
$body$
LANGUAGE 'plpgsql'; 