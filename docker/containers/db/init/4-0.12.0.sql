ALTER TABLE IF EXISTS sb.campaigns
    ADD COLUMN summary character varying;

-- FUNCTION: sb.create_campaign(character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone)

DROP FUNCTION IF EXISTS sb.create_campaign(character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone);

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
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE inserted_id INTEGER;
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

GRANT EXECUTE ON FUNCTION sb.create_campaign(character varying, character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone) TO PUBLIC;

GRANT EXECUTE ON FUNCTION sb.create_campaign(character varying, character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone) TO admin;

GRANT EXECUTE ON FUNCTION sb.create_campaign(character varying, character varying, character varying, timestamp with time zone, integer, integer, integer[], timestamp with time zone, timestamp with time zone) TO sb;



DO
$body$
BEGIN
	UPDATE sb.system SET version = '0.12.0', minimum_client_version = '0.12.0';
END;
$body$
LANGUAGE 'plpgsql'; 