-- FUNCTION: sb.update_account(character varying, character varying)

DROP FUNCTION IF EXISTS sb.update_account(character varying, character varying);

CREATE OR REPLACE FUNCTION sb.update_account(
	name character varying,
	new_bio character varying,
	avatar_public_id character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
BEGIN
	IF avatar_public_id IS NOT NULL AND NOT EXISTS (
		SELECT *
		FROM sb.accounts_public_data a
		LEFT JOIN sb.images i ON a.avatar_image_id = i.id
		WHERE a.id = sb.current_account_id() AND i.public_id = avatar_public_id) THEN

		INSERT INTO sb.images (public_id) VALUES (avatar_public_id);
	END IF;
	
	UPDATE sb.accounts_public_data
	SET name = update_account.name, bio = update_account.new_bio, avatar_image_id = (
		SELECT id FROM sb.images i WHERE i.public_id = avatar_public_id
	)
	WHERE id = sb.current_account_id();
	
	-- Ensure the reward for setting the logo is granted, if applicable (no need to notify from that function, it is done anyway on the next line)
	PERFORM sb.grant_applicable_rewards(false);
	
	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.update_account(character varying, character varying, character varying)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.update_account(character varying, character varying, character varying) TO identified_account;


ALTER TYPE sb.session_data
    ADD ATTRIBUTE bio character varying;
	
CREATE OR REPLACE FUNCTION sb.get_session_data_web(
	)
    RETURNS session_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
	SELECT apu.id, apu.name, apr.email, sb.current_role(),
	i.public_id as avatar_public_id, apr.activated, apr.log_level,
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
	apr.amount_of_tokens,
	(SELECT COUNT(*) 
	 FROM sb.external_auth_tokens eat 
	 WHERE eat.email = apr.email) as number_of_external_auth_providers,
	apr.knows_about_campaigns, apu.bio

	FROM sb.accounts_public_data apu 
	INNER JOIN sb.accounts_private_data apr ON apu.id = apr.account_id
	LEFT JOIN sb.images i ON apu.avatar_image_id = i.id
	WHERE apu.id = sb.current_account_id()
$BODY$;

CREATE OR REPLACE FUNCTION sb.get_session_data(
	)
    RETURNS session_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
	SELECT apu.id, apu.name, apr.email, sb.current_role(), 
	i.public_id as avatar_public_id, apr.activated, apr.log_level,
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
	apr.amount_of_tokens,
	(SELECT COUNT(*) 
	 FROM sb.external_auth_tokens eat 
	 WHERE eat.email = apr.email) as number_of_external_auth_providers,
	apr.knows_about_campaigns, apu.bio

	FROM sb.accounts_public_data apu
	INNER JOIN sb.accounts_private_data apr ON apu.id = apr.account_id
	LEFT JOIN sb.images i ON apu.avatar_image_id = i.id
	WHERE apu.id = sb.current_account_id()
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.13.0', minimum_client_version = '0.13.0';
END;
$body$
LANGUAGE 'plpgsql'; 