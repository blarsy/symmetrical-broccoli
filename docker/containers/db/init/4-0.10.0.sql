CREATE OR REPLACE FUNCTION sb.conversation_messages_by_conversation_id(
	id integer)
    RETURNS SETOF messages 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT m.*
  	FROM sb.messages m
	WHERE m.participant_id IN (
		SELECT id FROM sb.participants p
		WHERE p.conversation_id = conversation_messages_by_conversation_id.id
	)
	ORDER BY m.created DESC

$BODY$;

ALTER FUNCTION sb.conversation_messages_by_conversation_id(integer)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.conversation_messages_by_conversation_id(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.conversation_messages_by_conversation_id(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.conversation_messages_by_conversation_id(integer) TO sb;

CREATE OR REPLACE FUNCTION sb.get_session_data(
	)
    RETURNS session_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
	SELECT a.id, a.name, a.email, sb.current_role(), 
	i.public_id as avatar_public_id, a.activated, a.log_level,
	ARRAY(
		SELECT DISTINCT um.participant_id
		FROM sb.unread_messages um
		INNER JOIN sb.participants p ON p.id = um.participant_id
		WHERE p.account_id = sb.current_account_id()
	) as unread_conversations,
	ARRAY(
		SELECT id
		FROM sb.my_notifications()
		WHERE read IS NULL
	) as unread_notifications,
	a.willing_to_contribute, a.amount_of_tokens, a.unlimited_until,
	(SELECT COUNT(*) 
	 FROM sb.external_auth_tokens eat 
	 WHERE eat.email = a.email) as number_of_external_auth_providers

	FROM sb.accounts a
	LEFT JOIN sb.images i ON a.avatar_image_id = i.id
	WHERE a.id = sb.current_account_id()
$BODY$;

ALTER FUNCTION sb.get_session_data()
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.get_session_data() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_session_data() TO identified_account;

CREATE OR REPLACE FUNCTION sb.get_session_data_web(
	)
    RETURNS session_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
	SELECT a.id, a.name, a.email, sb.current_role(), 
	i.public_id as avatar_public_id, a.activated, a.log_level,
	ARRAY(
		SELECT DISTINCT p.conversation_id
		FROM sb.unread_messages um
		INNER JOIN sb.participants p ON p.id = um.participant_id
		WHERE p.account_id = sb.current_account_id()
	) as unread_conversations,
	ARRAY(
		SELECT id
		FROM sb.my_notifications()
		WHERE read IS NULL
	) as unread_notifications,
	a.willing_to_contribute, a.amount_of_tokens, a.unlimited_until,
	(SELECT COUNT(*) 
	 FROM sb.external_auth_tokens eat 
	 WHERE eat.email = a.email) as number_of_external_auth_providers

	FROM sb.accounts a
	LEFT JOIN sb.images i ON a.avatar_image_id = i.id
	WHERE a.id = sb.current_account_id()
$BODY$;

ALTER FUNCTION sb.get_session_data_web()
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.get_session_data_web() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_session_data_web() TO identified_account;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.10.0', minimum_client_version = '0.10.0';
END;
$body$
LANGUAGE 'plpgsql'; 