CREATE OR REPLACE FUNCTION sb.conversation_messages(
	resource_id integer,
	other_account_id integer)
    RETURNS SETOF messages 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT m.*
  	FROM sb.messages m
  	WHERE m.participant_id IN (
		SELECT p.id FROM sb.participants p
		WHERE p.conversation_id = (
			SELECT c.id FROM sb.conversations c
			WHERE c.resource_id = conversation_messages.resource_id AND EXISTS(
				SELECT * FROM sb.participants p2
				WHERE p2.conversation_id = c.id AND p2.account_id = sb.current_account_id()
			) AND EXISTS(
				SELECT * FROM sb.participants p2
				WHERE p2.conversation_id = c.id AND p2.account_id = other_account_id
			)
		)
	)
	ORDER BY m.created DESC
 
$BODY$;

ALTER FUNCTION sb.conversation_messages(integer, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.conversation_messages(integer, integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.conversation_messages(integer, integer) TO sb;


CREATE OR REPLACE FUNCTION sb.set_participant_read(
	resource_id integer,
	other_account_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	DELETE FROM sb.unread_messages u
	WHERE participant_id = (SELECT p.id FROM sb.participants p
		WHERE p.account_id = sb.current_account_id() AND p.conversation_id = (
			SELECT c.id FROM sb.conversations c
			WHERE c.resource_id = set_participant_read.resource_id AND EXISTS(
				SELECT * FROM sb.participants p2
				WHERE p2.conversation_id = c.id AND p2.account_id = sb.current_account_id()
			) AND EXISTS(
				SELECT * FROM sb.participants p3
				WHERE p3.conversation_id = c.id AND p3.account_id = other_account_id
			)
		)
	);

	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.set_participant_read(integer, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.set_participant_read(integer, integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.set_participant_read(integer, integer) TO sb;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.2.6', minimum_client_version = '0.2.5';
END;
$body$
LANGUAGE 'plpgsql'; 