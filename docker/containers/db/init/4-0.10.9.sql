CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE sb.grants
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title character varying NOT NULL,
    description character varying NOT NULL,
	amount integer NOT NULL,
    expiration timestamp with time zone NOT NULL,
	data json NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS sb.grants
    OWNER to sb;

GRANT INSERT, SELECT, UPDATE ON TABLE sb.grants TO admin;

GRANT SELECT ON TABLE sb.grants TO PUBLIC;

COMMENT ON TABLE grants IS '@omit';

COMMENT ON TABLE campaigns IS '@omit';
GRANT EXECUTE ON FUNCTION sb.create_campaign(character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone) TO admin;
REVOKE ALL ON FUNCTION sb.get_campaigns() FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.create_grant(
	title character varying,
	description character varying,
	amount integer,
	data json,
	expiration timestamp with time zone)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	INSERT INTO sb.grants(
		title, description, amount, data, expiration)
	VALUES (create_grant.title, create_grant.description, create_grant.amount,
		   create_grant.data, create_grant.expiration);
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.create_grant(character varying, character varying, integer, json, timestamp with time zone)
    OWNER TO sb;

CREATE OR REPLACE FUNCTION sb.get_grants(
	)
    RETURNS SETOF grants 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT *
	FROM sb.grants
	WHERE expiration > NOW()
	ORDER BY created DESC;
$BODY$;

ALTER FUNCTION sb.get_grants()
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.get_grants() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_grants() TO admin;

GRANT EXECUTE ON FUNCTION sb.get_grants() TO sb;

CREATE OR REPLACE FUNCTION sb.get_campaigns(
	)
    RETURNS SETOF campaigns 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT *
	FROM sb.campaigns
	ORDER BY created DESC;
$BODY$;

REVOKE ALL ON FUNCTION sb.get_campaigns() FROM PUBLIC;

ALTER TABLE IF EXISTS sb.resources DROP COLUMN IF EXISTS suspended;

ALTER TABLE IF EXISTS sb.resources DROP COLUMN IF EXISTS paid_until;

CREATE OR REPLACE FUNCTION sb.apply_resources_token_transactions()
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE acc RECORD;
BEGIN
	FOR acc IN
		SELECT id FROM sb.accounts
		WHERE email IS NOT NULL AND email <> '' AND
			activated IS NOT NULL
	LOOP
		PERFORM sb.apply_account_resources_rewards(acc.id);
	END LOOP;
END;
$BODY$;

ALTER FUNCTION sb.apply_resources_token_transactions()
    OWNER TO sb;

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

	RETURN 1;
end;
$BODY$;

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
	
	IF specific_location IS NOT NULL THEN
		INSERT INTO sb.locations (address, latitude, longitude)
		VALUES (specific_location.address, specific_location.latitude, specific_location.longitude)
		RETURNING id INTO location_id;
	END IF;

	INSERT INTO sb.resources(
		title, description, expiration, account_id, created, is_service, is_product, 
		can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted, 
		specific_location_id, price)
	VALUES (create_resource.title, create_resource.description, create_resource.expiration, sb.current_account_id(),
			NOW(), create_resource.is_service, create_resource.is_product, create_resource.can_be_delivered,
			create_resource.can_be_taken_away, create_resource.can_be_exchanged, create_resource.can_be_gifted, 
			location_id, create_resource.price)
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
	
	IF (SELECT activated FROM sb.accounts WHERE id = sb.current_account_id()) IS NOT NULL THEN
		-- Emit notification for push notification handling
		PERFORM pg_notify('resource_created', json_build_object(
			'resource_id', inserted_id
		)::text);
	END IF;
	
	RETURN inserted_id;
end;
$BODY$;

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
DECLARE campaign_multiplier integer;
BEGIN
	SELECT account_id FROM sb.resources WHERE id = apply_resources_rewards.resource_id INTO resource_account_id;
	
	-- Check account is activated, and resource is not expired, not deleted, and least 1 day old
	IF EXISTS (SELECT * FROM sb.accounts WHERE id = resource_account_id AND activated IS NOT NULL) 
		AND NOT EXISTS(SELECT * FROM sb.resources WHERE id = apply_resources_rewards.resource_id AND (
			deleted IS NOT NULL OR (expiration IS NOT NULL AND expiration < NOW()) OR created > (NOW() - INTERVAL '1 day')))
	THEN
		-- If there has not been any reward for creating the resource, grant it
		IF NOT EXISTS ( SELECT * 
						FROM sb.resources_accounts_token_transactions ratt
						INNER JOIN sb.accounts_token_transactions att ON ratt.accounts_token_transaction_id = att.id  AND att.token_transaction_type_id = 5
						WHERE ratt.resource_id = apply_resources_rewards.resource_id ) THEN
			
			SELECT COALESCE(resource_rewards_multiplier, 1) INTO campaign_multiplier
			FROM sb.get_active_campaign() c
			INNER JOIN sb.campaigns_resources cr ON cr.campaign_id = c.id AND cr.resource_id = apply_resources_rewards.resource_id;
			
			IF campaign_multiplier IS NULL THEN
				SELECT 1 into campaign_multiplier;
			END IF;
			
			amount_to_add = amount_to_add + 20 * campaign_multiplier;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 5, 20 * campaign_multiplier)
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
			amount_to_add = amount_to_add + 5 * campaign_multiplier;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 4, 5 * campaign_multiplier)
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
			amount_to_add = amount_to_add + 15 * campaign_multiplier;
			
			INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
			VALUES (resource_account_id, 14, 15 * campaign_multiplier)
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

	RETURN 1;
END;
$BODY$;

DROP FUNCTION IF EXISTS sb.apply_resources_consumption(integer);

CREATE OR REPLACE FUNCTION sb.top_resources(
	)
    RETURNS SETOF resources 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

SELECT r.*
FROM sb.resources r
INNER JOIN sb.active_accounts a ON a.id = r.account_id
WHERE r.deleted IS NULL AND (r.expiration IS NULL OR r.expiration > NOW()) AND
(SELECT COUNT(*) FROM sb.resources_images WHERE resource_id = r.id) > 0
ORDER BY r.created DESC LIMIT 10;

$BODY$;

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
			(sb.strict_word_similarity(r.title, search_term) > 0.25 OR 
			 sb.strict_word_similarity(r.description, search_term) > 0.25 OR
			 sb.strict_word_similarity(a.name, search_term) > 0.8))
	  AND
	  (NOT suggested_resources.in_active_campaign OR suggested_resources.in_active_campaign IS NULL OR cr.id IS NOT NULL)
	  ORDER BY created DESC, r.expiration DESC
	  LIMIT 50;
END;
$BODY$;

ALTER TYPE sb.session_data
    DROP ATTRIBUTE willing_to_contribute;
ALTER TYPE sb.session_data
    DROP ATTRIBUTE unlimited_until;

DROP VIEW sb.active_accounts;

CREATE OR REPLACE VIEW sb.active_accounts
    AS
     SELECT accounts.id,
    accounts.name,
    accounts.email,
    accounts.hash,
    accounts.salt,
    accounts.recovery_code,
    accounts.recovery_code_expiration,
    accounts.created,
    accounts.avatar_image_id,
    accounts.activated,
    accounts.language,
    accounts.log_level,
    accounts.location_id,
    accounts.can_be_showcased,
    accounts.amount_of_tokens,
    accounts.knows_about_campaigns
   FROM accounts
  WHERE accounts.activated IS NOT NULL AND accounts.name::text <> ''::text AND accounts.name IS NOT NULL;

ALTER TABLE sb.active_accounts
    OWNER TO sb;
COMMENT ON VIEW sb.active_accounts
    IS '@omit all';
GRANT SELECT ON TABLE sb.active_accounts TO admin;
GRANT SELECT ON TABLE sb.active_accounts TO anonymous;
GRANT SELECT ON TABLE sb.active_accounts TO identified_account;
GRANT ALL ON TABLE sb.active_accounts TO sb;


ALTER TABLE IF EXISTS sb.system DROP COLUMN IF EXISTS amount_free_resources;

ALTER TABLE IF EXISTS sb.system DROP COLUMN IF EXISTS amount_hours_to_warn_before_suspension;

ALTER TABLE IF EXISTS sb.accounts DROP COLUMN IF EXISTS willing_to_contribute;

ALTER TABLE IF EXISTS sb.accounts DROP COLUMN IF EXISTS unlimited_until;

ALTER TABLE IF EXISTS sb.accounts DROP COLUMN IF EXISTS last_suspension_warning;

CREATE OR REPLACE FUNCTION sb.activate_account(
	activation_code character varying)
    RETURNS character varying
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE new_email text;
DECLARE id_account_to_activate integer;
DECLARE current_activated timestamp;
DECLARE account_lang character varying;
DECLARE res record;
begin
	SELECT ea.email, ea.account_id
	INTO new_email, id_account_to_activate
	FROM sb.email_activations ea
	WHERE ea.activation_code = activate_account.activation_code;
	
	SELECT a.activated, a.language
	INTO current_activated, account_lang
	FROM sb.accounts a
	WHERE a.id = id_account_to_activate;
	
	IF current_activated IS NULL THEN
		UPDATE sb.accounts SET email = new_email, activated = NOW()
		WHERE id = id_account_to_activate;
		
		PERFORM sb.apply_my_resources_rewards();
		
		-- Loop through active resources to send notifications
		FOR res IN
			SELECT id 
			FROM sb.resources
			WHERE deleted IS NULL AND (expiration IS NULL OR expiration > NOW()) AND 
				account_id = id_account_to_activate
		LOOP
			-- Emit notification for push notification handling
			PERFORM pg_notify('resource_created', json_build_object(
				'resource_id', res.id
			)::text);
		END LOOP;
	ELSE
		UPDATE sb.accounts SET email = new_email
		WHERE id = id_account_to_activate;
	END IF;
	
	UPDATE sb.email_activations ea
	SET activated = NOW()
	WHERE ea.activation_code = activate_account.activation_code;
	
	PERFORM pg_notify('graphql:account_changed:' || id_account_to_activate, json_build_object(
		'event', 'account_changed',
		'subject', id_account_to_activate
	)::text);
	
	RETURN account_lang;
end;
$BODY$;

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
		INNER JOIN sb.resources r ON a.id = r.account_id AND r.deleted IS NULL AND (expiration IS NULL OR expiration > NOW())
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

DROP FUNCTION IF EXISTS sb.switch_to_contribution_mode();

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
	a.amount_of_tokens,
	(SELECT COUNT(*) 
	 FROM sb.external_auth_tokens eat 
	 WHERE eat.email = a.email) as number_of_external_auth_providers,
	a.knows_about_campaigns

	FROM sb.accounts a
	LEFT JOIN sb.images i ON a.avatar_image_id = i.id
	WHERE a.id = sb.current_account_id()
$BODY$;

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
	a.amount_of_tokens,
	(SELECT COUNT(*) 
	 FROM sb.external_auth_tokens eat 
	 WHERE eat.email = a.email) as number_of_external_auth_providers,
	a.knows_about_campaigns

	FROM sb.accounts a
	LEFT JOIN sb.images i ON a.avatar_image_id = i.id
	WHERE a.id = sb.current_account_id()
$BODY$;

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
	language, 0 as log_level, location_id, false as can_be_showcased,
	0 as amount_of_tokens, false as knows_about_campaigns
	
  from sb.accounts a
  where a.id = get_account_public_info.id;
 
$BODY$;

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
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = create_bid.resource_id AND (expiration IS NULL OR expiration > NOW()) AND can_be_exchanged AND deleted IS NULL) THEN
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
	LIMIT 1;
$BODY$;

DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.10.9', minimum_client_version = '0.10.8';
END;
$body$
LANGUAGE 'plpgsql'; 