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


ALTER TABLE IF EXISTS sb.accounts
    ADD COLUMN knows_about_campaigns boolean NOT NULL DEFAULT false;

ALTER TYPE sb.session_data
    ADD ATTRIBUTE knows_about_campaigns boolean;

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
	 WHERE eat.email = a.email) as number_of_external_auth_providers,
	a.knows_about_campaigns

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
	 WHERE eat.email = a.email) as number_of_external_auth_providers,
	a.knows_about_campaigns

	FROM sb.accounts a
	LEFT JOIN sb.images i ON a.avatar_image_id = i.id
	WHERE a.id = sb.current_account_id()
$BODY$;

ALTER FUNCTION sb.get_session_data_web()
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.get_session_data_web() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_session_data_web() TO identified_account;

REVOKE ALL ON FUNCTION sb.conversation_messages(integer, integer) FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.get_conversation_for_resource(
	resource_id integer)
    RETURNS conversations 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
	SELECT c.*
  	FROM sb.conversations c
	INNER JOIN sb.resources r ON
		c.resource_id = r.id
  	WHERE c.resource_id = get_conversation_for_resource.resource_id AND
	EXISTS (SELECT * FROM sb.participants WHERE conversation_id = c.id AND account_id = r.account_id) AND
	EXISTS (SELECT * FROM sb.participants WHERE conversation_id = c.id AND account_id = sb.current_account_id())
 
$BODY$;

ALTER FUNCTION sb.get_conversation_for_resource(integer)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.get_conversation_for_resource(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_conversation_for_resource(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.get_conversation_for_resource(integer) TO sb;

CREATE OR REPLACE FUNCTION sb.change_password(
	old_password character varying,
	new_password character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE cnt numeric;
DECLARE new_salt text;
DECLARE old_hash text;
begin
	SELECT gen_salt('md5') INTO new_salt;
	SELECT crypt(old_password, (SELECT salt FROM sb.accounts WHERE id = sb.current_account_id())) INTO old_hash;
	
	UPDATE sb.accounts a
	SET hash = crypt(new_password, new_salt), salt = new_salt
	WHERE a.id = sb.current_account_id() AND a.hash = old_hash;
	
	GET DIAGNOSTICS cnt = ROW_COUNT;
	
	IF cnt = 0 THEN
		RAISE EXCEPTION 'Invalid password';
	END IF;
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.change_password(character varying, character varying)
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.switch_to_contribution_mode(
	)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
BEGIN
	IF NOT EXISTS(SELECT * FROM sb.accounts WHERE id = sb.current_account_id() AND willing_to_contribute) THEN
		PERFORM sb.grant_applicable_rewards();
		
		-- When switching to contribution mode: 30 topes reward
		UPDATE sb.accounts
		SET willing_to_contribute = true, amount_of_tokens = amount_of_tokens + 30
		WHERE id = sb.current_account_id();
		
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 7, 30);
	
		PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
			'event', 'account_changed',
			'subject', sb.current_account_id()
		)::text);
		PERFORM sb.create_notification(sb.current_account_id(), json_build_object(
			'info', 'WELCOME_TOKEN_USER'
		));
	
		RETURN 1;
	END IF;
	
	RETURN 0;
end;
$BODY$;

ALTER FUNCTION sb.switch_to_contribution_mode()
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.switch_to_contribution_mode() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.switch_to_contribution_mode() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.switch_to_contribution_mode() TO sb;

CREATE SEQUENCE IF NOT EXISTS sb.bids_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE sb.bids_id_seq
    OWNER TO sb;

GRANT USAGE ON SEQUENCE sb.bids_id_seq TO identified_account;

GRANT ALL ON SEQUENCE sb.bids_id_seq TO sb;

CREATE TABLE sb.bids
(
    id integer NOT NULL DEFAULT nextval('bids_id_seq'::regclass),
    resource_id integer NOT NULL,
	account_id integer NOT NULL,
    amount_of_tokens integer NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    accepted timestamp with time zone,
    deleted timestamp with time zone,
    refused timestamp with time zone,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT bids_resources_fk FOREIGN KEY (resource_id)
        REFERENCES sb.resources (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
	CONSTRAINT bids_accounts_fk FOREIGN KEY (account_id)
		REFERENCES sb.accounts (id) MATCH SIMPLE
		ON UPDATE NO ACTION
		ON DELETE NO ACTION
		NOT VALID
);

ALTER TABLE IF EXISTS sb.bids
    OWNER to sb;

GRANT INSERT, SELECT, UPDATE ON TABLE sb.bids TO identified_account;

DO
$body$
BEGIN
	INSERT INTO sb.token_transaction_types(id, code) VALUES (10,'BID_CREATION');
	INSERT INTO sb.token_transaction_types(id, code) VALUES (11,'BID_CANCELLATION');
	INSERT INTO sb.token_transaction_types(id, code) VALUES (12,'BID_ACCEPT');
END;
$body$
LANGUAGE 'plpgsql'; 

CREATE OR REPLACE FUNCTION sb.create_bid(
	resource_id integer,
	amount_of_tokens integer,
	hours_valid integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE existing_bid_id INTEGER;
DECLARE inserted_id INTEGER;
DECLARE att_id INTEGER;
DECLARE existing_bid_amount INTEGER;
BEGIN
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = create_bid.resource_id AND (expiration IS NULL OR expiration > NOW()) AND can_be_exchanged AND deleted IS NULL AND suspended IS NULL) THEN
		RETURN -1;
	END IF;
	IF create_bid.amount_of_tokens > (SELECT a.amount_of_tokens FROM sb.accounts a WHERE id = sb.current_account_id()) THEN
		RETURN -2;
	END IF;

	SELECT id, b.amount_of_tokens FROM sb.bids b INTO existing_bid_id, existing_bid_amount
	WHERE b.account_id = sb.current_account_id() AND b.resource_id = create_bid.resource_id AND
		deleted IS NULL AND refused IS NULL AND accepted IS NULL AND valid_until > NOW();

	INSERT INTO sb.bids(
		resource_id, amount_of_tokens, account_id, valid_until)
	VALUES (create_bid.resource_id, create_bid.amount_of_tokens, sb.current_account_id(), NOW() + hours_valid * interval '1 hour')
	RETURNING id INTO inserted_id;
	
	INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
	VALUES (sb.current_account_id(), 10, -create_bid.amount_of_tokens)
	RETURNING id INTO att_id;

	INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
	VALUES (att_id, create_bid.resource_id);
	
	UPDATE sb.accounts a SET amount_of_tokens = a.amount_of_tokens - create_bid.amount_of_tokens
	WHERE id = sb.current_account_id();

	IF existing_bid_id IS NOT NULL THEN
		UPDATE sb.bids
		SET deleted = NOW()
		WHERE id = existing_bid_id;
		
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 11, existing_bid_amount)
		RETURNING id INTO att_id;
		
		INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
		VALUES (att_id, create_bid.resource_id);
		
		UPDATE sb.accounts a SET amount_of_tokens = a.amount_of_tokens + existing_bid_amount
		WHERE id = sb.current_account_id();
	END IF;
	
	PERFORM sb.create_notification((SELECT r.account_id FROM sb.resources r WHERE id = create_bid.resource_id), json_build_object(
		'info', 'BID_RECEIVED',
		'resourceId', create_bid.resource_id,
		'resourceTitle', (SELECT title FROM sb.resources WHERE id = create_bid.resource_id), 
		'receivedFrom', (SELECT name FROM sb.accounts WHERE id = sb.current_account_id())
	));

	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN inserted_id;
end;
$BODY$;

ALTER FUNCTION sb.create_bid(integer, integer, integer)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.create_bid(integer, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.create_bid(integer, integer, integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.create_bid(integer, integer, integer) TO sb;

CREATE OR REPLACE FUNCTION sb.delete_bid_internal(
	bid_id integer,
	bid_account_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE existing_bid_amount INTEGER;
DECLARE existing_bid_resource_id INTEGER;
DECLARE existing_bid_account_id INTEGER;
DECLARE resource_account_id INTEGER;
DECLARE att_id INTEGER;
BEGIN
	SELECT amount_of_tokens, resource_id, account_id FROM sb.bids 
	INTO existing_bid_amount, existing_bid_resource_id, existing_bid_account_id
	WHERE id = bid_id AND account_id = bid_account_id
		AND deleted IS NULL AND accepted IS NULL AND refused IS NULL;
	
	IF existing_bid_amount IS NULL THEN
		RETURN -1;
	END IF;

	UPDATE sb.bids
	SET deleted = NOW()
	WHERE id = bid_id;

	INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
	VALUES (existing_bid_account_id, 11, existing_bid_amount)
	RETURNING id INTO att_id;

	INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
	VALUES (att_id, existing_bid_resource_id);

	UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + existing_bid_amount
	WHERE id = existing_bid_account_id;
	
	PERFORM pg_notify('graphql:account_changed:' || existing_bid_account_id, json_build_object(
		'event', 'account_changed',
		'subject', existing_bid_account_id
	)::text);

	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.delete_bid_internal(integer, integer)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.delete_bid_internal(integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.delete_bid_internal(integer, integer) TO sb;

CREATE OR REPLACE FUNCTION sb.delete_bid(
	bid_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE ret_val INTEGER;
DECLARE existing_bid_resource_id INTEGER;
DECLARE existing_bid_account_id INTEGER;
DECLARE resource_account_id INTEGER;
BEGIN
	SELECT sb.delete_bid_internal(bid_id, sb.current_account_id()) INTO ret_val;
	
	IF ret_val = 1 THEN
		SELECT b.resource_id, b.account_id, r.account_id 
		INTO existing_bid_resource_id, existing_bid_account_id , resource_account_id
		FROM sb.bids b 
		INNER JOIN sb.resources r ON r.id = b.resource_id
		WHERE b.id = bid_id;
	
		PERFORM sb.create_notification(resource_account_id, json_build_object(
			'info', 'BID_CANCELLED',
			'resourceId', existing_bid_resource_id,
			'resourceTitle', (SELECT title FROM sb.resources WHERE id = existing_bid_resource_id), 
			'cancelledBy', (SELECT name FROM sb.accounts WHERE id = existing_bid_account_id)
		));
	END IF;
	
	RETURN ret_val;
end;
$BODY$;

ALTER FUNCTION sb.delete_bid(integer)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.delete_bid(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.delete_bid(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.delete_bid(integer) TO sb;

CREATE OR REPLACE FUNCTION sb.refuse_bid(
	bid_id integer,
	notification_type CHARACTER VARYING)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE existing_bid_amount INTEGER;
DECLARE existing_bid_resource_id INTEGER;
DECLARE existing_bid_account_id INTEGER;
DECLARE resource_account_id INTEGER;
DECLARE att_id INTEGER;
BEGIN
	SELECT amount_of_tokens, resource_id, account_id FROM sb.bids 
	INTO existing_bid_amount, existing_bid_resource_id, existing_bid_account_id
	WHERE id = bid_id AND deleted IS NULL AND accepted IS NULL AND refused IS NULL AND valid_until > NOW()
		AND EXISTS (SELECT * FROM sb.resources WHERE id=resource_id AND account_id = sb.current_account_id());
	
	IF existing_bid_amount IS NULL THEN
		RETURN -1;
	END IF;

	UPDATE sb.bids
	SET refused = NOW()
	WHERE id = bid_id;

	INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
	VALUES (existing_bid_account_id, 11, existing_bid_amount)
	RETURNING id INTO att_id;

	INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
	VALUES (att_id, existing_bid_resource_id);

	UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + existing_bid_amount
	WHERE id = existing_bid_account_id;
		
	SELECT account_id INTO resource_account_id
	FROM sb.resources
	WHERE id = existing_bid_resource_id;
	
	PERFORM sb.create_notification(existing_bid_account_id, json_build_object(
		'info', COALESCE(notification_type, 'BID_REFUSED'),
		'resourceId', existing_bid_resource_id,
		'resourceTitle', (SELECT title FROM sb.resources WHERE id = existing_bid_resource_id), 
		'refusedBy', (SELECT name FROM sb.accounts WHERE id = resource_account_id)
	));
	PERFORM pg_notify('graphql:account_changed:' || existing_bid_account_id, json_build_object(
		'event', 'account_changed',
		'subject', existing_bid_account_id
	)::text);
	
	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.refuse_bid(integer, CHARACTER VARYING)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.refuse_bid(integer, CHARACTER VARYING) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.refuse_bid(integer, CHARACTER VARYING) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.refuse_bid(integer, CHARACTER VARYING) TO sb;

CREATE OR REPLACE FUNCTION sb.accept_bid(
	bid_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE existing_bid_amount INTEGER;
DECLARE existing_bid_resource_id INTEGER;
DECLARE existing_bid_account_id INTEGER;
DECLARE resource_account_id INTEGER;
DECLARE att_id INTEGER;
BEGIN
	SELECT amount_of_tokens, resource_id, account_id FROM sb.bids 
	INTO existing_bid_amount, existing_bid_resource_id, existing_bid_account_id
	WHERE id = bid_id AND deleted IS NULL AND accepted IS NULL AND refused IS NULL AND valid_until > NOW()
		AND EXISTS (SELECT * FROM sb.resources WHERE id=resource_id AND account_id = sb.current_account_id());
	
	IF existing_bid_amount IS NULL THEN
		RETURN -1;
	END IF;

	UPDATE sb.bids
	SET accepted = NOW()
	WHERE id = bid_id;

	INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
	VALUES (sb.current_account_id(), 12, existing_bid_amount)
	RETURNING id INTO att_id;

	INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
	VALUES (att_id, existing_bid_resource_id);

	UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + existing_bid_amount
	WHERE id = sb.current_account_id();
	
	SELECT account_id INTO resource_account_id
	FROM sb.resources
	WHERE id = existing_bid_resource_id;
	
	PERFORM sb.create_notification(existing_bid_account_id, json_build_object(
		'info', 'BID_ACCEPTED',
		'resourceId', existing_bid_resource_id,
		'resourceTitle', (SELECT title FROM sb.resources WHERE id = existing_bid_resource_id), 
		'acceptedBy', (SELECT name FROM sb.accounts WHERE id = resource_account_id)
	));
	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.accept_bid(integer)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.accept_bid(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.accept_bid(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.accept_bid(integer) TO sb;

CREATE OR REPLACE FUNCTION sb.handle_resources_and_bids_expiration()
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE bid_on_expired_res record;
DECLARE bid record;
DECLARE delete_ret_val INTEGER;
BEGIN
	FOR bid_on_expired_res IN
	SELECT b.*, r.account_id as resource_author_id FROM sb.bids b
	INNER JOIN sb.resources r ON b.resource_id = r.id AND r.expiration IS NOT NULL 
		AND r.expiration < NOW() AND b.deleted IS NULL
		AND accepted IS NULL AND refused IS NULL AND valid_until > NOW()
	LOOP
		PERFORM sb.delete_bid_internal(bid_on_expired_res.id, bid_on_expired_res.account_id);
		PERFORM sb.create_notification(bid_on_expired_res.account_id, json_build_object(
			'info', 'BID_AUTO_DELETED_AFTER_RESOURCE_EXPIRED',
			'resourceId', bid_on_expired_res.resource_id,
			'resourceTitle', (SELECT title FROM sb.resources WHERE id = bid_on_expired_res.resource_id), 
			'resourceAuthor', (SELECT name FROM sb.accounts WHERE id = bid_on_expired_res.resource_author_id)
		));
	END LOOP;
		
	FOR bid IN
	SELECT b.*, r.account_id as resource_author_id FROM sb.bids b
	INNER JOIN sb.resources r ON b.resource_id = r.id AND (r.expiration IS NULL OR r.expiration > NOW())
	WHERE valid_until < NOW() AND b.deleted IS NULL
			AND accepted IS NULL AND refused IS NULL
	LOOP
		SELECT sb.delete_bid_internal(bid.id, bid.account_id) INTO delete_ret_val;
		
		IF delete_ret_val = 1 THEN
			PERFORM sb.create_notification(bid.account_id, json_build_object(
				'info', 'BID_EXPIRED',
				'resourceId', bid.resource_id,
				'resourceTitle', (SELECT title FROM sb.resources WHERE id = bid.resource_id), 
				'resourceAuthor', (SELECT name FROM sb.accounts WHERE id = bid.resource_author_id)
			));
		END IF;
	END LOOP;
END;
$BODY$;

GRANT EXECUTE ON FUNCTION sb.handle_resources_and_bids_expiration() TO sb;

REVOKE ALL ON FUNCTION sb.handle_resources_and_bids_expiration() FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.delete_resource(
	resource_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE ids_images_to_delete INTEGER[];
DECLARE bid record;
begin
	--Detect attempt to delete a resource owned by another account
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = delete_resource.resource_id AND account_id = sb.current_account_id()) THEN
		RETURN 0;
	END IF;
	
	UPDATE sb.resources r
	SET deleted = NOW()
	WHERE r.id = delete_resource.resource_id;
	
	DELETE FROM sb.campaigns_resources WHERE resource_id = delete_resource.resource_id;
	
	FOR bid IN
	SELECT * FROM sb.bids b
	WHERE b.resource_id = delete_resource.resource_id
	AND deleted IS NULL AND accepted IS NULL AND refused IS NULL AND valid_until > NOW()
	LOOP
		PERFORM sb.refuse_bid(bid.id, 'BID_AUTO_REFUSED_AFTER_RESOURCE_DELETED');
	END LOOP;
	
	-- In case a free resource was deleted, run apply_resources_consumption,
	-- which could un-suspend a suspended resource
	PERFORM sb.apply_resources_consumption(sb.current_account_id());
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.delete_resource(integer)
    OWNER TO sb;
	
GRANT EXECUTE ON FUNCTION sb.delete_resource(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.delete_resource(integer) TO sb;

GRANT USAGE ON SEQUENCE sb.resources_accounts_token_transactions_id_seq TO identified_account;

GRANT ALL ON SEQUENCE sb.resources_accounts_token_transactions_id_seq TO sb;

CREATE OR REPLACE FUNCTION sb.send_tokens(
	target_account_id integer,
	amount_to_send integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	IF(target_account_id = sb.current_account_id()) THEN
		RETURN 0;
	END IF;
	IF(amount_to_send > (SELECT amount_of_tokens FROM sb.accounts WHERE id = sb.current_account_id())) THEN
		RETURN 2;
	END IF;
	
	INSERT INTO sb.accounts_token_transactions(
		account_id, token_transaction_type_id, movement, target_account_id)
	VALUES (sb.current_account_id(), 8, -amount_to_send, send_tokens.target_account_id);
	INSERT INTO sb.accounts_token_transactions(
		account_id, token_transaction_type_id, movement, target_account_id)
	VALUES (send_tokens.target_account_id, 9, amount_to_send, sb.current_account_id());

	UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens - amount_to_send
	WHERE id = sb.current_account_id();
	UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + amount_to_send
	WHERE id = send_tokens.target_account_id;
	
	-- Create a notification for the sender, and one for the receiver
	PERFORM sb.create_notification(target_account_id, json_build_object(
		'info', 'TOKENS_RECEIVED', 'fromAccount', (SELECT name FROM sb.accounts WHERE id = sb.current_account_id()), 'amountReceived', amount_to_send
	));
	PERFORM sb.create_notification(sb.current_account_id(), json_build_object(
		'info', 'TOKENS_SENT', 'toAccount', (SELECT name FROM sb.accounts WHERE id = target_account_id), 'amountSent', amount_to_send
	));
	PERFORM pg_notify('graphql:account_changed:' || target_account_id, json_build_object(
		'event', 'account_changed',
		'subject', target_account_id
	)::text);
	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN 1;
END;
$BODY$;

CREATE OR REPLACE FUNCTION sb.my_bids(
		include_inactive BOOLEAN DEFAULT false
	)
    RETURNS SETOF bids 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT *
  FROM sb.bids
  WHERE account_id = sb.current_account_id()
  AND (include_inactive OR 
  	(deleted IS NULL AND accepted IS NULL AND refused IS NULL AND valid_until > NOW()))
  ORDER BY created DESC;
 
$BODY$;

ALTER FUNCTION sb.my_bids(boolean)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.my_bids(boolean) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.my_bids(boolean) TO sb;

REVOKE ALL ON FUNCTION sb.my_bids(boolean) FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.my_received_bids(
		include_inactive BOOLEAN DEFAULT false
	)
    RETURNS SETOF bids 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
SELECT b.*
  FROM sb.bids b
  INNER JOIN sb.resources r ON r.id = b.resource_id AND r.deleted IS NULL
  WHERE r.account_id = sb.current_account_id() AND (include_inactive OR 
  	(b.deleted IS NULL AND accepted IS NULL AND refused IS NULL AND valid_until > NOW()))
  ORDER BY b.created DESC;
 
$BODY$;

ALTER FUNCTION sb.my_received_bids(boolean)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.my_received_bids(boolean) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.my_received_bids(boolean) TO sb;

REVOKE ALL ON FUNCTION sb.my_received_bids(boolean) FROM PUBLIC;

ALTER TABLE IF EXISTS sb.resources
    RENAME subjective_value TO price;

DROP FUNCTION create_resource(character varying,character varying,timestamp with time zone,integer,boolean,boolean,boolean,boolean,boolean,boolean,character varying[],integer[],new_location);

CREATE OR REPLACE FUNCTION sb.create_resource(
	title character varying,
	description character varying,
	expiration timestamp with time zone,
	price integer,
	is_service boolean,
	is_product boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	can_be_exchanged boolean,
	can_be_gifted boolean,
	images_public_ids character varying[],
	category_codes integer[],
	specific_location new_location)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id INTEGER;
DECLARE location_id INTEGER = NULL;
BEGIN
	-- Prevent creating a resource if the account already has 2 active
	-- and is not either contributor, or unlimited account
	IF NOT EXISTS (SELECT *
		FROM sb.accounts a
		WHERE id = sb.current_account_id()
		AND ((
			(a.unlimited_until IS NOT NULL AND a.unlimited_until > NOW())
		) OR (
			(SELECT COUNT(*) FROM sb.resources r WHERE r.account_id = sb.current_account_id()
			AND (r.expiration is NULL OR r.expiration > NOW())
			AND r.deleted IS NULL
			AND r.suspended IS NULL) < (SELECT amount_free_resources FROM sb.system)
		) OR (
			a.willing_to_contribute
		))) THEN
	
		RAISE EXCEPTION 'ACCOUNT_CANNOT_CREATE_NON_FREE_RESOURCES';
	
	END IF;
	
	IF specific_location IS NOT NULL THEN
		INSERT INTO sb.locations (address, latitude, longitude)
		VALUES (specific_location.address, specific_location.latitude, specific_location.longitude)
		RETURNING id INTO location_id;
	END IF;

	INSERT INTO sb.resources(
		title, description, expiration, account_id, created, is_service, is_product, 
		can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted, 
		specific_location_id, paid_until, price)
	VALUES (create_resource.title, create_resource.description, create_resource.expiration, sb.current_account_id(),
			NOW(), create_resource.is_service, create_resource.is_product, create_resource.can_be_delivered,
			create_resource.can_be_taken_away, create_resource.can_be_exchanged, create_resource.can_be_gifted, 
			location_id, NOW(), create_resource.price)
	RETURNING id INTO inserted_id;
	
	INSERT INTO sb.resources_resource_categories (resource_id, resource_category_code)
	SELECT inserted_id, UNNEST(category_codes);
	
	WITH inserted_images AS (
		INSERT INTO sb.images (public_id)
		SELECT UNNEST(images_public_ids)
		RETURNING id AS inserted_image_id
	)
	INSERT INTO sb.resources_images (resource_id, image_id)
	SELECT inserted_id, inserted_images.inserted_image_id FROM inserted_images;
	
	PERFORM sb.apply_resources_consumption(sb.current_account_id());
	
	IF (SELECT activated FROM sb.accounts WHERE id = sb.current_account_id()) IS NOT NULL AND
		(SELECT suspended FROM sb.resources WHERE id = inserted_id) IS NULL THEN
		-- Emit notification for push notification handling
		PERFORM pg_notify('resource_created', json_build_object(
			'resource_id', inserted_id
		)::text);
	END IF;
	
	RETURN inserted_id;
end;
$BODY$;

ALTER FUNCTION sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location)
    OWNER TO sb;

DROP FUNCTION update_resource(integer, character varying,character varying,timestamp with time zone,integer,boolean,boolean,boolean,boolean,boolean,boolean,character varying[],integer[],new_location);

CREATE OR REPLACE FUNCTION sb.update_resource(
	resource_id integer,
	title character varying,
	description character varying,
	expiration timestamp with time zone,
	price integer,
	is_service boolean,
	is_product boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	can_be_exchanged boolean,
	can_be_gifted boolean,
	images_public_ids character varying[],
	category_codes integer[],
	specific_location new_location)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE ids_images_to_delete INTEGER[];
DECLARE location_id INTEGER = NULL;
DECLARE location_to_delete_id INTEGER = NULL;
BEGIN
	--Detect attempt to update a resource owned by another account
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = update_resource.resource_id AND account_id = sb.current_account_id()) THEN
		RETURN 0;
	END IF;
	
	--Detect attempt to update a resource already deleted
	IF EXISTS(SELECT * FROM sb.resources WHERE id = update_resource.resource_id AND deleted IS NOT NULL) THEN
		RETURN -1;
	END IF;
	
	SELECT specific_location_id INTO location_id
	FROM sb.resources
	WHERE id = resource_id;

	IF specific_location IS NOT NULL THEN
		IF location_id IS NULL THEN
			INSERT INTO sb.locations (address, latitude, longitude)
			VALUES (specific_location.address, specific_location.latitude, specific_location.longitude)
			RETURNING id INTO location_id;
		ELSE
			UPDATE sb.locations SET address = specific_location.address, latitude = specific_location.latitude, longitude = specific_location.longitude
			WHERE id = location_id;
		END IF;
	ELSE
		IF location_id IS NOT NULL THEN
			SELECT location_id INTO location_to_delete_id;
		END IF;
		SELECT null INTO location_id;
	END IF;

	UPDATE sb.resources r SET title = update_resource.title, description = update_resource.description, 
		expiration = update_resource.expiration, is_service = update_resource.is_service, 
		is_product = update_resource.is_product, can_be_delivered = update_resource.can_be_delivered, 
		can_be_taken_away = update_resource.can_be_taken_away, can_be_exchanged = update_resource.can_be_exchanged, 
		can_be_gifted = update_resource.can_be_gifted, specific_location_id = location_id,
		price = update_resource.price
	WHERE r.id = update_resource.resource_id;
	
	IF location_to_delete_id IS NOT NULL THEN
		DELETE FROM sb.locations WHERE id = location_to_delete_id;
	END IF;
	DELETE FROM sb.resources_resource_categories rrc WHERE rrc.resource_id = update_resource.resource_id;
	INSERT INTO sb.resources_resource_categories (resource_id, resource_category_code)
	SELECT update_resource.resource_id, UNNEST(category_codes);
	
	ids_images_to_delete = ARRAY(SELECT image_id FROM sb.resources_images ri
		WHERE ri.resource_id = update_resource.resource_id);
	
	DELETE FROM sb.resources_images ri WHERE ri.resource_id = update_resource.resource_id;
	DELETE FROM sb.images i WHERE i.id IN (SELECT UNNEST(ids_images_to_delete));
	WITH inserted_images AS (
		INSERT INTO sb.images (public_id)
		SELECT UNNEST(images_public_ids)
		RETURNING id AS inserted_image_id
	)
	INSERT INTO sb.resources_images (resource_id, image_id)
	SELECT update_resource.resource_id, inserted_images.inserted_image_id FROM inserted_images;
	
	PERFORM sb.apply_resources_rewards(update_resource.resource_id);
	PERFORM sb.apply_resources_consumption(sb.current_account_id());

	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.update_resource(integer, character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location)
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.create_notification(IN account_id integer,IN data json)
    RETURNS integer
    LANGUAGE 'plpgsql'
    VOLATILE SECURITY DEFINER
    PARALLEL UNSAFE
    COST 100
    
AS $BODY$
DECLARE inserted_id INTEGER;
DECLARE notifs_days_between_summaries INTEGER;
begin
	INSERT INTO sb.notifications (account_id, data)
	VALUES (create_notification.account_id, create_notification.data)
	RETURNING id into inserted_id;
	
	PERFORM pg_notify('graphql:notification_account:' || create_notification.account_id, json_build_object(
		'event', 'notification_created',
		'subject', inserted_id
	)::text);
	
	SELECT days_between_summaries INTO notifs_days_between_summaries
	FROM sb.broadcast_prefs bp
	WHERE bp.account_id = create_notification.account_id AND event_type = 3;
	
	IF notifs_days_between_summaries IS NULL THEN
		--Emit postgres notification for push notifications
		PERFORM pg_notify('notification_created', json_build_object(
			'notification_id', inserted_id,
			'data', create_notification.data
		)::text);
	END IF;
	
	RETURN 1;
END;
$BODY$;

CREATE OR REPLACE FUNCTION sb.create_message(
	resource_id integer,
	other_account_id integer,
	text character varying,
	image_public_id character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE conversation_id INTEGER;
DECLARE created_message_id INTEGER = 0;
DECLARE created_message_text TEXT;
DECLARE created_message_sender TEXT;
DECLARE inserted_image_id INTEGER;
DECLARE destinator_participant_id INTEGER;
DECLARE destinator_id INTEGER;
DECLARE destinator_name TEXT;
DECLARE target_push_token TEXT;

BEGIN
	SELECT c.id FROM sb.conversations c
	INTO conversation_id
	WHERE c.resource_id = create_message.resource_id AND EXISTS(
		SELECT * FROM sb.participants p
		WHERE p.conversation_id = c.id AND p.account_id = sb.current_account_id()
	) AND EXISTS(
		SELECT * FROM sb.participants p
		WHERE p.conversation_id = c.id AND p.account_id = create_message.other_account_id
	);

    SELECT a.name INTO created_message_sender
    FROM sb.accounts a
    WHERE a.id = sb.current_account_id();
	
	IF conversation_id IS NULL THEN
		INSERT INTO sb.conversations (resource_id)
		VALUES (create_message.resource_id)
		RETURNING id INTO conversation_id;
		
		INSERT INTO sb.participants (account_id, conversation_id)
		VALUES (sb.current_account_id(), block.conversation_id);
		INSERT INTO sb.participants (account_id, conversation_id)
		VALUES ((SELECT account_id FROM sb.resources r WHERE r.id = create_message.resource_id), block.conversation_id);
		
	END IF;
	
	IF create_message.image_public_id IS NOT NULL THEN
		INSERT INTO sb.images (public_id)
		VALUES (create_message.image_public_id)
		RETURNING id INTO inserted_image_id;
	END IF;
	
	INSERT INTO sb.messages(participant_id, text, image_id, received)
	SELECT (
			SELECT p.id FROM sb.participants p
			WHERE p.conversation_id = block.conversation_id AND account_id = sb.current_account_id()
	), create_message.text, block.inserted_image_id, null
	RETURNING id, messages.text INTO created_message_id, created_message_text;
	
	SELECT p.id INTO destinator_participant_id FROM sb.participants p
	WHERE p.conversation_id = block.conversation_id AND p.account_id <> sb.current_account_id();
	
	INSERT INTO sb.unread_messages (participant_id, message_id)
	SELECT destinator_participant_id, created_message_id;
	
	UPDATE sb.conversations c SET last_message = created_message_id
	WHERE c.id = block.conversation_id;
	
	SELECT a.id, a.name, apt.token INTO destinator_id, destinator_name, target_push_token
	FROM sb.accounts a
	INNER JOIN sb.participants p ON a.id = p.account_id
	LEFT JOIN sb.accounts_push_tokens apt ON a.id = apt.account_id
	WHERE p.id = destinator_participant_id;

	-- Emit notification for graphql/postgraphile's subscription plugin
	PERFORM pg_notify('graphql:message_account:' || destinator_id, json_build_object(
		'event', 'message_created',
		'subject', created_message_id
	)::text);

	IF target_push_token IS NOT NULL AND (
		SELECT days_between_summaries 
		FROM sb.broadcast_prefs 
		WHERE account_id = destinator_participant_id AND event_type = 1) IS NULL THEN
		-- Emit notification for push notification handling
		PERFORM pg_notify('message_created', json_build_object(
			'message_id', created_message_id,
			'text', created_message_text,
			'sender', created_message_sender,
			'push_token', target_push_token,
			'resource_id', create_message.resource_id,
			'other_account_id', create_message.other_account_id,
			'other_account_name', destinator_name
		)::text);
	END IF;
	
	RETURN created_message_id;
END;
$BODY$;

UPDATE sb.broadcast_prefs SET days_between_summaries = NULL
WHERE days_between_summaries = -1;

CREATE TABLE sb.push_notifications
(
    id serial NOT NULL,
    messages json NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS sb.push_notifications
    OWNER to sb;
	
-- Ensure the first mail summaries won't send a huge history of old resources
UPDATE sb.broadcast_prefs
SET last_summary_sent = NOW()
WHERE event_type = 2;

CREATE TABLE sb.admins_public_keys
(
    id serial NOT NULL,
    public_key character varying NOT NULL,
    allowed boolean NOT NULL DEFAULT true,
    name character varying NOT NULL,
	last_challenge character varying NULL,
	last_challenge_expires timestamp with time zone NULL,
	exchange_token character varying NULL,
	exchange_token_expires timestamp with time zone NULL,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS sb.admins_public_keys
    OWNER to sb;
	
INSERT INTO sb.admins_public_keys (public_key, name) 
VALUES ('0x353924CaCC1206eF5fBDE26eEa1887Fb44142155', 'Bertrand');

CREATE OR REPLACE FUNCTION sb.get_admin_token(
	exchange_token character varying)
    RETURNS sb.jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id INTEGER;
BEGIN
	IF EXISTS (SELECT * FROM sb.admins_public_keys apk WHERE apk.exchange_token = get_admin_token.exchange_token AND exchange_token_expires > NOW()) THEN
		RETURN (
		  0,
		  extract(epoch from now() + interval '1 day'),
		  'admin'
		)::sb.jwt_token;
	END IF;
END;
$BODY$;

GRANT EXECUTE ON FUNCTION sb.get_admin_token(character varying) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_admin_token(character varying) TO anonymous;

COMMENT ON TABLE notifications IS '@omit all';
COMMENT ON TABLE broadcast_prefs IS '@omit all';
COMMENT ON TABLE accounts_token_transactions IS '@omit all';
COMMENT ON TABLE accounts_push_tokens IS '@omit';
COMMENT ON TABLE accounts IS '@omit all';
COMMENT ON column sb.accounts.hash is E'@omit';
COMMENT ON column sb.accounts.salt is E'@omit';
COMMENT ON TABLE client_logs IS '@omit';
COMMENT ON TABLE locations IS '@omit all';
COMMENT ON TABLE email_activations IS '@omit';
COMMENT ON TABLE mails IS '@omit';
COMMENT ON TABLE unread_messages IS '@omit all';
COMMENT ON TABLE resources_images IS '@omit all';
COMMENT ON TABLE system IS '@omit';
COMMENT ON TABLE resources_resource_categories IS '@omit all';
COMMENT ON TABLE messages IS '@omit all';
COMMENT ON TABLE resources IS '@omit all';
COMMENT ON TABLE conversations IS '@omit all';
COMMENT ON TABLE accounts_links IS '@omit all';
COMMENT ON TABLE external_auth_tokens IS '@omit';
COMMENT ON TABLE token_transaction_types IS '@omit all';
COMMENT ON TABLE images IS '@omit all';
COMMENT ON TABLE link_types IS '@omit all';
COMMENT ON TABLE participants IS '@omit all';
COMMENT ON TABLE resource_categories IS '';
COMMENT ON TABLE resources_accounts_token_transactions IS '@omit all';
COMMENT ON TABLE searches IS '@omit';
COMMENT ON TABLE bids IS '@omit all';
COMMENT ON TABLE push_notifications IS '@omit';
COMMENT ON TABLE admins_public_keys IS '@omit';
COMMENT ON VIEW sb.active_accounts IS '@omit all';

CREATE OR REPLACE FUNCTION sb.me()
    RETURNS accounts 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE

AS $BODY$
select *
  from sb.accounts 
  where id = sb.current_account_id();
 
$BODY$;

ALTER FUNCTION sb.me()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.me() TO identified_account;

REVOKE ALL ON FUNCTION sb.me() FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.get_account_public_info(
	id INTEGER)
    RETURNS accounts 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE

AS $BODY$
-- Return any account data that can be publicly known, and replace confidential info by bogus values
select a.id, name, '' as email, '' as hash, '' as salt, '' as recovery_code,
	now() as recovery_code_expiration, now() as created, avatar_image_id, now() as activated,
	language, 0 as log_level, location_id, false as can_be_showcased, false as willing_to_contribute,
	0 as amount_of_tokens, now() as unlimited_until, now() as last_suspension_warning, false as knows_about_campaigns
	
  from sb.accounts a
  where a.id = get_account_public_info.id;
 
$BODY$;

ALTER FUNCTION sb.get_account_public_info(integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_account_public_info(integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.get_account_public_info(integer) TO PUBLIC;

DROP ROLE IF EXISTS admin;
CREATE ROLE admin WITH
  NOLOGIN
  NOSUPERUSER
  INHERIT
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION;
  
GRANT USAGE ON SCHEMA sb TO admin;
GRANT SELECT ON TABLE sb.notifications TO admin;
GRANT SELECT ON TABLE sb.broadcast_prefs TO admin;
GRANT SELECT ON TABLE sb.accounts_token_transactions TO admin;
GRANT SELECT ON TABLE sb.accounts_push_tokens TO admin;
GRANT SELECT ON TABLE sb.accounts TO admin;
GRANT SELECT ON TABLE sb.client_logs TO admin;
GRANT SELECT ON TABLE sb.locations TO admin;
GRANT SELECT ON TABLE sb.email_activations TO admin;
GRANT SELECT ON TABLE sb.mails TO admin;
GRANT SELECT ON TABLE sb.unread_messages TO admin;
GRANT SELECT ON TABLE sb.resources_images TO admin;
GRANT SELECT ON TABLE sb.system TO admin;
GRANT SELECT ON TABLE sb.resources_resource_categories TO admin;
GRANT SELECT ON TABLE sb.messages TO admin;
GRANT SELECT ON TABLE sb.resources TO admin;
GRANT SELECT ON TABLE sb.conversations TO admin;
GRANT SELECT ON TABLE sb.accounts_links TO admin;
GRANT SELECT ON TABLE sb.active_accounts TO admin;
GRANT SELECT ON TABLE sb.external_auth_tokens TO admin;
GRANT SELECT ON TABLE sb.token_transaction_types TO admin;
GRANT SELECT ON TABLE sb.images TO admin;
GRANT SELECT ON TABLE sb.link_types TO admin;
GRANT SELECT ON TABLE sb.participants TO admin;
GRANT SELECT ON TABLE sb.resource_categories TO admin;
GRANT SELECT ON TABLE sb.resources_accounts_token_transactions TO admin;
GRANT SELECT ON TABLE sb.searches TO admin;
GRANT SELECT ON TABLE sb.bids TO admin;
GRANT SELECT ON TABLE sb.push_notifications TO admin;
GRANT SELECT ON TABLE sb.admins_public_keys TO admin;

CREATE OR REPLACE FUNCTION sb.search_accounts(
	search_term character varying)
    RETURNS SETOF accounts 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$

SELECT *
FROM sb.accounts a
WHERE name ILIKE '%' || search_term || '%' OR email ILIKE '%' || search_term || '%'
ORDER BY created DESC;

$BODY$;

ALTER FUNCTION sb.search_accounts(character varying)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.search_accounts(character varying) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.search_accounts(character varying) TO admin;

CREATE OR REPLACE FUNCTION sb.search_mails(
	search_term character varying)
    RETURNS SETOF mails 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$

SELECT *
FROM sb.mails m
WHERE email ILIKE '%' || search_term || '%' OR subject ILIKE '%' || search_term || '%' OR html_content ILIKE '%' || search_term || '%'
ORDER BY created DESC;

$BODY$;

ALTER FUNCTION sb.search_mails(character varying)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.search_mails(character varying) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.search_mails(character varying) TO admin;

INSERT INTO sb.token_transaction_types(
	id, code)
	VALUES (13, 'TOKEN_GRANT');

CREATE OR REPLACE FUNCTION sb.grant_tokens(
	account_ids integer[],
	grantor integer,
	amount_of_tokens integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE account_id INTEGER;
BEGIN
	INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement, target_account_id)
	SELECT UNNEST(account_ids), 13, amount_of_tokens, grantor;
	
	UPDATE sb.accounts a SET amount_of_tokens = a.amount_of_tokens + grant_tokens.amount_of_tokens
	WHERE id = ANY(grant_tokens.account_ids);
	
	FOR account_id IN SELECT UNNEST(account_ids)
	LOOP
		PERFORM sb.create_notification(account_id, json_build_object(
			'info', 'TOKEN_GRANTED',
			'amountOfTokens', grant_tokens.amount_of_tokens,
			'grantorName', (SELECT name FROM sb.accounts WHERE id = grantor)
		));
	END LOOP;
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.grant_tokens(integer[], integer, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.grant_tokens(integer[], integer, integer) TO sb;

REVOKE ALL ON FUNCTION sb.grant_tokens(integer[], integer, integer) FROM PUBLIC;


INSERT INTO sb.token_transaction_types(
	id, code)
	VALUES (14, 'RESOURCE_PRICE_SET');

CREATE OR REPLACE FUNCTION sb.apply_resources_rewards(
	resource_id integer)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE amount_to_add integer = 0;
DECLARE att_id integer;
DECLARE resource_account_id integer;
BEGIN
	SELECT account_id FROM sb.resources WHERE id = apply_resources_rewards.resource_id INTO resource_account_id;
	
	-- Check account is activated, and resource is not expired, not deleted, and least 1 day old
	IF EXISTS (SELECT * FROM sb.accounts WHERE id = resource_account_id AND activated IS NOT NULL 
		AND (unlimited_until IS NULL OR unlimited_until < NOW())) 
		AND NOT EXISTS(SELECT * FROM sb.resources WHERE id = apply_resources_rewards.resource_id AND (
			deleted IS NOT NULL OR (expiration IS NOT NULL AND expiration < NOW()) OR created > (NOW() - INTERVAL '1 day')))
	THEN
		-- If there has not been any reward for creating the resource, grant it
		IF NOT EXISTS ( SELECT * 
						FROM sb.resources_accounts_token_transactions ratt
						INNER JOIN sb.accounts_token_transactions att ON ratt.accounts_token_transaction_id = att.id  AND att.token_transaction_type_id = 5
						WHERE ratt.resource_id = apply_resources_rewards.resource_id ) THEN
			amount_to_add = amount_to_add + 20;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 5, 20)
			RETURNING id INTO att_id;
			
			INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
			VALUES (att_id, apply_resources_rewards.resource_id);
		END IF;
		
		-- If a resource image has been added, give the reward
		IF (SELECT COUNT(*) FROM sb.resources_images ri WHERE ri.resource_id = apply_resources_rewards.resource_id) > 0 
			AND NOT EXISTS (SELECT * 
							FROM sb.resources_accounts_token_transactions ratt
							INNER JOIN sb.accounts_token_transactions att ON ratt.accounts_token_transaction_id = att.id  AND att.token_transaction_type_id = 4
							WHERE ratt.resource_id = apply_resources_rewards.resource_id ) THEN
			amount_to_add = amount_to_add + 5;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 4, 5)
			RETURNING id INTO att_id;
			
			INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
			VALUES (att_id, apply_resources_rewards.resource_id);
		END IF;

		-- If a resource price has been set, give the reward
		IF (SELECT COUNT(*) FROM sb.resources r WHERE r.id = apply_resources_rewards.resource_id AND r.price IS NOT NULL) > 0 
			AND NOT EXISTS (SELECT * 
							FROM sb.resources_accounts_token_transactions ratt
							INNER JOIN sb.accounts_token_transactions att ON ratt.accounts_token_transaction_id = att.id  AND att.token_transaction_type_id = 14
							WHERE ratt.resource_id = apply_resources_rewards.resource_id ) THEN
			amount_to_add = amount_to_add + 15;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 14, 15)
			RETURNING id INTO att_id;
			
			INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
			VALUES (att_id, apply_resources_rewards.resource_id);
		END IF;

		IF amount_to_add > 0 THEN
			UPDATE sb.accounts SET amount_of_tokens = amount_of_tokens + amount_to_add
			WHERE id = resource_account_id;
		END IF;
	END IF;
END;
$BODY$;

CREATE TABLE IF NOT EXISTS sb.campaigns
(
    id SERIAL,
    name character varying COLLATE pg_catalog."default" NOT NULL,
    description character varying COLLATE pg_catalog."default",
    airdrop timestamp with time zone NOT NULL,
    airdrop_amount integer NOT NULL,
    resource_rewards_multiplier integer NOT NULL,
    default_resource_categories integer[],
    beginning timestamp with time zone NOT NULL,
    ending timestamp with time zone NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
	airdrop_done boolean NOT NULL DEFAULT FALSE,
	airdrop_imminent_announced boolean NOT NULL DEFAULT FALSE,
	beginning_announced boolean NOT NULL DEFAULT FALSE,
    CONSTRAINT campaigns_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS sb.campaigns
    OWNER to sb;

GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE sb.campaigns TO admin;

GRANT SELECT ON TABLE sb.campaigns TO identified_account;

GRANT ALL ON TABLE sb.campaigns TO sb;

GRANT USAGE ON SEQUENCE sb.campaigns_id_seq TO admin;

CREATE OR REPLACE FUNCTION sb.create_campaign(
	name character varying,
	description character varying,
	airdrop timestamp with time zone,
	airdrop_amount integer,
	resource_rewards_multiplier integer,
	default_resource_categories integer[],
	beginning timestamp with time zone,
	ending timestamp with time zone)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id INTEGER;
BEGIN
	INSERT INTO sb.campaigns(
		name, description, airdrop, airdrop_amount, resource_rewards_multiplier, default_resource_categories, beginning, ending)
	VALUES (create_campaign.name, create_campaign.description, create_campaign.airdrop, create_campaign.airdrop_amount,
		   create_campaign.resource_rewards_multiplier, create_campaign.default_resource_categories, 
		   create_campaign.beginning, create_campaign.ending)
	RETURNING id INTO inserted_id;
	
	RETURN inserted_id;
end;
$BODY$;

ALTER FUNCTION sb.create_campaign(character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone)
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.get_campaigns()
    RETURNS SETOF campaigns 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT *
	FROM sb.campaigns
	WHERE ending + 30 * INTERVAL '1 day' > NOW()
	ORDER BY created DESC;
$BODY$;

ALTER FUNCTION sb.get_campaigns()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_campaigns() TO admin;

CREATE OR REPLACE FUNCTION sb.get_active_campaign()
    RETURNS campaigns 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE

AS $BODY$
	SELECT *
	FROM sb.campaigns
	WHERE ending > NOW() AND beginning < NOW()
	ORDER BY created
	LIMIT 1;
$BODY$;

ALTER FUNCTION sb.get_active_campaign()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_active_campaign() TO identified_account;

CREATE OR REPLACE FUNCTION sb.set_account_knows_about_campaigns()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
BEGIN
	UPDATE sb.accounts
	SET knows_about_campaigns = true
	WHERE id = sb.current_account_id();

	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);

	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.set_account_knows_about_campaigns()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.set_account_knows_about_campaigns() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.set_account_knows_about_campaigns() TO sb;

REVOKE ALL ON FUNCTION sb.set_account_knows_about_campaigns() FROM PUBLIC;

CREATE TABLE sb.campaigns_resources
(
    id serial NOT NULL,
    campaign_id integer NOT NULL,
    resource_id integer NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT fk_campaigns_resources_resources FOREIGN KEY (resource_id)
        REFERENCES sb.resources (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT fk_campaigns_resources_campaigns FOREIGN KEY (campaign_id)
        REFERENCES sb.campaigns (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

ALTER TABLE IF EXISTS sb.campaigns_resources
    OWNER to sb;
	
GRANT DELETE, INSERT, SELECT ON TABLE sb.campaigns_resources TO identified_account;

GRANT SELECT ON TABLE sb.campaigns TO public;
GRANT SELECT ON TABLE sb.campaigns_resources TO public;

GRANT ALL ON TABLE sb.campaigns_resources TO sb;

GRANT USAGE ON SEQUENCE sb.campaigns_resources_id_seq TO identified_account;

CREATE OR REPLACE FUNCTION sb.get_number_of_active_resources_on_active_campaign()
    RETURNS INTEGER 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE

AS $BODY$
	SELECT COUNT(*)
	FROM sb.resources r
	INNER JOIN sb.campaigns_resources cr ON cr.resource_id = r.id
	INNER JOIN sb.get_active_campaign() c ON c.id = cr.campaign_id
	WHERE r.account_id = sb.current_account_id()
		AND (r.expiration is NULL OR r.expiration > NOW())
		AND r.deleted IS NULL
		AND r.suspended IS NULL
	LIMIT 1;
$BODY$;

GRANT EXECUTE ON FUNCTION sb.get_number_of_active_resources_on_active_campaign() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.get_number_of_active_resources_on_active_campaign() TO sb;

REVOKE ALL ON FUNCTION sb.get_number_of_active_resources_on_active_campaign() FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.delete_resource(
	resource_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE ids_images_to_delete INTEGER[];
DECLARE bid record;
begin
	--Detect attempt to delete a resource owned by another account
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = delete_resource.resource_id AND account_id = sb.current_account_id()) THEN
		RETURN 0;
	END IF;
	
	UPDATE sb.resources r
	SET deleted = NOW()
	WHERE r.id = delete_resource.resource_id;
	
	FOR bid IN
	SELECT * FROM sb.bids b
	WHERE b.resource_id = delete_resource.resource_id
	AND deleted IS NULL AND accepted IS NULL AND refused IS NULL AND valid_until > NOW()
	LOOP
		PERFORM sb.refuse_bid(bid.id, 'BID_AUTO_REFUSED_AFTER_RESOURCE_DELETED');
	END LOOP;
	
	-- In case a free resource was deleted, run apply_resources_consumption,
	-- which could un-suspend a suspended resource
	PERFORM sb.apply_resources_consumption(sb.current_account_id());
	
	RETURN 1;
end;
$BODY$;

DROP FUNCTION IF EXISTS sb.update_resource(integer, character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location);

CREATE OR REPLACE FUNCTION sb.update_resource(
	resource_id integer,
	title character varying,
	description character varying,
	expiration timestamp with time zone,
	price integer,
	is_service boolean,
	is_product boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	can_be_exchanged boolean,
	can_be_gifted boolean,
	images_public_ids character varying[],
	category_codes integer[],
	specific_location new_location,
	campaign_to_join integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE ids_images_to_delete INTEGER[];
DECLARE location_id INTEGER = NULL;
DECLARE location_to_delete_id INTEGER = NULL;
BEGIN
	--Detect attempt to update a resource owned by another account
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = update_resource.resource_id AND account_id = sb.current_account_id()) THEN
		RETURN 0;
	END IF;
	
	--Detect attempt to update a resource already deleted
	IF EXISTS(SELECT * FROM sb.resources WHERE id = update_resource.resource_id AND deleted IS NOT NULL) THEN
		RETURN -1;
	END IF;
	
	SELECT specific_location_id INTO location_id
	FROM sb.resources
	WHERE id = update_resource.resource_id;

	IF specific_location IS NOT NULL THEN
		IF location_id IS NULL THEN
			INSERT INTO sb.locations (address, latitude, longitude)
			VALUES (specific_location.address, specific_location.latitude, specific_location.longitude)
			RETURNING id INTO location_id;
		ELSE
			UPDATE sb.locations SET address = specific_location.address, latitude = specific_location.latitude, longitude = specific_location.longitude
			WHERE id = location_id;
		END IF;
	ELSE
		IF location_id IS NOT NULL THEN
			SELECT location_id INTO location_to_delete_id;
		END IF;
		SELECT null INTO location_id;
	END IF;
	
	IF update_resource.campaign_to_join IS NOT NULL THEN
		IF (SELECT id FROM sb.campaigns_resources cr WHERE cr.resource_id = update_resource.resource_id AND cr.campaign_id = update_resource.campaign_to_join) IS NULL THEN
			INSERT INTO sb.campaigns_resources (campaign_id, resource_id)
			VALUES (update_resource.campaign_to_join, update_resource.resource_id);
		END IF;
	ELSE
		IF (SELECT id FROM sb.campaigns_resources cr WHERE cr.resource_id = update_resource.resource_id AND cr.campaign_id = (SELECT id FROM sb.get_active_campaign())) IS NOT NULL THEN
			DELETE FROM sb.campaigns_resources cr WHERE cr.campaign_id = (SELECT id FROM sb.get_active_campaign()) AND cr.resource_id = update_resource.resource_id;
		END IF;
	END IF;

	UPDATE sb.resources r SET title = update_resource.title, description = update_resource.description, 
		expiration = update_resource.expiration, is_service = update_resource.is_service, 
		is_product = update_resource.is_product, can_be_delivered = update_resource.can_be_delivered, 
		can_be_taken_away = update_resource.can_be_taken_away, can_be_exchanged = update_resource.can_be_exchanged, 
		can_be_gifted = update_resource.can_be_gifted, specific_location_id = location_id,
		price = update_resource.price
	WHERE r.id = update_resource.resource_id;
	
	IF location_to_delete_id IS NOT NULL THEN
		DELETE FROM sb.locations WHERE id = location_to_delete_id;
	END IF;
	DELETE FROM sb.resources_resource_categories rrc WHERE rrc.resource_id = update_resource.resource_id;
	INSERT INTO sb.resources_resource_categories (resource_id, resource_category_code)
	SELECT update_resource.resource_id, UNNEST(category_codes);
	
	ids_images_to_delete = ARRAY(SELECT image_id FROM sb.resources_images ri
		WHERE ri.resource_id = update_resource.resource_id);
	
	DELETE FROM sb.resources_images ri WHERE ri.resource_id = update_resource.resource_id;
	DELETE FROM sb.images i WHERE i.id IN (SELECT UNNEST(ids_images_to_delete));
	WITH inserted_images AS (
		INSERT INTO sb.images (public_id)
		SELECT UNNEST(images_public_ids)
		RETURNING id AS inserted_image_id
	)
	INSERT INTO sb.resources_images (resource_id, image_id)
	SELECT update_resource.resource_id, inserted_images.inserted_image_id FROM inserted_images;
	
	PERFORM sb.apply_resources_rewards(update_resource.resource_id);
	PERFORM sb.apply_resources_consumption(sb.current_account_id());

	RETURN 1;
END;
$BODY$;

GRANT EXECUTE ON FUNCTION sb.update_resource(integer, character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, integer) TO identified_account;

DROP FUNCTION IF EXISTS sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location);

CREATE OR REPLACE FUNCTION sb.create_resource(
	title character varying,
	description character varying,
	expiration timestamp with time zone,
	price integer,
	is_service boolean,
	is_product boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	can_be_exchanged boolean,
	can_be_gifted boolean,
	images_public_ids character varying[],
	category_codes integer[],
	specific_location new_location,
	campaign_to_join integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id INTEGER;
DECLARE location_id INTEGER = NULL;
BEGIN
	-- Prevent creating a resource if the account already has 2 active
	-- and is not either contributor, or unlimited account
	IF NOT EXISTS (SELECT *
		FROM sb.accounts a
		WHERE id = sb.current_account_id()
		AND ((
			(a.unlimited_until IS NOT NULL AND a.unlimited_until > NOW())
		) OR (
			(SELECT COUNT(*) FROM sb.resources r WHERE r.account_id = sb.current_account_id()
			AND (r.expiration is NULL OR r.expiration > NOW())
			AND r.deleted IS NULL
			AND r.suspended IS NULL) < (SELECT amount_free_resources FROM sb.system)
		) OR (
			a.willing_to_contribute
		))) THEN
	
		RAISE EXCEPTION 'ACCOUNT_CANNOT_CREATE_NON_FREE_RESOURCES';
	
	END IF;
	
	IF specific_location IS NOT NULL THEN
		INSERT INTO sb.locations (address, latitude, longitude)
		VALUES (specific_location.address, specific_location.latitude, specific_location.longitude)
		RETURNING id INTO location_id;
	END IF;

	INSERT INTO sb.resources(
		title, description, expiration, account_id, created, is_service, is_product, 
		can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted, 
		specific_location_id, paid_until, price)
	VALUES (create_resource.title, create_resource.description, create_resource.expiration, sb.current_account_id(),
			NOW(), create_resource.is_service, create_resource.is_product, create_resource.can_be_delivered,
			create_resource.can_be_taken_away, create_resource.can_be_exchanged, create_resource.can_be_gifted, 
			location_id, NOW(), create_resource.price)
	RETURNING id INTO inserted_id;
	
	INSERT INTO sb.resources_resource_categories (resource_id, resource_category_code)
	SELECT inserted_id, UNNEST(category_codes);
	
	WITH inserted_images AS (
		INSERT INTO sb.images (public_id)
		SELECT UNNEST(images_public_ids)
		RETURNING id AS inserted_image_id
	)
	INSERT INTO sb.resources_images (resource_id, image_id)
	SELECT inserted_id, inserted_images.inserted_image_id FROM inserted_images;
		
	IF create_resource.campaign_to_join IS NOT NULL THEN
		INSERT INTO sb.campaigns_resources (campaign_id, resource_id)
		VALUES (create_resource.campaign_to_join, inserted_id);
	END IF;
	
	PERFORM sb.apply_resources_consumption(sb.current_account_id());
	
	IF (SELECT activated FROM sb.accounts WHERE id = sb.current_account_id()) IS NOT NULL AND
		(SELECT suspended FROM sb.resources WHERE id = inserted_id) IS NULL THEN
		-- Emit notification for push notification handling
		PERFORM pg_notify('resource_created', json_build_object(
			'resource_id', inserted_id
		)::text);
	END IF;
	
	RETURN inserted_id;
end;
$BODY$;

ALTER FUNCTION sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, integer) TO identified_account;

ALTER TABLE IF EXISTS sb.searches
    ADD COLUMN in_active_campaign boolean;

CREATE EXTENSION pg_trgm;

DROP FUNCTION IF EXISTS sb.suggested_resources(text, boolean, boolean, boolean, boolean, boolean, boolean, integer[], numeric, numeric, numeric, boolean);

CREATE OR REPLACE FUNCTION sb.suggested_resources (
	search_term text,
	is_product boolean,
	is_service boolean,
	can_be_gifted boolean,
	can_be_exchanged boolean,
	can_be_delivered boolean,
	can_be_taken_away boolean,
	category_codes integer[],
	reference_location_latitude numeric,
	reference_location_longitude numeric,
	distance_to_reference_location numeric,
	exclude_unlocated boolean,
	in_active_campaign boolean)
    RETURNS SETOF resources 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
	INSERT INTO sb.searches (term, is_product, is_service, can_be_gifted, 
		can_be_exchanged, can_be_delivered, can_be_taken_away, category_codes, 
		reference_location_latitude, reference_location_longitude, 
		distance_to_reference_location, account_id, exclude_unlocated, in_active_campaign) 
	VALUES
		(suggested_resources.search_term, suggested_resources.is_product, suggested_resources.is_service, 
		 suggested_resources.can_be_gifted, suggested_resources.can_be_exchanged, 
		 suggested_resources.can_be_delivered, suggested_resources.can_be_taken_away, 
		 suggested_resources.category_codes, suggested_resources.reference_location_latitude, 
		 suggested_resources.reference_location_longitude, suggested_resources.distance_to_reference_location,
		 sb.current_account_id(), suggested_resources.exclude_unlocated, suggested_resources.in_active_campaign);

	RETURN QUERY
	SELECT r.*
	  FROM sb.resources r
	  LEFT JOIN sb.active_accounts a ON a.id = r.account_id
	  LEFT JOIN sb.locations l ON l.id = r.specific_location_id
	  LEFT JOIN sb.campaigns_resources cr ON cr.resource_id = r.id AND cr.campaign_id = (SELECT id FROM sb.get_active_campaign())
	  WHERE (r.expiration > LOCALTIMESTAMP OR r.expiration IS NULL)
	  AND r.deleted IS NULL
	  AND r.suspended IS NULL
	  AND (ARRAY_LENGTH(category_codes, 1) IS NULL OR EXISTS(
		  SELECT * 
		  FROM sb.resources_resource_categories rrc 
		  WHERE r.id = rrc.resource_id AND rrc.resource_category_code IN (SELECT UNNEST(category_codes))))
	  AND (r.account_id = sb.current_account_id() OR a.id IS NOT NULL)
	  AND
	  (NOT suggested_resources.is_product OR r.is_product)
	  AND
	  (NOT suggested_resources.is_service OR r.is_service)
	  AND
	  (NOT suggested_resources.can_be_gifted OR r.can_be_gifted)
	  AND
	  (NOT suggested_resources.can_be_exchanged OR r.can_be_exchanged)
	  AND
	  (NOT suggested_resources.can_be_delivered OR r.can_be_delivered)
	  AND
	  (NOT suggested_resources.can_be_taken_away OR r.can_be_taken_away)
	  AND(
		 (suggested_resources.reference_location_latitude = 0 AND suggested_resources.reference_location_longitude = 0)
		 OR 
		 (r.specific_location_id IS NULL AND NOT suggested_resources.exclude_unlocated)
		 OR
		 (select sb.geodistance(suggested_resources.reference_location_latitude, suggested_resources.reference_location_longitude, l.latitude, l.longitude) <= suggested_resources.distance_to_reference_location)
	  )
	  AND
		  (search_term = '' OR 
			(sb.strict_word_similarity(r.title, search_term) > 0.1 OR 
			 sb.strict_word_similarity(r.description, search_term) > 0.1 OR
			 sb.strict_word_similarity(a.name, search_term) > 0.1))
	  AND
	  (NOT suggested_resources.in_active_campaign OR suggested_resources.in_active_campaign IS NULL OR cr.id IS NOT NULL)
	  ORDER BY created DESC, r.expiration DESC
	  LIMIT 50;
END;
$BODY$;

ALTER FUNCTION sb.suggested_resources(text, boolean, boolean, boolean, boolean, boolean, boolean, integer[], numeric, numeric, numeric, boolean, boolean)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.suggested_resources(text, boolean, boolean, boolean, boolean, boolean, boolean, integer[], numeric, numeric, numeric, boolean, boolean) TO PUBLIC;

CREATE OR REPLACE FUNCTION sb.delete_old_searches()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
begin
	DELETE FROM sb.searches
	WHERE created + interval '1 day' * 30 < NOW();
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.delete_old_searches()
    OWNER TO sb;

INSERT INTO sb.token_transaction_types(id, code)
VALUES (16, 'AIRDROP_RECEIVED');

CREATE OR REPLACE FUNCTION sb.apply_campaign_announcements()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE campaign_id INTEGER;
DECLARE campaign_name character varying;
DECLARE airdrop timestamp with time zone;
DECLARE multiplier INTEGER;
DECLARE airdrop_amount INTEGER;
DECLARE n RECORD;
BEGIN
	SELECT id, ac.airdrop, ac.airdrop_amount, name, resource_rewards_multiplier
	INTO campaign_id, block.airdrop, block.airdrop_amount, block.campaign_name, block.multiplier
	FROM sb.get_active_campaign() ac
	WHERE (beginning < NOW() AND NOT beginning_announced);
	
	IF (block.campaign_id IS NOT NULL) THEN
		-- Announce beginning
		FOR n IN
			INSERT INTO sb.notifications (account_id, data)
			SELECT
				id as account_id, 
				json_build_object('info', 'CAMPAIGN_BEGUN',
								 'campaignName', block.campaign_name, 
								 'airdrop', block.airdrop, 
								 'airdropAmount', block.airdrop_amount,
								 'multiplier', block.multiplier)
			FROM sb.active_accounts
			RETURNING id, account_id
		LOOP
			-- Emit notification for graphql/postgraphile's subscription plugin
			PERFORM pg_notify('graphql:notification_account:' || n.account_id, json_build_object(
				'event', 'notification_created',
				'subject', n.id
			)::text);
		END LOOP;
		
		UPDATE sb.campaigns SET beginning_announced = TRUE WHERE id = (SELECT id FROM sb.get_active_campaign());	
	END IF;
	
	SELECT id, ac.airdrop, ac.airdrop_amount, name, resource_rewards_multiplier
	INTO campaign_id, block.airdrop, block.airdrop_amount, block.campaign_name, block.multiplier
	FROM sb.get_active_campaign() ac
	WHERE (ac.airdrop - interval '1 day' < NOW() AND NOT airdrop_imminent_announced);
	
	IF (block.campaign_id IS NOT NULL) THEN
		-- Announce airdrop soon
		FOR n IN
			INSERT INTO sb.notifications (account_id, data)
			SELECT
				id as account_id, 
				json_build_object('info', 'AIRDROP_SOON',
								 'campaignName', block.campaign_name, 
								 'airdrop', block.airdrop, 
								 'airdropAmount', block.airdrop_amount,
								 'multiplier', block.multiplier)
			FROM sb.active_accounts
			RETURNING id, account_id
		LOOP
			-- Emit notification for graphql/postgraphile's subscription plugin
			PERFORM pg_notify('graphql:notification_account:' || n.account_id, json_build_object(
				'event', 'notification_created',
				'subject', n.id
			)::text);
		END LOOP;
	
		UPDATE sb.campaigns SET airdrop_imminent_announced = TRUE WHERE id = (SELECT id FROM sb.get_active_campaign());
	END IF;
	
	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.apply_campaign_announcements()
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.apply_airdrop()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE campaign_id INTEGER;
DECLARE campaign_name character varying;
DECLARE airdrop timestamp with time zone;
DECLARE airdrop_amount INTEGER;
DECLARE account_to_airdrop record;
begin
	SELECT id, ac.airdrop, ac.airdrop_amount, name
	INTO campaign_id, block.airdrop, block.airdrop_amount, block.campaign_name 
	FROM sb.get_active_campaign() ac
	WHERE ac.airdrop < NOW() AND NOT airdrop_done;
	
	IF (block.campaign_id IS NOT NULL) THEN
		--Apply airdrop to accounts having at least 2 resources on the campaign
		FOR account_to_airdrop IN
		SELECT a.id
		FROM sb.accounts a
		INNER JOIN sb.resources r ON a.id = r.account_id AND r.deleted IS NULL AND r.suspended IS NULL AND (expiration IS NULL OR expiration > NOW())
		INNER JOIN sb.campaigns_resources cr ON cr.resource_id = r.id AND cr.campaign_id = block.campaign_id
		GROUP BY a.id
		HAVING COUNT(*) > 1
		LOOP		
			UPDATE sb.accounts
			SET amount_of_tokens = amount_of_tokens + block.airdrop_amount
			WHERE id = account_to_airdrop.id;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (account_to_airdrop.id, 16, block.airdrop_amount);
			
			PERFORM sb.create_notification(account_to_airdrop.id, json_build_object(
				'info', 'AIRDROP_RECEIVED',
				'amount', block.airdrop_amount,
				'campaignName', block.campaign_name
			));

			PERFORM pg_notify('graphql:account_changed:' || account_to_airdrop.id, json_build_object(
				'event', 'account_changed',
				'subject', account_to_airdrop.id
			)::text);
		
		END LOOP;
		
		UPDATE sb.campaigns
		SET airdrop_done = TRUE
		WHERE id = block.campaign_id;

	END IF;
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.apply_airdrop()
    OWNER TO sb;
	
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
	FROM sb.accounts a
	WHERE a.email = LOWER(request_account_recovery.email);
	
	UPDATE sb.accounts SET recovery_code = code, recovery_code_expiration = NOW() + interval '15 minutes'
	WHERE accounts.email = LOWER(request_account_recovery.email);
	
	IF FOUND THEN
		PERFORM sb.add_job('mailPasswordRecovery', 
			json_build_object('email', LOWER(request_account_recovery.email), 'code', code, 'lang', block.language));
	END IF;
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.request_account_recovery(character varying)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.request_account_recovery(character varying) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.request_account_recovery(character varying) TO anonymous;

GRANT EXECUTE ON FUNCTION sb.request_account_recovery(character varying) TO sb;

CREATE OR REPLACE FUNCTION sb.get_accounts_to_notify_of_new_resource(
	resource_id integer)
    RETURNS integer[]
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE results INTEGER[];
BEGIN
	results := ARRAY(
		SELECT id, score
		FROM (
			-- Accounts close to the resource created
			-- if new resource has a location
			SELECT a.id,
				CASE 
					WHEN sb.geodistance(loc.latitude, loc.longitude, l.latitude, l.longitude) < 5 THEN 10 
					WHEN sb.geodistance(loc.latitude, loc.longitude, l.latitude, l.longitude) < 10 THEN 5 
				END as score
			FROM sb.accounts a
			INNER JOIN sb.locations l ON a.location_id = l.id
			CROSS JOIN (
				SELECT latitude, longitude
				FROM sb.resources r
				INNER JOIN sb.locations l ON l.id = r.specific_location_id
				WHERE r.id = 40
			) loc
			WHERE name IS NOT NULL and name <> '' AND location_id IS NOT NULL

			UNION
			-- Accounts taking part in active campaign
			-- if a campaign is active
			SELECT id, 10 as score
			FROM sb.accounts a
			WHERE name IS NOT NULL and name <> '' AND EXISTS (
				SELECT *
				FROM sb.resources r
				INNER JOIN sb.campaigns_resources cr ON cr.resource_id = r.id AND cr.campaign_id = (SELECT id FROM sb.get_active_campaign())
				WHERE account_id = a.id AND deleted IS NULL AND (expiration IS NULL OR expiration > NOW())
			)
			UNION
			-- Accounts having recent searches that match the new resource's title and/or description
			SELECT s.account_id, 10 as score from sb.searches s
			INNER JOIN sb.resources r ON r.id = get_accounts_to_notify_of_new_resource.resource_id
			WHERE s.account_id IS NOT NULL AND s.term IS NOT NULL AND s.term <> '' AND (
				sb.strict_word_similarity(s.term, r.title) > 0.1 OR
				sb.strict_word_similarity(s.term, r.description) > 0.1
			)
			ORDER BY similarity(term, 'Pots') DESC
			LIMIT 5
		) matches
		WHERE id != (SELECT account_id FROM sb.resources WHERE id = get_accounts_to_notify_of_new_resource.resource_id)
		ORDER BY score DESC
		LIMIT 5);

	RETURN results;
end;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.10.0', minimum_client_version = '0.10.0';
END;
$body$
LANGUAGE 'plpgsql'; 