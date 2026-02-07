-- Add uuid fields
ALTER TABLE IF EXISTS sb.accounts_links
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
	
ALTER TABLE IF EXISTS sb.accounts_links
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.accounts_push_tokens
    ADD COLUMN account_uid uuid;

ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD COLUMN target_account_uid uuid;


ALTER TABLE IF EXISTS sb.bids
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

--data
ALTER TABLE IF EXISTS sb.bids
    ADD COLUMN account_uid uuid;
	
--data
ALTER TABLE IF EXISTS sb.bids
    ADD COLUMN resource_uid uuid;
	
ALTER TABLE IF EXISTS sb.broadcast_prefs
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
	
--data
ALTER TABLE IF EXISTS sb.broadcast_prefs
	ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.campaigns
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE IF EXISTS sb.campaigns_resources
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE IF EXISTS sb.campaigns_resources
	ADD COLUMN resource_uid uuid;
ALTER TABLE IF EXISTS sb.campaigns_resources
	ADD COLUMN campaign_uid uuid;
	
ALTER TABLE IF EXISTS sb.client_logs
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.conversations
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE IF EXISTS sb.conversations
	ADD COLUMN resource_uid uuid;
ALTER TABLE IF EXISTS sb.conversations
	ADD COLUMN last_message_uid uuid;
ALTER TABLE IF EXISTS sb.conversations DROP CONSTRAINT IF EXISTS conversations_messages_fk;
ALTER TABLE IF EXISTS sb.conversations DROP CONSTRAINT IF EXISTS conversations_resources_fk;

--data
ALTER TABLE IF EXISTS sb.email_activations
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.images
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

--data
ALTER TABLE IF EXISTS sb.grants_accounts
    ADD COLUMN account_uid uuid;

ALTER TABLE IF EXISTS sb.locations
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE IF EXISTS sb.mails
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

--data
ALTER TABLE IF EXISTS sb.mails
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.messages
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE IF EXISTS sb.messages
    ADD COLUMN participant_uid uuid;
ALTER TABLE IF EXISTS sb.messages
    ADD COLUMN image_uid uuid;
ALTER TABLE IF EXISTS sb.messages DROP CONSTRAINT IF EXISTS messages_images_fk;
ALTER TABLE IF EXISTS sb.messages DROP CONSTRAINT IF EXISTS messages_participants_fk;

ALTER TABLE IF EXISTS sb.notifications
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

--data
ALTER TABLE IF EXISTS sb.notifications
    ADD COLUMN account_uid uuid;
	
ALTER TABLE IF EXISTS sb.participants
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

--data
ALTER TABLE IF EXISTS sb.participants
    ADD COLUMN account_uid uuid;
	
--data
ALTER TABLE IF EXISTS sb.participants
    ADD COLUMN conversation_uid uuid;

ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

--data
ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN account_uid uuid;
	
--data
ALTER TABLE IF EXISTS sb.resources
    ADD COLUMN specific_location_uid uuid;

ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();

--data
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    ADD COLUMN accounts_token_transaction_uid uuid;
--data
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    ADD COLUMN resource_uid uuid;

--date
ALTER TABLE IF EXISTS sb.resources_images
    ADD COLUMN resource_uid uuid;

--date
ALTER TABLE IF EXISTS sb.resources_images
    ADD COLUMN image_uid uuid;

--data
ALTER TABLE IF EXISTS sb.resources_resource_categories
    ADD COLUMN resource_uid uuid;
	

ALTER TABLE IF EXISTS sb.searches
    ADD COLUMN uid uuid NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE IF EXISTS sb.searches
    ADD COLUMN account_uid uuid;

ALTER TABLE IF EXISTS sb.unread_messages
    ADD COLUMN participant_uid uuid;
ALTER TABLE IF EXISTS sb.unread_messages
    ADD COLUMN message_uid uuid;
ALTER TABLE IF EXISTS sb.unread_messages DROP CONSTRAINT IF EXISTS unread_messages_messages_fk;
ALTER TABLE IF EXISTS sb.unread_messages DROP CONSTRAINT IF EXISTS unread_messages_participants_fk;

--Add new accounts tables
CREATE TABLE sb.accounts_private_data
(
    account_id uuid NOT NULL,
    email character varying,
    hash character varying,
    salt character varying,
    recovery_code character varying,
    recovery_code_expiration timestamp with time zone,
    created timestamp with time zone NOT NULL DEFAULT NOW(),
    activated timestamp with time zone,
    log_level integer,
    can_be_showcased boolean NOT NULL DEFAULT false,
    amount_of_tokens integer NOT NULL DEFAULT 0,
    knows_about_campaigns boolean NOT NULL DEFAULT false,
    language character varying NOT NULL,
    PRIMARY KEY (account_id)
);

ALTER TABLE IF EXISTS sb.accounts_private_data
    OWNER to sb;

GRANT SELECT, UPDATE, DELETE ON TABLE sb.accounts_private_data TO identified_account;

CREATE TABLE sb.accounts_public_data
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
	old_id INTEGER NOT NULL,
    name character varying NOT NULL,
    bio character varying,
    avatar_image_id uuid,
    location_id uuid,
    PRIMARY KEY (id)
);
ALTER TABLE IF EXISTS sb.accounts_public_data
    OWNER to sb;
GRANT SELECT ON TABLE sb.accounts_public_data TO anonymous;
GRANT SELECT, UPDATE ON TABLE sb.accounts_public_data TO identified_account;

ALTER TABLE IF EXISTS sb.accounts_private_data
    ADD CONSTRAINT accounts_private_data_accounts_public_data FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

COMMENT ON TABLE accounts_private_data IS '@omit';
COMMENT ON column sb.accounts_private_data.hash is E'@omit';
COMMENT ON column sb.accounts_private_data.salt is E'@omit';
COMMENT ON TABLE campaigns_resources IS '@omit all';

--Migrate data to use uuid's
INSERT INTO sb.accounts_public_data (old_id, name, bio, avatar_image_id, location_id)
SELECT a.id, a.name, '', 
	(SELECT uid FROM sb.images WHERE id = a.avatar_image_id), 
	(SELECT uid FROM sb.locations WHERE id = a.location_id)
FROM sb.accounts a;

INSERT INTO sb.accounts_private_data (account_id, email, hash, salt, recovery_code,
    recovery_code_expiration, created, activated, log_level, can_be_showcased,
    amount_of_tokens, knows_about_campaigns, language)
SELECT apd.id, a.email, a.hash, a.salt, a.recovery_code,
    a.recovery_code_expiration, a.created, a.activated, a.log_level, a.can_be_showcased,
    a.amount_of_tokens, a.knows_about_campaigns, a.language
FROM sb.accounts a
INNER JOIN sb.accounts_public_data apd ON apd.old_id = a.id ;

UPDATE sb.resources SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id),
specific_location_uid = (SELECT uid FROM sb.locations WHERE id = specific_location_id);

UPDATE sb.resources_images ri
SET image_uid=(SELECT i.uid FROM sb.images i WHERE i.id = ri.image_id), 
resource_uid= (SELECT r.uid FROM sb.resources r WHERE r.id = ri.resource_id);

UPDATE sb.accounts_links SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.accounts_push_tokens SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.accounts_token_transactions 
SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id),
target_account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = target_account_id);

UPDATE sb.bids SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id),
	resource_uid = (SELECT uid FROM sb.resources WHERE id = resource_id);

UPDATE sb.broadcast_prefs SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.campaigns_resources SET resource_uid = (SELECT uid FROM sb.resources WHERE id = resource_id),
campaign_uid = (SELECT uid FROM sb.campaigns WHERE id = campaign_id);

UPDATE sb.client_logs SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.conversations SET resource_uid = (SELECT uid FROM sb.resources WHERE id = resource_id),
last_message_uid = (SELECT uid FROM sb.messages WHERE id = last_message);

UPDATE sb.grants_accounts SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.email_activations SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.mails SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.messages SET participant_uid = (SELECT uid FROM sb.participants WHERE id = participant_id),
image_uid = (SELECT uid FROM sb.images WHERE id = image_id);

UPDATE sb.notifications SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.notifications
SET data = jsonb_set(data::jsonb, '{resource_id}'::text[], to_jsonb((SELECT uid FROM sb.resources WHERE id = (data ->> 'resource_id')::INTEGER)), false)
WHERE (data ->> 'resource_id') is not null;

UPDATE sb.notifications
SET data = jsonb_set(data::jsonb, '{resourceId}'::text[], to_jsonb((SELECT uid FROM sb.resources WHERE id = (data ->> 'resourceId')::INTEGER)), false)
WHERE (data ->> 'info') = 'BID_ACCEPTED' or
(data ->> 'info') = 'BID_EXPIRED';

UPDATE sb.participants SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id),
conversation_uid = (SELECT uid FROM sb.conversations WHERE id = conversation_id);

UPDATE sb.resources_accounts_token_transactions SET accounts_token_transaction_uid = (SELECT uid FROM sb.accounts_token_transactions WHERE id = accounts_token_transaction_id),
resource_uid = (SELECT uid FROM sb.resources WHERE id = resource_id);

UPDATE sb.resources_resource_categories SET resource_uid = (SELECT uid FROM sb.resources WHERE id = resource_id);

UPDATE sb.searches SET account_uid = (SELECT id FROM sb.accounts_public_data WHERE old_id = account_id);

UPDATE sb.unread_messages SET participant_uid = (SELECT uid FROM sb.participants WHERE id = participant_id),
message_uid = (SELECT uid FROM sb.messages WHERE id = message_id);


-- Remove integer id columns & fk contraints
ALTER TABLE IF EXISTS sb.accounts DROP CONSTRAINT IF EXISTS accounts_images_fk;
ALTER TABLE IF EXISTS sb.accounts DROP CONSTRAINT IF EXISTS accounts_locations_fk;


ALTER TABLE IF EXISTS sb.accounts_links DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.accounts_links DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.accounts_links
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.accounts_links
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.accounts_links
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.accounts_links
    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.accounts_links
    ADD CONSTRAINT accounts_links_account FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
	

ALTER TABLE IF EXISTS sb.accounts_push_tokens DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.accounts_push_tokens
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.accounts_push_tokens
    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.accounts_push_tokens
    ADD PRIMARY KEY (account_id, token);
ALTER TABLE IF EXISTS sb.accounts_push_tokens
    ADD CONSTRAINT accounts_push_tokens_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
	
	
ALTER TABLE IF EXISTS sb.resources
    ADD CONSTRAINT unique_uid UNIQUE (uid);
	

ALTER TABLE IF EXISTS sb.bids DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.bids DROP COLUMN IF EXISTS resource_id;
ALTER TABLE IF EXISTS sb.bids DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.bids
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.bids
    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.bids
    RENAME resource_uid TO resource_id;
ALTER TABLE IF EXISTS sb.bids
    ALTER COLUMN resource_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.bids
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.bids
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.bids
    ADD CONSTRAINT bids_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.bids
    ADD CONSTRAINT bids_resources FOREIGN KEY (resource_id)
    REFERENCES sb.resources (uid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.participants
    ADD CONSTRAINT participants_unique_uid UNIQUE (uid);
ALTER TABLE IF EXISTS sb.images
    ADD CONSTRAINT images_unique_uid UNIQUE (uid);

ALTER TABLE IF EXISTS sb.messages DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.messages DROP COLUMN IF EXISTS participant_id;
ALTER TABLE IF EXISTS sb.messages DROP COLUMN IF EXISTS image_id;
ALTER TABLE IF EXISTS sb.messages
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.messages
    RENAME participant_uid TO participant_id;
ALTER TABLE IF EXISTS sb.messages
    ALTER COLUMN participant_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.messages
    RENAME image_uid TO image_id;
ALTER TABLE IF EXISTS sb.messages
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.messages
    ADD CONSTRAINT messages_participants FOREIGN KEY (participant_id)
    REFERENCES sb.participants (uid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.messages
    ADD CONSTRAINT messages_images FOREIGN KEY (image_id)
    REFERENCES sb.images (uid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.unread_messages DROP COLUMN IF EXISTS participant_id;
ALTER TABLE IF EXISTS sb.unread_messages DROP COLUMN IF EXISTS message_id;
ALTER TABLE IF EXISTS sb.unread_messages
    RENAME participant_uid TO participant_id;
ALTER TABLE IF EXISTS sb.unread_messages
    ALTER COLUMN participant_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.unread_messages
    RENAME message_uid TO message_id;
ALTER TABLE IF EXISTS sb.unread_messages
    ALTER COLUMN message_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.unread_messages
    ADD CONSTRAINT unread_messages_participants FOREIGN KEY (participant_id)
    REFERENCES sb.participants (uid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.unread_messages
    ADD CONSTRAINT unread_messages_messages FOREIGN KEY (message_id)
    REFERENCES sb.messages (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

ALTER TABLE IF EXISTS sb.conversations
    ADD CONSTRAINT conversations_unique_uid UNIQUE (uid);


ALTER TABLE IF EXISTS sb.participants DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.participants DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.participants DROP COLUMN IF EXISTS conversation_id;
ALTER TABLE IF EXISTS sb.participants
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.participants
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.participants
    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.participants
    RENAME conversation_uid TO conversation_id;
ALTER TABLE IF EXISTS sb.participants
    ALTER COLUMN conversation_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.participants
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.participants
    ADD CONSTRAINT participants_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.conversations DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.conversations DROP COLUMN IF EXISTS resource_id;
ALTER TABLE IF EXISTS sb.conversations DROP COLUMN IF EXISTS last_message;
ALTER TABLE IF EXISTS sb.conversations
    ALTER COLUMN resource_uid SET NOT NULL;
ALTER TABLE IF EXISTS sb.conversations
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.conversations
    RENAME resource_uid TO resource_id;
ALTER TABLE IF EXISTS sb.conversations
    RENAME last_message_uid TO last_message_id;
ALTER TABLE IF EXISTS sb.conversations
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.conversations
    ADD CONSTRAINT conversations_resources FOREIGN KEY (resource_id)
    REFERENCES sb.resources (uid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.conversations
    ADD CONSTRAINT conversations_messages FOREIGN KEY (last_message_id)
    REFERENCES sb.messages (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.conversations DROP CONSTRAINT IF EXISTS conversations_unique_uid;
ALTER TABLE IF EXISTS sb.participants
    ADD CONSTRAINT participants_conversations FOREIGN KEY (conversation_id)
    REFERENCES sb.conversations (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.campaigns_resources DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.campaigns_resources DROP COLUMN IF EXISTS campaign_id;
ALTER TABLE IF EXISTS sb.campaigns_resources DROP COLUMN IF EXISTS resource_id;
ALTER TABLE IF EXISTS sb.campaigns_resources
    RENAME resource_uid TO resource_id;
ALTER TABLE IF EXISTS sb.campaigns_resources
    ALTER COLUMN resource_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.campaigns_resources
    RENAME campaign_uid TO campaign_id;
ALTER TABLE IF EXISTS sb.campaigns_resources
    ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.campaigns_resources
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.campaigns_resources
    ADD PRIMARY KEY (id);


ALTER TABLE IF EXISTS sb.campaigns DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.campaigns
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.campaigns
    ADD PRIMARY KEY (id);
	
ALTER TABLE IF EXISTS sb.campaigns_resources
    ADD CONSTRAINT campaigns_resources_resources FOREIGN KEY (resource_id)
    REFERENCES sb.resources (uid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.campaigns_resources
    ADD CONSTRAINT campaigns_resources_campaigns FOREIGN KEY (campaign_id)
    REFERENCES sb.campaigns (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions DROP COLUMN IF EXISTS accounts_token_transaction_id;
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions DROP COLUMN IF EXISTS resource_id;


ALTER TABLE IF EXISTS sb.accounts_token_transactions DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.accounts_token_transactions DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.accounts_token_transactions DROP COLUMN IF EXISTS target_account_id;
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    RENAME target_account_uid TO target_account_id;
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD CONSTRAINT accounts_token_transactions_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.accounts_token_transactions
    ADD CONSTRAINT accounts_token_transactions_target_accounts FOREIGN KEY (target_account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    RENAME accounts_token_transaction_uid TO accounts_token_transaction_id;
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    ALTER COLUMN accounts_token_transaction_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    RENAME resource_uid TO resource_id;
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    ALTER COLUMN resource_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    ADD CONSTRAINT resources_accounts_token_transactions_accounts_token_transactions FOREIGN KEY (accounts_token_transaction_id)
    REFERENCES sb.accounts_token_transactions (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.resources_accounts_token_transactions
    ADD CONSTRAINT resources_accounts_token_transactions_resources FOREIGN KEY (resource_id)
    REFERENCES sb.resources (uid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.resources_resource_categories DROP COLUMN IF EXISTS resource_id;
ALTER TABLE IF EXISTS sb.resources_resource_categories
    ALTER COLUMN resource_uid SET NOT NULL;
ALTER TABLE IF EXISTS sb.resources_resource_categories
    ADD PRIMARY KEY (resource_uid, resource_category_code);
ALTER TABLE IF EXISTS sb.resources_resource_categories
    ADD CONSTRAINT resources_resource_categories_resources FOREIGN KEY (resource_uid)
    REFERENCES sb.resources (uid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.resources_resource_categories
    RENAME resource_uid TO resource_id;


ALTER TABLE IF EXISTS sb.resources_images DROP COLUMN IF EXISTS resource_id;
ALTER TABLE IF EXISTS sb.resources_images DROP COLUMN IF EXISTS image_id;


--images
ALTER TABLE IF EXISTS sb.images DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.images
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.images
    ADD CONSTRAINT images_pk PRIMARY KEY (id);
	

ALTER TABLE IF EXISTS sb.resources_images
    ALTER COLUMN resource_uid SET NOT NULL;
ALTER TABLE IF EXISTS sb.resources_images
    ALTER COLUMN image_uid SET NOT NULL;
ALTER TABLE IF EXISTS sb.resources_images
    ADD PRIMARY KEY (resource_uid, image_uid);
ALTER TABLE IF EXISTS sb.resources_images
    ADD CONSTRAINT resources_images_resources FOREIGN KEY (resource_uid)
    REFERENCES sb.resources (uid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.resources_images
    ADD CONSTRAINT resources_images_images FOREIGN KEY (image_uid)
    REFERENCES sb.images (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.resources_images
    RENAME resource_uid TO resource_id;
ALTER TABLE IF EXISTS sb.resources_images
    RENAME image_uid TO image_id;


ALTER TABLE IF EXISTS sb.resources DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.resources DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.resources DROP COLUMN IF EXISTS specific_location_id;


ALTER TABLE IF EXISTS sb.locations DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.locations
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.locations
    ADD PRIMARY KEY (id);


ALTER TABLE IF EXISTS sb.resources
    ALTER COLUMN account_uid SET NOT NULL;
ALTER TABLE IF EXISTS sb.resources
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.resources
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.resources
    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.resources
    RENAME specific_location_uid TO specific_location_id;
ALTER TABLE IF EXISTS sb.resources
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.resources
    ADD CONSTRAINT resources_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.resources
    ADD CONSTRAINT resources_locations FOREIGN KEY (specific_location_id)
    REFERENCES sb.locations (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.accounts_public_data DROP COLUMN IF EXISTS old_id;


ALTER TABLE IF EXISTS sb.broadcast_prefs DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.broadcast_prefs DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.broadcast_prefs
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.broadcast_prefs
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.broadcast_prefs
    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.broadcast_prefs
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.broadcast_prefs
    ADD CONSTRAINT broadcast_prefs_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

	
ALTER TABLE IF EXISTS sb.client_logs DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.client_logs
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.client_logs
    ADD FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
	
	
ALTER TABLE IF EXISTS sb.email_activations DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.email_activations
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.email_activations
    ADD PRIMARY KEY (account_id, activation_code, email);
ALTER TABLE IF EXISTS sb.email_activations
    ADD CONSTRAINT email_activations_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
	

ALTER TABLE IF EXISTS sb.grants_accounts DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.grants_accounts
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.grants_accounts
    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.grants_accounts
    ADD PRIMARY KEY (account_id, grant_id);
ALTER TABLE IF EXISTS sb.grants_accounts
    ADD CONSTRAINT grants_accounts_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
	
	
ALTER TABLE IF EXISTS sb.mails DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.mails DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.mails
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.mails
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.mails
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.mails
    ADD CONSTRAINT mails_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.notifications DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.notifications DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.notifications
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.notifications
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.notifications
    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE IF EXISTS sb.notifications
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.notifications
    ADD CONSTRAINT notifications_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.searches DROP COLUMN IF EXISTS id;
ALTER TABLE IF EXISTS sb.searches DROP COLUMN IF EXISTS account_id;
ALTER TABLE IF EXISTS sb.searches
    RENAME account_uid TO account_id;
ALTER TABLE IF EXISTS sb.searches
    RENAME uid TO id;
ALTER TABLE IF EXISTS sb.searches
    ADD PRIMARY KEY (id);
ALTER TABLE IF EXISTS sb.searches
    ADD CONSTRAINT searches_accounts FOREIGN KEY (account_id)
    REFERENCES sb.accounts_public_data (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;


ALTER TABLE IF EXISTS sb.accounts_public_data
    ADD CONSTRAINT accounts_publid_data_images FOREIGN KEY (avatar_image_id)
    REFERENCES sb.images (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;
ALTER TABLE IF EXISTS sb.accounts_public_data
    ADD CONSTRAINT accounts_public_data_locations FOREIGN KEY (location_id)
    REFERENCES sb.locations (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

-- Modify functions impacted by table updates
DROP FUNCTION IF EXISTS sb.current_account_id();
CREATE OR REPLACE FUNCTION sb.current_account_id(
	)
    RETURNS uuid
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
select nullif(current_setting('jwt.claims.account_id', true), '')::uuid;
$BODY$;

ALTER TYPE sb.jwt_token
        ALTER ATTRIBUTE account_id SET DATA TYPE uuid;

DROP FUNCTION IF EXISTS sb.me();
CREATE OR REPLACE FUNCTION sb.me(
	)
    RETURNS accounts_public_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
select *
  from sb.accounts_public_data
  where id = sb.current_account_id();
 
$BODY$;

DROP FUNCTION IF EXISTS sb.search_accounts(character varying);
CREATE OR REPLACE FUNCTION sb.search_accounts(
	search_term character varying)
    RETURNS SETOF accounts_private_data 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

SELECT apr.*
FROM sb.accounts_public_data apu 
INNER JOIN sb.accounts_private_data apr ON apu.id = apr.account_id
WHERE name ILIKE '%' || search_term || '%' OR email ILIKE '%' || search_term || '%'
ORDER BY created DESC;

$BODY$;

DROP VIEW sb.active_accounts;
CREATE OR REPLACE VIEW sb.active_accounts
 AS
 SELECT a.*
   FROM sb.accounts_public_data a
   INNER JOIN sb.accounts_private_data apr ON a.id = apr.account_id
  WHERE apr.activated IS NOT NULL AND a.name::text <> ''::text AND a.name IS NOT NULL;

ALTER TABLE sb.active_accounts
    OWNER TO sb;
COMMENT ON VIEW sb.active_accounts
    IS '@omit all';

GRANT SELECT ON TABLE sb.active_accounts TO admin;
GRANT SELECT ON TABLE sb.active_accounts TO anonymous;
GRANT SELECT ON TABLE sb.active_accounts TO identified_account;
GRANT ALL ON TABLE sb.active_accounts TO sb;

DROP FUNCTION IF EXISTS sb.get_account_public_info(integer);
CREATE OR REPLACE FUNCTION sb.get_account_public_info(
	id uuid)
    RETURNS accounts_public_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
-- Return any account data that can be publicly known, and replace confidential info by bogus values
select a.*
  from sb.accounts_public_data a
  where a.id = get_account_public_info.id;
 
$BODY$;

DROP FUNCTION IF EXISTS sb.top_accounts();
CREATE OR REPLACE FUNCTION sb.top_accounts(
	)
    RETURNS SETOF accounts_public_data
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000
	SECURITY DEFINER

AS $BODY$

SELECT aa.*
FROM sb.active_accounts aa
INNER JOIN sb.accounts_private_data apr ON apr.account_id = aa.id
WHERE aa.avatar_image_id IS NOT NULL AND
apr.can_be_showcased AND
(SELECT COUNT(*) FROM sb.resources WHERE account_id = aa.id) > 0
ORDER BY apr.created DESC LIMIT 10;

$BODY$;

DROP TABLE IF EXISTS sb.accounts;

CREATE OR REPLACE FUNCTION sb.create_notification(
	account_id uuid,
	data json)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id uuid;
DECLARE notifs_days_between_summaries INTEGER;
begin
	INSERT INTO sb.notifications (account_id, data)
	VALUES (create_notification.account_id, create_notification.data)
	RETURNING id into inserted_id;
	
	PERFORM pg_notify('graphql:notif_account:' || create_notification.account_id, json_build_object(
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

DROP FUNCTION sb.accept_bid(integer);
CREATE OR REPLACE FUNCTION sb.accept_bid(
	bid_id uuid)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE existing_bid_amount INTEGER;
DECLARE existing_bid_resource_id uuid;
DECLARE existing_bid_account_id uuid;
DECLARE resource_account_id uuid;
DECLARE att_id uuid;
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

	UPDATE sb.accounts_private_data SET amount_of_tokens = amount_of_tokens + existing_bid_amount
	WHERE account_id = sb.current_account_id();
	
	SELECT account_id INTO resource_account_id
	FROM sb.resources
	WHERE id = existing_bid_resource_id;
	
	PERFORM sb.create_notification(existing_bid_account_id, json_build_object(
		'info', 'BID_ACCEPTED',
		'resourceId', existing_bid_resource_id,
		'resourceTitle', (SELECT title FROM sb.resources WHERE id = existing_bid_resource_id), 
		'acceptedBy', (SELECT name FROM sb.accounts_public_data WHERE id = resource_account_id)
	));
	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.accept_bid(uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.accept_bid(uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.accept_bid(uuid) TO sb;

REVOKE ALL ON FUNCTION sb.accept_bid(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.activate_account(
	activation_code character varying)
    RETURNS character varying
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE new_email text;
DECLARE id_account_to_activate uuid;
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
	FROM sb.accounts_private_data a
	WHERE a.account_id = id_account_to_activate;
	
	IF current_activated IS NULL THEN
		UPDATE sb.accounts_private_data SET email = new_email, activated = NOW()
		WHERE account_id = id_account_to_activate;
		
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
		UPDATE sb.accounts_private_data SET email = new_email
		WHERE account_id = id_account_to_activate;
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

DROP FUNCTION IF EXISTS sb.apply_account_resources_rewards(integer);
CREATE OR REPLACE FUNCTION sb.apply_account_resources_rewards(
	account_id uuid)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE res record;
BEGIN
	FOR res IN
		SELECT id 
		FROM sb.resources r
		WHERE r.deleted IS NULL AND (r.expiration IS NULL OR r.expiration > NOW()) AND 
			r.account_id = apply_account_resources_rewards.account_id
	-- Loop through active resources - including suspended - to award applicable token rewards
	LOOP
		PERFORM sb.apply_resources_rewards(res.id);
	END LOOP;
END;
$BODY$;

ALTER FUNCTION sb.apply_account_resources_rewards(uuid)
    OWNER TO sb;
	
CREATE OR REPLACE FUNCTION sb.apply_airdrop(
	)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE campaign_id uuid;
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
		FROM sb.accounts_public_data a
		INNER JOIN sb.resources r ON a.id = r.account_id AND r.deleted IS NULL AND (expiration IS NULL OR expiration > NOW())
		INNER JOIN sb.campaigns_resources cr ON cr.resource_id = r.id AND cr.campaign_id = block.campaign_id
		GROUP BY a.id
		HAVING COUNT(*) > 1
		LOOP		
			UPDATE sb.accounts_private_data
			SET amount_of_tokens = amount_of_tokens + block.airdrop_amount
			WHERE account_id = account_to_airdrop.id;
			
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

CREATE OR REPLACE FUNCTION sb.apply_campaign_announcements(
	)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE campaign_id uuid;
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
			PERFORM pg_notify('graphql:notif_account:' || n.account_id, json_build_object(
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
			PERFORM pg_notify('graphql:notif_account:' || n.account_id, json_build_object(
				'event', 'notification_created',
				'subject', n.id
			)::text);
		END LOOP;
	
		UPDATE sb.campaigns SET airdrop_imminent_announced = TRUE WHERE id = (SELECT id FROM sb.get_active_campaign());
	END IF;
	
	RETURN 1;
END;
$BODY$;

DROP FUNCTION IF EXISTS sb.apply_resources_rewards(integer);
CREATE OR REPLACE FUNCTION sb.apply_resources_rewards(
	resource_id uuid)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE amount_to_add integer = 0;
DECLARE att_id uuid;
DECLARE resource_account_id uuid;
DECLARE campaign_multiplier integer;
BEGIN
	SELECT account_id FROM sb.resources WHERE id = apply_resources_rewards.resource_id INTO resource_account_id;
	
	-- Check account is activated, and resource is not expired, not deleted, and least 1 day old
	IF EXISTS (SELECT * FROM sb.accounts_private_data WHERE account_id = resource_account_id AND activated IS NOT NULL) 
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
			UPDATE sb.accounts_private_data SET amount_of_tokens = amount_of_tokens + amount_to_add
			WHERE account_id = resource_account_id;
		END IF;
	END IF;
END;
$BODY$;

ALTER FUNCTION sb.apply_resources_rewards(uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.apply_resources_rewards(uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.apply_resources_rewards(uuid) TO sb;

REVOKE ALL ON FUNCTION sb.apply_resources_rewards(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.apply_resources_token_transactions(
	)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE acc RECORD;
BEGIN
	FOR acc IN
		SELECT account_id FROM sb.accounts_private_data
		WHERE email IS NOT NULL AND email <> '' AND
			activated IS NOT NULL
	LOOP
		PERFORM sb.apply_account_resources_rewards(acc.account_id);
	END LOOP;
END;
$BODY$;

CREATE OR REPLACE FUNCTION sb.authenticate(
	email character varying,
	password character varying)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare account_id uuid;
begin
  select a.account_id into account_id
    from sb.accounts_private_data as a
    where a.email = LOWER(authenticate.email) and a.hash = crypt(password, a.salt);

  if account_id IS NOT NULL then
    return (
      account_id,
      extract(epoch from now() + interval '100 day'),
      'identified_account'
    )::sb.jwt_token;
  else
    return null;
  end if;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.authenticate_external_auth(
	email character varying,
	token character varying,
	auth_provider integer)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare account_id uuid;
begin
  select a.account_id into account_id
    from sb.accounts_private_data as a
	inner join sb.external_auth_tokens eat ON eat.email = a.email AND eat.auth_provider = authenticate_external_auth.auth_provider
    where a.email = LOWER(authenticate_external_auth.email) and eat.token = authenticate_external_auth.token;

  if account_id IS NOT NULL then
    return (
      account_id,
      extract(epoch from now() + interval '100 day'),
      'identified_account'
    )::sb.jwt_token;
  else
    return null;
  end if;
end;
$BODY$;

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
	SELECT crypt(old_password, (SELECT salt FROM sb.accounts_private_data WHERE account_id = sb.current_account_id())) INTO old_hash;
	
	UPDATE sb.accounts_private_data a
	SET hash = crypt(new_password, new_salt), salt = new_salt
	WHERE a.account_id = sb.current_account_id() AND a.hash = old_hash;
	
	GET DIAGNOSTICS cnt = ROW_COUNT;
	
	IF cnt = 0 THEN
		RAISE EXCEPTION 'Invalid password';
	END IF;
	
	RETURN 1;
end;
$BODY$;

DROP FUNCTION IF EXISTS sb.conversation_messages(integer, integer);
CREATE OR REPLACE FUNCTION sb.conversation_messages(
	resource_id uuid,
	other_account_id uuid)
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

ALTER FUNCTION sb.conversation_messages(uuid, uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.conversation_messages(uuid, uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.conversation_messages(uuid, uuid) TO sb;

REVOKE ALL ON FUNCTION sb.conversation_messages(uuid, uuid) FROM PUBLIC;


DROP FUNCTION IF EXISTS sb.conversation_messages_by_conversation_id(integer);
CREATE OR REPLACE FUNCTION sb.conversation_messages_by_conversation_id(
	id uuid)
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

ALTER FUNCTION sb.conversation_messages_by_conversation_id(uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.conversation_messages_by_conversation_id(uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.conversation_messages_by_conversation_id(uuid) TO sb;

REVOKE ALL ON FUNCTION sb.conversation_messages_by_conversation_id(uuid) FROM PUBLIC;


DROP FUNCTION IF EXISTS sb.create_bid(integer, integer, integer);
CREATE OR REPLACE FUNCTION sb.create_bid(
	resource_id uuid,
	amount_of_tokens integer,
	hours_valid integer)
    RETURNS UUID
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE existing_bid_id uuid;
DECLARE inserted_id uuid;
DECLARE att_id uuid;
DECLARE existing_bid_amount INTEGER;
BEGIN
	IF NOT EXISTS (SELECT * FROM sb.resources WHERE id = create_bid.resource_id AND (expiration IS NULL OR expiration > NOW()) AND can_be_exchanged AND deleted IS NULL) THEN
		RETURN NULL;
	END IF;
	IF create_bid.amount_of_tokens > (SELECT a.amount_of_tokens FROM sb.accounts_private_data a WHERE account_id = sb.current_account_id()) THEN
		RETURN NULL;
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
	
	UPDATE sb.accounts_private_data a SET amount_of_tokens = a.amount_of_tokens - create_bid.amount_of_tokens
	WHERE account_id = sb.current_account_id();

	IF existing_bid_id IS NOT NULL THEN
		UPDATE sb.bids
		SET deleted = NOW()
		WHERE id = existing_bid_id;
		
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 11, existing_bid_amount)
		RETURNING id INTO att_id;
		
		INSERT INTO sb.resources_accounts_token_transactions (accounts_token_transaction_id, resource_id)
		VALUES (att_id, create_bid.resource_id);
		
		UPDATE sb.accounts_private_data a SET amount_of_tokens = a.amount_of_tokens + existing_bid_amount
		WHERE account_id = sb.current_account_id();
	END IF;
	
	PERFORM sb.create_notification((SELECT r.account_id FROM sb.resources r WHERE id = create_bid.resource_id), json_build_object(
		'info', 'BID_RECEIVED',
		'resourceId', create_bid.resource_id,
		'resourceTitle', (SELECT title FROM sb.resources WHERE id = create_bid.resource_id), 
		'receivedFrom', (SELECT name FROM sb.accounts_public_data WHERE id = sb.current_account_id())
	));

	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN inserted_id;
end;
$BODY$;

ALTER FUNCTION sb.create_bid(uuid, integer, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.create_bid(uuid, integer, integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.create_bid(uuid, integer, integer) TO sb;

REVOKE ALL ON FUNCTION sb.create_bid(uuid, integer, integer) FROM PUBLIC;

DROP FUNCTION IF EXISTS sb.create_campaign(character varying, character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone);
CREATE OR REPLACE FUNCTION sb.create_campaign(
	name character varying,
	summary character varying,
	description character varying,
	airdrop timestamp with time zone,
	airdrop_amount integer,
	resource_rewards_multiplier integer,
	default_resource_categories integer[],
	beginning timestamp with time zone,
	ending timestamp with time zone)
    RETURNS uuid
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id uuid;
BEGIN
	INSERT INTO sb.campaigns(
		name, summary, description, airdrop, airdrop_amount, resource_rewards_multiplier, default_resource_categories, beginning, ending)
	VALUES (create_campaign.name, create_campaign.summary, create_campaign.description, create_campaign.airdrop, create_campaign.airdrop_amount,
		   create_campaign.resource_rewards_multiplier, create_campaign.default_resource_categories, 
		   create_campaign.beginning, create_campaign.ending)
	RETURNING id INTO inserted_id;
	
	RETURN inserted_id;
end;
$BODY$;

ALTER FUNCTION sb.create_campaign(character varying, character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.create_campaign(character varying, character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone) TO admin;

GRANT EXECUTE ON FUNCTION sb.create_campaign(character varying, character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone) TO sb;

REVOKE ALL ON FUNCTION sb.create_campaign(character varying, character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone) FROM PUBLIC;

DROP FUNCTION IF EXISTS sb.create_client_log(character varying, integer, character varying, integer);
CREATE OR REPLACE FUNCTION sb.create_client_log(
	data character varying,
	level integer,
	activity_id character varying,
	account_id uuid)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	INSERT INTO sb.client_logs (account_id, data, level, activity_id)
	VALUES (create_client_log.account_id, create_client_log.data, create_client_log.level, create_client_log.activity_id);
	
	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.create_client_log(character varying, integer, character varying, uuid)
    OWNER TO sb;
	
DROP FUNCTION IF EXISTS sb.create_image(character varying);


DROP FUNCTION IF EXISTS sb.create_message(integer, integer, character varying, character varying);
CREATE OR REPLACE FUNCTION sb.create_message(
	resource_id uuid,
	other_account_id uuid,
	text character varying,
	image_public_id character varying)
    RETURNS uuid
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE conversation_id uuid;
DECLARE created_message_id uuid;
DECLARE created_message_text TEXT;
DECLARE created_message_sender TEXT;
DECLARE inserted_image_id uuid;
DECLARE destinator_participant_id uuid;
DECLARE destinator_id uuid;
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
    FROM sb.accounts_public_data a
    WHERE a.id = sb.current_account_id();
	
	IF conversation_id IS NULL THEN
		INSERT INTO sb.conversations (resource_id)
		VALUES (create_message.resource_id)
		RETURNING id INTO conversation_id;
		
		INSERT INTO sb.participants (account_id, conversation_id)
		VALUES (sb.current_account_id(), block.conversation_id);
		INSERT INTO sb.participants (account_id, conversation_id)
		VALUES (create_message.other_account_id, block.conversation_id);
		
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
	
	UPDATE sb.conversations c SET last_message_id = created_message_id
	WHERE c.id = block.conversation_id;
	
	SELECT a.id, a.name, apt.token INTO destinator_id, destinator_name, target_push_token
	FROM sb.accounts_public_data a
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

ALTER FUNCTION sb.create_message(uuid, uuid, character varying, character varying)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.create_message(uuid, uuid, character varying, character varying) TO identified_account;

DROP FUNCTION IF EXISTS sb.create_new_resource_notifications(integer, integer[]);
CREATE OR REPLACE FUNCTION sb.create_new_resource_notifications(
	resource_id uuid,
	accounts_to_notify uuid[])
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE n RECORD;
BEGIN
	FOR n IN
		INSERT INTO sb.notifications (account_id, data)
		SELECT
			UNNEST(accounts_to_notify), 
			json_build_object('resource_id', resource_id)
		RETURNING id, account_id
	LOOP
		-- Emit notification for graphql/postgraphile's subscription plugin
		PERFORM pg_notify('graphql:notif_account:' || n.account_id, json_build_object(
			'event', 'notification_created',
			'subject', n.id
		)::text);
	END LOOP;
		
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.create_new_resource_notifications(uuid, uuid[])
    OWNER TO sb;
	
DROP FUNCTION IF EXISTS sb.create_notification(integer, json);
CREATE OR REPLACE FUNCTION sb.create_notification(
	account_id uuid,
	data json)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id uuid;
DECLARE notifs_days_between_summaries INTEGER;
begin
	INSERT INTO sb.notifications (account_id, data)
	VALUES (create_notification.account_id, create_notification.data)
	RETURNING id into inserted_id;
	
	PERFORM pg_notify('graphql:notif_account:' || create_notification.account_id, json_build_object(
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

ALTER FUNCTION sb.create_notification(uuid, json)
    OWNER TO sb;
	

DROP FUNCTION IF EXISTS sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, integer);
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
	campaign_to_join uuid)
    RETURNS uuid
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id uuid;
DECLARE location_id uuid;
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
	
	IF (SELECT activated FROM sb.accounts_private_data WHERE account_id = sb.current_account_id()) IS NOT NULL THEN
		-- Emit notification for push notification handling
		PERFORM pg_notify('resource_created', json_build_object(
			'resource_id', inserted_id
		)::text);
	END IF;
	
	RETURN inserted_id;
end;
$BODY$;

ALTER FUNCTION sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, uuid) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.create_resource(character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, uuid) TO sb;

CREATE OR REPLACE FUNCTION sb.delete_account(
	)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE resource RECORD;
DECLARE avatar_image_id_to_delete uuid;
BEGIN
	SELECT avatar_image_id FROM sb.accounts_public_data
	INTO avatar_image_id_to_delete
	WHERE id = sb.current_account_id();
	
	UPDATE sb.accounts_public_data
	SET name='', avatar_image_id=null, bio='', location_id=null
	WHERE id = sb.current_account_id();
	
	UPDATE sb.accounts_private_data
	SET email=NULL, hash='', salt='', recovery_code='', recovery_code_expiration=null, activated=null, language=''
	WHERE account_id = sb.current_account_id();

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

DROP FUNCTION IF EXISTS sb.delete_bid(integer);
CREATE OR REPLACE FUNCTION sb.delete_bid(
	bid_id uuid)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE ret_val INTEGER;
DECLARE existing_bid_resource_id uuid;
DECLARE existing_bid_account_id uuid;
DECLARE resource_account_id uuid;
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
			'cancelledBy', (SELECT name FROM sb.accounts_public_data WHERE id = existing_bid_account_id)
		));
	END IF;
	
	RETURN ret_val;
end;
$BODY$;

ALTER FUNCTION sb.delete_bid(uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.delete_bid(uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.delete_bid(uuid) TO sb;

REVOKE ALL ON FUNCTION sb.delete_bid(uuid) FROM PUBLIC;

DROP FUNCTION IF EXISTS sb.delete_bid_internal(integer, integer);
CREATE OR REPLACE FUNCTION sb.delete_bid_internal(
	bid_id uuid,
	bid_account_id uuid)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE existing_bid_amount INTEGER;
DECLARE existing_bid_resource_id uuid;
DECLARE existing_bid_account_id uuid;
DECLARE resource_account_id uuid;
DECLARE att_id uuid;
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

	UPDATE sb.accounts_private_data SET amount_of_tokens = amount_of_tokens + existing_bid_amount
	WHERE account_id = existing_bid_account_id;
	
	PERFORM pg_notify('graphql:account_changed:' || existing_bid_account_id, json_build_object(
		'event', 'account_changed',
		'subject', existing_bid_account_id
	)::text);

	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.delete_bid_internal(uuid, uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.delete_bid_internal(uuid, uuid) TO sb;

REVOKE ALL ON FUNCTION sb.delete_bid_internal(uuid, uuid) FROM PUBLIC;

DROP FUNCTION IF EXISTS sb.delete_resource(integer);
CREATE OR REPLACE FUNCTION sb.delete_resource(
	resource_id uuid)
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

ALTER FUNCTION sb.delete_resource(uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.delete_resource(uuid) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.delete_resource(uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.delete_resource(uuid) TO sb;

DROP FUNCTION IF EXISTS sb.get_accounts_to_notify_of_new_resource(integer);
CREATE OR REPLACE FUNCTION sb.get_accounts_to_notify_of_new_resource(
	resource_id uuid)
    RETURNS uuid[]
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE results uuid[];
BEGIN
	results := ARRAY(
		SELECT id
		FROM (
			-- Accounts close to the resource created
			-- if new resource has a location
			SELECT a.id,
				CASE 
					WHEN sb.geodistance(loc.latitude, loc.longitude, l.latitude, l.longitude) < 5 THEN 10 
					WHEN sb.geodistance(loc.latitude, loc.longitude, l.latitude, l.longitude) < 15 THEN 5 
				END as score
			FROM sb.accounts_public_data a
			INNER JOIN sb.locations l ON a.location_id = l.id
			CROSS JOIN (
				SELECT l.id, latitude, longitude
				FROM sb.resources r
				INNER JOIN sb.locations l ON l.id = r.specific_location_id
				WHERE r.id = get_accounts_to_notify_of_new_resource.resource_id
			) loc
			WHERE name IS NOT NULL and name <> '' AND loc.id IS NOT NULL AND a.location_id IS NOT NULL AND 
				sb.geodistance(loc.latitude, loc.longitude, l.latitude, l.longitude) < 15
			UNION ALL
			-- Accounts taking part in active campaign
			-- if a campaign is active
			SELECT a.id, 10 as score
			FROM sb.accounts_public_data a
			CROSS JOIN sb.get_active_campaign()
			INNER JOIN sb.campaigns_resources cr_new ON cr_new.resource_id = get_accounts_to_notify_of_new_resource.resource_id
			WHERE a.name IS NOT NULL and a.name <> '' AND EXISTS (
				SELECT *
				FROM sb.resources r
				INNER JOIN sb.campaigns_resources cr ON cr.resource_id = r.id AND cr.campaign_id = (SELECT id FROM sb.get_active_campaign())
				WHERE account_id = a.id AND deleted IS NULL AND (expiration IS NULL OR expiration > NOW())
			)
			
			UNION ALL
			-- Accounts having recent searches that match the new resource's title and/or description
			SELECT account_id, 10 FROM (
				SELECT s.account_id, 10 as score from sb.searches s
				INNER JOIN sb.accounts_public_data a ON a.id = s.account_id AND a.name <> '' -- filter out deleted accounts
				INNER JOIN sb.resources r ON r.id = get_accounts_to_notify_of_new_resource.resource_id
				WHERE s.account_id IS NOT NULL AND s.term IS NOT NULL AND s.term <> '' AND (
					sb.strict_word_similarity(s.term, r.title) > 0.25 OR
					sb.strict_word_similarity(s.term, r.description) > 0.25
				)
				ORDER BY GREATEST(sb.strict_word_similarity(s.term, r.title), sb.strict_word_similarity(s.term, r.description) ) DESC
				LIMIT 5
			) m
		) matches
		WHERE id != (SELECT account_id FROM sb.resources WHERE id = get_accounts_to_notify_of_new_resource.resource_id)
		GROUP BY(id)
		HAVING SUM(score) > 10
		ORDER BY SUM(score) DESC
		LIMIT 5);

	RETURN results;
end;
$BODY$;

ALTER FUNCTION sb.get_accounts_to_notify_of_new_resource(uuid)
    OWNER TO sb;


DROP FUNCTION IF EXISTS sb.get_conversation_for_resource(integer);
CREATE OR REPLACE FUNCTION sb.get_conversation_for_resource(
	resource_id uuid)
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

ALTER FUNCTION sb.get_conversation_for_resource(uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_conversation_for_resource(uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.get_conversation_for_resource(uuid) TO sb;

REVOKE ALL ON FUNCTION sb.get_conversation_for_resource(uuid) FROM PUBLIC;


DROP FUNCTION IF EXISTS sb.get_resources(integer[]);
CREATE OR REPLACE FUNCTION sb.get_resources(
	resource_ids uuid[])
    RETURNS SETOF resources 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT *
	FROM sb.resources r
	WHERE id = ANY(resource_ids);
$BODY$;

ALTER FUNCTION sb.get_resources(uuid[])
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_resources(uuid[]) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.get_resources(uuid[]) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.get_resources(uuid[]) TO sb;

CREATE OR REPLACE FUNCTION sb.my_notifications(
	)
    RETURNS SETOF notifications 
    LANGUAGE 'sql'
    COST 100
    STABLE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
	SELECT n.*
	FROM sb.notifications n
	LEFT JOIN sb.resources r ON r.id = (data ->>'resource_id')::UUID
	WHERE n.account_id = sb.current_account_id() AND
	-- filter out 'new resource' notifications of deleted resources
	((data ->>'resource_id') IS NULL OR r.deleted IS NULL)
	ORDER BY created DESC;
$BODY$;

DROP FUNCTION IF EXISTS sb.get_session_data();
DROP FUNCTION IF EXISTS sb.get_session_data_web();

DROP TYPE IF EXISTS sb.session_data;
CREATE TYPE sb.session_data AS
(
	account_id uuid,
	name character varying,
	email character varying,
	role character varying,
	avatar_public_id character varying,
	activated timestamp without time zone,
	log_level integer,
	unread_conversations uuid[],
	unread_notifications uuid[],
	amount_of_tokens integer,
	number_of_external_auth_providers integer,
	knows_about_campaigns boolean
);

ALTER TYPE sb.session_data
    OWNER TO sb;

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
	apr.knows_about_campaigns

	FROM sb.accounts_public_data apu
	INNER JOIN sb.accounts_private_data apr ON apu.id = apr.account_id
	LEFT JOIN sb.images i ON apu.avatar_image_id = i.id
	WHERE apu.id = sb.current_account_id()
$BODY$;

ALTER FUNCTION sb.get_session_data()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_session_data() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.get_session_data() TO sb;

REVOKE ALL ON FUNCTION sb.get_session_data() FROM PUBLIC;

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
	apr.knows_about_campaigns

	FROM sb.accounts_public_data apu 
	INNER JOIN sb.accounts_private_data apr ON apu.id = apr.account_id
	LEFT JOIN sb.images i ON apu.avatar_image_id = i.id
	WHERE apu.id = sb.current_account_id()
$BODY$;

ALTER FUNCTION sb.get_session_data_web()
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.get_session_data_web() TO identified_account;

GRANT EXECUTE ON FUNCTION sb.get_session_data_web() TO sb;

REVOKE ALL ON FUNCTION sb.get_session_data_web() FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.grant_applicable_rewards(
	notify_if_token_amount_changed boolean DEFAULT true)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE amount_tokens_to_add integer = 0;
BEGIN
	IF (SELECT COUNT(*) FROM sb.accounts_links
		WHERE account_id = sb.current_account_id()) > 0 AND
		NOT EXISTS (SELECT * FROM sb.accounts_token_transactions WHERE account_id = sb.current_account_id() AND token_transaction_type_id = 3)
	THEN
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 3, 20);
		
		amount_tokens_to_add = amount_tokens_to_add + 20;
	END IF;
		
	IF EXISTS(SELECT * FROM sb.accounts_public_data
		WHERE id = sb.current_account_id() AND location_id IS NOT NULL)  AND
		NOT EXISTS (SELECT * FROM sb.accounts_token_transactions WHERE account_id = sb.current_account_id() AND token_transaction_type_id = 2)
	THEN
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 2, 20);
		
		amount_tokens_to_add = amount_tokens_to_add + 20;
	END IF;
	
	IF EXISTS(SELECT * FROM sb.accounts_public_data
		WHERE id = sb.current_account_id() AND avatar_image_id IS NOT NULL)  AND
		NOT EXISTS (SELECT * FROM sb.accounts_token_transactions WHERE account_id = sb.current_account_id() AND token_transaction_type_id = 1)
	THEN
		INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
		VALUES (sb.current_account_id(), 1, 20);
		
		amount_tokens_to_add = amount_tokens_to_add + 20;
	END IF;
	
	IF amount_tokens_to_add > 0 THEN
		UPDATE sb.accounts_private_data SET amount_of_tokens = amount_of_tokens + amount_tokens_to_add
		WHERE account_id = sb.current_account_id();
		
		IF notify_if_token_amount_changed THEN
		
			PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
				'event', 'account_changed',
				'subject', sb.current_account_id()
			)::text);
		END IF;
	END IF;
	
	RETURN 1;
end;
$BODY$;

CREATE OR REPLACE FUNCTION sb.grant_hit(
	grant_id uuid)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE grant_amount INTEGER;
DECLARE grant_expiration timestamp with time zone;
DECLARE grant_data JSON;
DECLARE grant_title CHARACTER VARYING;
BEGIN
	-- grant exists
	SELECT amount, expiration, data, title
	INTO grant_amount, grant_expiration, grant_data, grant_title
	FROM sb.grants
	WHERE id = grant_id;

	IF grant_expiration < NOW() THEN
		RETURN -1; -- expired grant
	END IF;

	IF grant_data -> 'maxNumberOfGrants' IS NOT NULL AND
		(SELECT COUNT(*) FROM sb.grants_accounts ga WHERE ga.grant_id = grant_hit.grant_id) >= (grant_data ->> 'maxNumberOfGrants')::integer THEN

		RETURN -2; -- max number of grants reached

	END IF;
	
	IF grant_data -> 'emails' IS NOT NULL AND
		NOT EXISTS (SELECT * FROM (SELECT json_array_elements_text as email FROM json_array_elements_text(grant_data -> 'emails')) emails
				WHERE LOWER(email) = (SELECT email FROM sb.accounts_private_data WHERE account_id = sb.current_account_id()) ) THEN
		
		RETURN -3; -- not on the whitelist
		
	END IF;
	
	IF grant_data -> 'activeInCampaign' IS NOT NULL AND
		NOT EXISTS ( SELECT * 
					FROM sb.campaigns_resources cr 
					INNER JOIN sb.resources r ON cr.resource_id = r.id
					WHERE campaign_id = (grant_data ->> 'activeInCampaign')::uuid AND
				    r.account_id = sb.current_account_id()) THEN
					
		RETURN -4; -- Not a participant to the campaign
		
	END IF;
	
	-- insert grant_account
	INSERT INTO sb.grants_accounts (grant_id, account_id)
	VALUES (grant_hit.grant_id, sb.current_account_id());
	
	-- create transaction history record
	INSERT INTO sb.accounts_token_transactions (account_id, token_transaction_type_id, movement)
	VALUES (sb.current_account_id(), 17, grant_amount);
	
	-- increase account token amount
	UPDATE sb.accounts_private_data SET amount_of_tokens = amount_of_tokens + grant_amount
	WHERE account_id = sb.current_account_id();
	
	-- Create notification
	PERFORM sb.create_notification(sb.current_account_id(), json_build_object(
		'info', 'GRANT_RECEIVED',
		'amount', grant_amount,
		'title', grant_title
	));

	RETURN 1;
END;
$BODY$;


DROP FUNCTION IF EXISTS sb.grant_tokens(integer[], integer, integer);
CREATE OR REPLACE FUNCTION sb.grant_tokens(
	account_ids uuid[],
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
	
	UPDATE sb.accounts_private_data a SET amount_of_tokens = a.amount_of_tokens + grant_tokens.amount_of_tokens
	WHERE account_id = ANY(grant_tokens.account_ids);
	
	FOR account_id IN SELECT UNNEST(account_ids)
	LOOP
		PERFORM sb.create_notification(account_id, json_build_object(
			'info', 'TOKEN_GRANTED',
			'amountOfTokens', grant_tokens.amount_of_tokens,
			'grantorName', (SELECT name FROM sb.accounts_public_data WHERE id = grantor)
		));
	END LOOP;
	
	RETURN 1;
end;
$BODY$;

ALTER FUNCTION sb.grant_tokens(uuid[], integer, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.grant_tokens(uuid[], integer, integer) TO sb;

REVOKE ALL ON FUNCTION sb.grant_tokens(uuid[], integer, integer) FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.handle_resources_and_bids_expiration(
	)
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
			'resourceAuthor', (SELECT name FROM sb.accounts_public_data WHERE id = bid_on_expired_res.resource_author_id)
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
				'resourceAuthor', (SELECT name FROM sb.accounts_public_data WHERE id = bid.resource_author_id)
			));
		END IF;
	END LOOP;
END;
$BODY$;

CREATE OR REPLACE FUNCTION sb.recover_account(
	recovery_code character varying,
	new_password character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE code TEXT;
begin
	UPDATE sb.accounts_private_data SET hash = phs.hash, salt = phs.salt, recovery_code = null, recovery_code_expiration = null
	FROM sb.get_password_hash_salt(recover_account.new_password) phs
	WHERE accounts_private_data.recovery_code = recover_account.recovery_code AND recovery_code_expiration > NOW();
	
	RETURN 1;
end;
$BODY$;


DROP FUNCTION IF EXISTS sb.refuse_bid(integer, character varying);
CREATE OR REPLACE FUNCTION sb.refuse_bid(
	bid_id uuid,
	notification_type character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE existing_bid_amount INTEGER;
DECLARE existing_bid_resource_id uuid;
DECLARE existing_bid_account_id uuid;
DECLARE resource_account_id uuid;
DECLARE att_id uuid;
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

	UPDATE sb.accounts_private_data SET amount_of_tokens = amount_of_tokens + existing_bid_amount
	WHERE account_id = existing_bid_account_id;
		
	SELECT account_id INTO resource_account_id
	FROM sb.resources
	WHERE id = existing_bid_resource_id;
	
	PERFORM sb.create_notification(existing_bid_account_id, json_build_object(
		'info', COALESCE(notification_type, 'BID_REFUSED'),
		'resourceId', existing_bid_resource_id,
		'resourceTitle', (SELECT title FROM sb.resources WHERE id = existing_bid_resource_id), 
		'refusedBy', (SELECT name FROM sb.accounts_public_data WHERE id = resource_account_id)
	));
	PERFORM pg_notify('graphql:account_changed:' || existing_bid_account_id, json_build_object(
		'event', 'account_changed',
		'subject', existing_bid_account_id
	)::text);
	
	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.refuse_bid(uuid, character varying)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.refuse_bid(uuid, character varying) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.refuse_bid(uuid, character varying) TO sb;

REVOKE ALL ON FUNCTION sb.refuse_bid(uuid, character varying) FROM PUBLIC;


CREATE OR REPLACE FUNCTION sb.register_account(
	name character varying,
	email character varying,
	password character varying,
	language character varying)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare inserted_id uuid;
declare hash character varying;
declare salt character varying;
declare activation_code character varying;
begin
	IF sb.is_password_valid(register_account.password) = FALSE THEN
		RAISE EXCEPTION 'Password invalid';
	ELSE
		IF EXISTS(SELECT * FROM sb.accounts_private_data a WHERE a.email = LOWER(register_account.email)) THEN
			RAISE EXCEPTION 'Email is in use';
		END IF;
	END IF;
	
	INSERT INTO sb.accounts_public_data(name)
	SELECT register_account.name
	RETURNING id INTO inserted_id;
	
	INSERT INTO sb.accounts_private_data(account_id, email, hash, salt, language)
	SELECT inserted_id, LOWER(register_account.email), phs.hash, phs.salt, register_account.language
	FROM sb.get_password_hash_salt(register_account.password) phs;
	
	SELECT array_to_string(array(select substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) 
	INTO activation_code
	FROM generate_series(1,32)),'');
	
	PERFORM sb.create_notification(inserted_id, json_build_object(
        'info', 'COMPLETE_PROFILE'
    ));
	
	INSERT INTO sb.broadcast_prefs (event_type, account_id, days_between_summaries)
	VALUES (2, inserted_id, 1);
	
	INSERT INTO sb.email_activations (account_id, email, activation_code)
	VALUES (inserted_id, LOWER(register_account.email), activation_code);
	
	PERFORM sb.add_job('mailActivation', 
		json_build_object('email', LOWER(register_account.email), 'code', activation_code, 'lang', register_account.language));
	
	RETURN (
		inserted_id,
		EXTRACT(epoch FROM now() + interval '100 day'),
		'identified_account'
    )::sb.jwt_token;
end;
$BODY$;


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
DECLARE inserted_id integer;
BEGIN
	IF EXISTS(SELECT *
		FROM sb.external_auth_tokens eat
		WHERE eat.email = LOWER(register_account_external_auth.email) AND
			eat.token = register_account_external_auth.token AND
			eat.auth_provider = register_account_external_auth.auth_provider) THEN
	
		INSERT INTO sb.accounts_public_data(name)
		VALUES (account_name)
		RETURNING id INTO inserted_id;
		
		INSERT INTO sb.accounts_private_data(account_id, name, email, language, activated)
		VALUES (inserted_id, account_name, LOWER(register_account_external_auth.email), 
			register_account_external_auth.language, now())
		RETURNING id INTO inserted_id;	

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
	
	UPDATE sb.accounts_private_data SET recovery_code = code, recovery_code_expiration = NOW() + interval '15 minutes'
	WHERE accounts.email = LOWER(request_account_recovery.email);
	
	IF FOUND THEN
		PERFORM sb.add_job('mailPasswordRecovery', 
			json_build_object('email', LOWER(request_account_recovery.email), 'code', code, 'lang', block.language));
	END IF;
	
	RETURN 1;
end;
$BODY$;


CREATE OR REPLACE FUNCTION sb.send_activation_again()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE activation_code character varying;
DECLARE activated_email character varying;
DECLARE account_language character varying;
begin
	SELECT ea.activation_code, ea.email, a.language
	INTO block.activation_code, block.activated_email, block.account_language
	FROM sb.email_activations ea 
	INNER JOIN sb.accounts_private_data a ON a.account_id = ea.id
	WHERE a.account_id = current_account_id() AND ea.activated IS NULL
	ORDER BY ea.created DESC
	LIMIT 1;
	
	IF block.activation_code IS NULL THEN
		RETURN 2;
	END IF;
	
	PERFORM sb.add_job('mailActivation',
		json_build_object('email', LOWER(block.activated_email), 'code', block.activation_code, 'lang', block.account_language));
	
	RETURN 1;
end;
$BODY$;


DROP FUNCTION IF EXISTS sb.send_tokens(integer, integer);
CREATE OR REPLACE FUNCTION sb.send_tokens(
	target_account_id uuid,
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
	IF(amount_to_send > (SELECT amount_of_tokens FROM sb.accounts_private_data WHERE account_id = sb.current_account_id())) THEN
		RETURN 2;
	END IF;
	
	INSERT INTO sb.accounts_token_transactions(
		account_id, token_transaction_type_id, movement, target_account_id)
	VALUES (sb.current_account_id(), 8, -amount_to_send, send_tokens.target_account_id);
	INSERT INTO sb.accounts_token_transactions(
		account_id, token_transaction_type_id, movement, target_account_id)
	VALUES (send_tokens.target_account_id, 9, amount_to_send, sb.current_account_id());

	UPDATE sb.accounts_private_data SET amount_of_tokens = amount_of_tokens - amount_to_send
	WHERE account_id = sb.current_account_id();
	UPDATE sb.accounts_private_data SET amount_of_tokens = amount_of_tokens + amount_to_send
	WHERE account_id = send_tokens.target_account_id;
	
	-- Create a notification for the sender, and one for the receiver
	PERFORM sb.create_notification(target_account_id, json_build_object(
		'info', 'TOKENS_RECEIVED', 'fromAccount', (SELECT name FROM sb.accounts_public_data WHERE id = sb.current_account_id()), 'amountReceived', amount_to_send
	));
	PERFORM sb.create_notification(sb.current_account_id(), json_build_object(
		'info', 'TOKENS_SENT', 'toAccount', (SELECT name FROM sb.accounts_public_data WHERE id = target_account_id), 'amountSent', amount_to_send
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

ALTER FUNCTION sb.send_tokens(uuid, integer)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.send_tokens(uuid, integer) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.send_tokens(uuid, integer) TO sb;

REVOKE ALL ON FUNCTION sb.send_tokens(uuid, integer) FROM PUBLIC;


CREATE OR REPLACE FUNCTION sb.set_account_knows_about_campaigns()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
BEGIN
	UPDATE sb.accounts_private_data
	SET knows_about_campaigns = true
	WHERE account_id = sb.current_account_id();

	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);

	RETURN 1;
end;
$BODY$;


DROP FUNCTION IF EXISTS sb.set_notification_read(integer);
CREATE OR REPLACE FUNCTION sb.set_notification_read(
	notification_id uuid)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	UPDATE sb.notifications SET read = NOW()
	WHERE id = notification_id AND account_id = sb.current_account_id();

	RETURN 1;
END;
$BODY$;

ALTER FUNCTION sb.set_notification_read(uuid)
    OWNER TO sb;

GRANT EXECUTE ON FUNCTION sb.set_notification_read(uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.set_notification_read(uuid) TO sb;

REVOKE ALL ON FUNCTION sb.set_notification_read(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION sb.set_notifications_read()
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
	UPDATE sb.notifications SET read = NOW()
	WHERE account_id = sb.current_account_id();

	RETURN 1;
END;
$BODY$;


DROP FUNCTION IF EXISTS sb.set_participant_read(integer, integer);
CREATE OR REPLACE FUNCTION sb.set_participant_read(
	resource_id uuid,
	other_account_id uuid)
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

ALTER FUNCTION sb.set_participant_read(uuid, uuid)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.set_participant_read(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.set_participant_read(uuid, uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.set_participant_read(uuid, uuid) TO sb;


CREATE OR REPLACE FUNCTION sb.update_account(
	name character varying,
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
	SET name = update_account.name, avatar_image_id = (
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


CREATE OR REPLACE FUNCTION sb.update_account_email(
	new_email character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE current_email character varying;
DECLARE activation_code character varying;
DECLARE account_language character varying;
BEGIN
	SELECT a.email, a.language
	INTO current_email, account_language
	FROM sb.accounts_private_data a
	WHERE a.account_id = sb.current_account_id() AND
	-- Fail any attempt to change the email of an account linked to one or more extarnal auth provider
	(SELECT COUNT(*) FROM sb.external_auth_tokens eat WHERE eat.email = a.email) = 0;
	
	IF new_email IS NOT NULL AND new_email <> '' AND current_email <> LOWER(new_email) THEN
		SELECT array_to_string(ARRAY(SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
		INTO block.activation_code;
		
		INSERT INTO sb.email_activations (account_id, email, activation_code)
		VALUES (sb.current_account_id(), LOWER(new_email), block.activation_code);
		
		PERFORM sb.add_job('mailActivation', 
			json_build_object('email', LOWER(new_email), 'code', block.activation_code, 'lang', account_language));
	
	END IF;
	
	RETURN 1;
end;
$BODY$;


CREATE OR REPLACE FUNCTION sb.update_account_public_info(
	links account_link[],
	location new_location DEFAULT NULL::new_location)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
<<block>>
DECLARE location_id uuid;
DECLARE amount_tokens_to_add integer = 0;
BEGIN

	DELETE FROM sb.accounts_links
	WHERE account_id = sb.current_account_id();
	
	INSERT INTO sb.accounts_links(url, label, link_type_id, account_id)
	SELECT l.url, l.label, l.link_type_id, sb.current_account_id()
	FROM UNNEST(links) l;
	
	SELECT a.location_id INTO block.location_id
	FROM sb.accounts_public_data a
	WHERE id = sb.current_account_id();
	
	IF location IS NULL THEN
		IF block.location_id IS NOT NULL THEN
			UPDATE sb.accounts_public_data SET location_id = null WHERE id = sb.current_account_id();
			
			DELETE FROM sb.locations WHERE id = block.location_id;
		END IF;
	ELSE
		IF block.location_id IS NULL THEN
			INSERT INTO sb.locations (address, latitude, longitude)
			VALUES (location.address, location.latitude, location.longitude)
			RETURNING id INTO block.location_id;
			
			UPDATE sb.accounts_public_data SET location_id = block.location_id WHERE id = sb.current_account_id();
		ELSE
			UPDATE sb.locations SET address = location.address, latitude = location.latitude, longitude = location.longitude
			WHERE id = block.location_id;
		END IF;
	END IF;
	
	PERFORM sb.grant_applicable_rewards(false);
	
	PERFORM pg_notify('graphql:account_changed:' || sb.current_account_id(), json_build_object(
		'event', 'account_changed',
		'subject', sb.current_account_id()
	)::text);
	
	RETURN 1;
end;
$BODY$;


CREATE OR REPLACE FUNCTION sb.update_external_auth_status(
	email character varying,
	token character varying,
	auth_provider integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare account_id uuid;
declare current_token character varying;
begin
  SELECT a.account_id, eat.token INTO account_id, current_token
    FROM sb.accounts_private_data AS a
	LEFT JOIN sb.external_auth_tokens eat ON eat.email = a.email AND
		eat.auth_provider = update_external_auth_status.auth_provider
    WHERE a.email = LOWER(update_external_auth_status.email);

  IF account_id IS NOT NULL THEN
    IF current_token IS NULL THEN
		INSERT INTO sb.external_auth_tokens (email, token, auth_provider)
		VALUES (update_external_auth_status.email, update_external_auth_status.token, update_external_auth_status.auth_provider);
	ELSE
		UPDATE sb.external_auth_tokens eat
		SET token = update_external_auth_status.token, updated = now()
		WHERE eat.email = update_external_auth_status.email AND eat.auth_provider = update_external_auth_status.auth_provider;
	END IF;
	RETURN 2;
  ELSE
  	IF EXISTS(SELECT * FROM sb.external_auth_tokens eat WHERE eat.email = update_external_auth_status.email AND
		eat.auth_provider = update_external_auth_status.auth_provider) THEN
		UPDATE sb.external_auth_tokens eat
		SET token = update_external_auth_status.token, updated = now()
		WHERE eat.email = update_external_auth_status.email AND eat.auth_provider = update_external_auth_status.auth_provider;
	ELSE
		INSERT INTO sb.external_auth_tokens (email, token, auth_provider)
		VALUES (update_external_auth_status.email, update_external_auth_status.token, update_external_auth_status.auth_provider);
	END IF;
    RETURN 1;
  END IF;
end;
$BODY$;


DROP FUNCTION IF EXISTS sb.update_resource(integer, character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, integer);
CREATE OR REPLACE FUNCTION sb.update_resource(
	resource_id uuid,
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
	campaign_to_join uuid)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE ids_images_to_delete UUID[];
DECLARE location_id UUID = NULL;
DECLARE location_to_delete_id UUID = NULL;
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

ALTER FUNCTION sb.update_resource(uuid, character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, uuid)
    OWNER TO sb;

REVOKE ALL ON FUNCTION sb.update_resource(uuid, character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sb.update_resource(uuid, character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, uuid) TO identified_account;

GRANT EXECUTE ON FUNCTION sb.update_resource(uuid, character varying, character varying, timestamp with time zone, integer, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], integer[], new_location, uuid) TO sb;

CREATE OR REPLACE FUNCTION sb.suggested_resources(
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
			 sb.strict_word_similarity(a.name, search_term) > 0.8 OR
			a.name ILIKE '%' || search_term || '%' OR
			r.title ILIKE '%' || search_term || '%' OR
			r.description ILIKE '%' || search_term || '%'))
	  AND
	  (NOT suggested_resources.in_active_campaign OR suggested_resources.in_active_campaign IS NULL OR cr.id IS NOT NULL)
	  ORDER BY created DESC, r.expiration DESC
	  LIMIT 50;
END;
$BODY$;