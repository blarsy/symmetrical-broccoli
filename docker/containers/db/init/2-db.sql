--
-- PostgreSQL database dump
--

-- Dumped from database version 15.3 (Debian 15.3-1.pgdg120+1)
-- Dumped by pg_dump version 15.4

-- Started on 2024-01-06 20:48:29 CET

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 7 (class 2615 OID 16388)
-- Name: sb; Type: SCHEMA; Schema: -; Owner: sb
--

CREATE SCHEMA sb;


ALTER SCHEMA sb OWNER TO sb;

--
-- TOC entry 935 (class 1247 OID 16428)
-- Name: jwt_token; Type: TYPE; Schema: sb; Owner: sb
--

CREATE TYPE sb.jwt_token AS (
	account_id integer,
	expiration integer,
	role text
);


ALTER TYPE sb.jwt_token OWNER TO sb;

--
-- TOC entry 938 (class 1247 OID 16431)
-- Name: session_data; Type: TYPE; Schema: sb; Owner: sb
--

CREATE TYPE sb.session_data AS (
	account_id integer,
	name character varying,
	email character varying,
	role character varying
);


ALTER TYPE sb.session_data OWNER TO sb;

--
-- TOC entry 318 (class 1255 OID 24939)
-- Name: add_job(text, json, text, timestamp with time zone, integer, text, integer, text[], text); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.add_job(identifier text, payload json DEFAULT NULL::json, queue_name text DEFAULT NULL::text, run_at timestamp with time zone DEFAULT NULL::timestamp with time zone, max_attempts integer DEFAULT NULL::integer, job_key text DEFAULT NULL::text, priority integer DEFAULT NULL::integer, flags text[] DEFAULT NULL::text[], job_key_mode text DEFAULT 'replace'::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
-- 	EXECUTE 'PERFORM worker.add_job(identifier, payload, queue_name, run_at, max_attempts, job_key, priority, flags, job_key_mode);';
 	PERFORM worker.add_job(identifier, payload, queue_name, run_at, max_attempts, job_key, priority, flags, job_key_mode);
END;
$$;


ALTER FUNCTION sb.add_job(identifier text, payload json, queue_name text, run_at timestamp with time zone, max_attempts integer, job_key text, priority integer, flags text[], job_key_mode text) OWNER TO sb;

--
-- TOC entry 305 (class 1255 OID 16434)
-- Name: authenticate(character varying, character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.authenticate(email character varying, password character varying) RETURNS sb.jwt_token
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare account_id INTEGER;
begin
  select a.id into account_id
    from sb.accounts as a
    where a.email = authenticate.email and a.hash = crypt(password, a.salt);

  if account_id IS NOT NULL then
    return (
      account_id,
      extract(epoch from now() + interval '10 day'),
      'identified_account'
    )::sb.jwt_token;
  else
    return null;
  end if;
end;
$$;


ALTER FUNCTION sb.authenticate(email character varying, password character varying) OWNER TO sb;

--
-- TOC entry 312 (class 1255 OID 16736)
-- Name: change_password(character varying, character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.change_password(old_password character varying, new_password character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE cnt numeric;
begin
	UPDATE sb.accounts a
	SET hash = phs.hash, salt = phs.salt
	FROM sb.get_password_hash_salt(new_password) phs
	WHERE id = sb.current_account_id() AND a.hash = crypt(old_password, a.salt);
	
	GET DIAGNOSTICS cnt = ROW_COUNT;
	
	IF cnt = 0 THEN
		RAISE EXCEPTION 'Invalid password';
	END IF;
	
	RETURN 1;
end;
$$;


ALTER FUNCTION sb.change_password(old_password character varying, new_password character varying) OWNER TO sb;

--
-- TOC entry 228 (class 1259 OID 16476)
-- Name: messages_id_seq; Type: SEQUENCE; Schema: sb; Owner: sb
--

CREATE SEQUENCE sb.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sb.messages_id_seq OWNER TO sb;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 16477)
-- Name: messages; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.messages (
    id integer DEFAULT nextval('sb.messages_id_seq'::regclass) NOT NULL,
    participant_id integer NOT NULL,
    text character varying NOT NULL,
    received timestamp without time zone,
    created timestamp without time zone DEFAULT now() NOT NULL,
    image_id integer
);


ALTER TABLE sb.messages OWNER TO sb;

--
-- TOC entry 308 (class 1255 OID 16602)
-- Name: conversation_messages(integer); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.conversation_messages(resource_id integer) RETURNS SETOF sb.messages
    LANGUAGE sql STABLE
    AS $$
	SELECT m.*
  	FROM sb.messages m
  	WHERE m.participant_id IN (
		SELECT p.id FROM sb.participants p
		WHERE p.conversation_id = (
			SELECT c.id FROM sb.conversations c
			WHERE c.resource_id = conversation_messages.resource_id AND EXISTS(
				SELECT * FROM sb.participants p2
				WHERE p2.conversation_id = c.id AND p2.account_id = sb.current_account_id()
			)
		)
	)
	ORDER BY m.created DESC
 
$$;


ALTER FUNCTION sb.conversation_messages(resource_id integer) OWNER TO sb;

--
-- TOC entry 283 (class 1255 OID 16613)
-- Name: create_image(character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.create_image(image_public_id character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE inserted_image_id INTEGER;
begin
	INSERT INTO sb.images (public_id)
	VALUES (image_public_id)
	RETURNING id AS inserted_image_id;
	
	RETURN inserted_image_id;
end;
$$;


ALTER FUNCTION sb.create_image(image_public_id character varying) OWNER TO sb;

--
-- TOC entry 313 (class 1255 OID 16608)
-- Name: create_message(integer, character varying, character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.create_message(resource_id integer, text character varying, image_public_id character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
<<block>>
DECLARE conversation_id INTEGER;
DECLARE created_message_id INTEGER = 0;
DECLARE inserted_image_id INTEGER;
DECLARE destinator_participant_id INTEGER;
DECLARE destinator_id INTEGER;

BEGIN
	SELECT c.id FROM sb.conversations c
	INTO conversation_id
	WHERE c.resource_id = create_message.resource_id AND EXISTS(
		SELECT * FROM sb.participants p
		WHERE p.conversation_id = c.id AND p.account_id = sb.current_account_id()
	);
	
	IF conversation_id IS NULL THEN
		INSERT INTO sb.conversations (resource_id)
		VALUES (create_message.resource_id)
		RETURNING id INTO conversation_id;
		
		INSERT INTO sb.participants (account_id, conversation_id)
		VALUES (sb.current_account_id(), block.conversation_id);
		INSERT INTO sb.participants (account_id, conversation_id)
		VALUES ((SELECT account_id FROM sb.resources r WHERE r.id = create_message.resource_id), block.conversation_id);
		
	END IF;
	
	IF create_message.image_public_id THEN
		INSERT INTO sb.images (public_id)
		VALUES (create_message.image_public_id)
		RETURNING id INTO inserted_image_id;
	END IF;
	
	INSERT INTO sb.messages(participant_id, text, image_id, received)
	SELECT (
			SELECT p.id FROM sb.participants p
			WHERE p.conversation_id = block.conversation_id AND account_id = sb.current_account_id()
	), create_message.text, inserted_image_id, null
	RETURNING id INTO created_message_id;
	
	SELECT p.id INTO destinator_participant_id FROM sb.participants p
	WHERE p.conversation_id = block.conversation_id AND p.account_id <> sb.current_account_id();
	
	INSERT INTO sb.unread_messages (participant_id, message_id)
	SELECT destinator_participant_id, created_message_id;
	
	UPDATE sb.conversations c SET last_message = created_message_id
	WHERE c.id = block.conversation_id;
	
	SELECT a.id INTO destinator_id FROM sb.accounts a
	INNER JOIN sb.participants p ON a.id = p.account_id
	WHERE p.id = destinator_participant_id;

	PERFORM pg_notify('graphql:message_account:' || destinator_id, json_build_object(
		'event', 'message_created',
		'subject', created_message_id
	)::text);
	
	RETURN created_message_id;
END;
$$;


ALTER FUNCTION sb.create_message(resource_id integer, text character varying, image_public_id character varying) OWNER TO sb;

--
-- TOC entry 301 (class 1255 OID 16435)
-- Name: create_resource(character varying, character varying, timestamp without time zone, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], character varying[]); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.create_resource(title character varying, description character varying, expiration timestamp without time zone, is_service boolean, is_product boolean, can_be_delivered boolean, can_be_taken_away boolean, can_be_exchanged boolean, can_be_gifted boolean, images_public_ids character varying[], category_codes character varying[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare inserted_id integer;
declare account_id integer;
begin
	INSERT INTO sb.resources(
	title, description, expiration, account_id, created, is_service, is_product, can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted)
	VALUES (create_resource.title, create_resource.description, create_resource.expiration, sb.current_account_id(),
			NOW(), create_resource.is_service, create_resource.is_product, create_resource.can_be_delivered,
			create_resource.can_be_taken_away, create_resource.can_be_exchanged, create_resource.can_be_gifted)
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
	
	RETURN inserted_id;
end;
$$;


ALTER FUNCTION sb.create_resource(title character varying, description character varying, expiration timestamp without time zone, is_service boolean, is_product boolean, can_be_delivered boolean, can_be_taken_away boolean, can_be_exchanged boolean, can_be_gifted boolean, images_public_ids character varying[], category_codes character varying[]) OWNER TO sb;

--
-- TOC entry 295 (class 1255 OID 16436)
-- Name: current_account_id(); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.current_account_id() RETURNS integer
    LANGUAGE sql
    AS $$
select nullif(current_setting('jwt.claims.account_id', true), '')::integer;
$$;


ALTER FUNCTION sb.current_account_id() OWNER TO sb;

--
-- TOC entry 296 (class 1255 OID 16437)
-- Name: current_role(); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb."current_role"() RETURNS text
    LANGUAGE sql
    AS $$select nullif(current_setting('jwt.claims.role', true), '')::text;$$;


ALTER FUNCTION sb."current_role"() OWNER TO sb;

--
-- TOC entry 297 (class 1255 OID 16438)
-- Name: delete_resource(integer); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.delete_resource(resource_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE ids_images_to_delete INTEGER[];
begin
	DELETE FROM sb.resources_resource_categories rrc WHERE rrc.resource_id = delete_resource.resource_id;
	
	ids_images_to_delete = ARRAY(
		SELECT image_id FROM sb.resources_images ri
		WHERE ri.resource_id = delete_resource.resource_id
	);
	
	DELETE FROM sb.resources_images ri WHERE ri.resource_id = delete_resource.resource_id;
	DELETE FROM sb.images i WHERE i.id IN (SELECT UNNEST(ids_images_to_delete));
	
	DELETE FROM sb.resources r
	WHERE r.id = delete_resource.resource_id;
	
	RETURN 1;
end;
$$;


ALTER FUNCTION sb.delete_resource(resource_id integer) OWNER TO sb;

--
-- TOC entry 298 (class 1255 OID 16439)
-- Name: get_password_hash_salt(character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.get_password_hash_salt(password character varying, OUT hash character varying, OUT salt character varying) RETURNS record
    LANGUAGE plpgsql
    AS $$BEGIN
	IF sb.is_password_valid(password) = FALSE THEN
		RAISE EXCEPTION 'Password invalid';
	ELSE
		SELECT gen_salt('md5') INTO salt;
		SELECT crypt(password, salt) INTO hash;
	END IF;
END;$$;


ALTER FUNCTION sb.get_password_hash_salt(password character varying, OUT hash character varying, OUT salt character varying) OWNER TO sb;

--
-- TOC entry 299 (class 1255 OID 16440)
-- Name: get_session_data(); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.get_session_data() RETURNS sb.session_data
    LANGUAGE sql STABLE
    AS $$
SELECT a.id, a.name, a.email, sb.current_role()
FROM sb.accounts a
WHERE a.id = (SELECT NULLIF(current_setting('jwt.claims.account_id', true), '')::integer)
$$;


ALTER FUNCTION sb.get_session_data() OWNER TO sb;

--
-- TOC entry 303 (class 1255 OID 16441)
-- Name: is_password_valid(character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.is_password_valid(password character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
	
	RETURN LENGTH(password) >= 8 AND regexp_count(password, '[A-Z0-9]') > 0 AND regexp_count(password, '[^\w]') > 0;
END;
$$;


ALTER FUNCTION sb.is_password_valid(password character varying) OWNER TO sb;

--
-- TOC entry 224 (class 1259 OID 16462)
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: sb; Owner: sb
--

CREATE SEQUENCE sb.conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sb.conversations_id_seq OWNER TO sb;

--
-- TOC entry 225 (class 1259 OID 16463)
-- Name: conversations; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.conversations (
    id integer DEFAULT nextval('sb.conversations_id_seq'::regclass) NOT NULL,
    resource_id integer NOT NULL,
    last_message integer,
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE sb.conversations OWNER TO sb;

--
-- TOC entry 302 (class 1255 OID 16644)
-- Name: my_conversations(); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.my_conversations() RETURNS SETOF sb.conversations
    LANGUAGE sql STABLE
    AS $$
	SELECT * FROM sb.conversations c
	WHERE EXISTS(
		SELECT * FROM sb.participants p
		WHERE p.conversation_id = c.id AND p.account_id = sb.current_account_id()
	);
 
$$;


ALTER FUNCTION sb.my_conversations() OWNER TO sb;

--
-- TOC entry 220 (class 1259 OID 16442)
-- Name: resources_id_seq; Type: SEQUENCE; Schema: sb; Owner: sb
--

CREATE SEQUENCE sb.resources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sb.resources_id_seq OWNER TO sb;

--
-- TOC entry 221 (class 1259 OID 16443)
-- Name: resources; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.resources (
    id integer DEFAULT nextval('sb.resources_id_seq'::regclass) NOT NULL,
    title character varying NOT NULL,
    description character varying NOT NULL,
    expiration timestamp without time zone NOT NULL,
    account_id integer NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    is_service boolean NOT NULL,
    is_product boolean NOT NULL,
    can_be_delivered boolean NOT NULL,
    can_be_taken_away boolean NOT NULL,
    can_be_exchanged boolean NOT NULL,
    can_be_gifted boolean NOT NULL
);


ALTER TABLE sb.resources OWNER TO sb;

--
-- TOC entry 300 (class 1255 OID 16450)
-- Name: myresources(); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.myresources() RETURNS SETOF sb.resources
    LANGUAGE sql STABLE
    AS $$
select r.*
  from sb.resources r
  where r.account_id = sb.current_account_id()
 
$$;


ALTER FUNCTION sb.myresources() OWNER TO sb;

--
-- TOC entry 310 (class 1255 OID 24928)
-- Name: recover_account(character varying, character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.recover_account(recovery_code character varying, new_password character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE code TEXT;
begin
	UPDATE sb.accounts SET hash = phs.hash, salt = phs.salt, recovery_code = null, recovery_code_expiration = null
	FROM sb.get_password_hash_salt(recover_account.new_password) phs
	WHERE accounts.recovery_code = recover_account.recovery_code AND recovery_code_expiration < NOW();
	
	RETURN 1;
end;
$$;


ALTER FUNCTION sb.recover_account(recovery_code character varying, new_password character varying) OWNER TO sb;

--
-- TOC entry 306 (class 1255 OID 16451)
-- Name: register_account(character varying, character varying, character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.register_account(name character varying, email character varying, password character varying) RETURNS sb.jwt_token
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare inserted_id integer;
declare hash character varying;
declare salt character varying;
begin
	IF sb.is_password_valid(register_account.password) = FALSE THEN
		RAISE EXCEPTION 'Password invalid';
	ELSE
		IF EXISTS(SELECT id FROM sb.accounts a WHERE a.email = register_account.email) THEN
			RAISE EXCEPTION 'Email is in use';
		END IF;
	END IF;
	
	INSERT INTO sb.accounts(
		name, email, hash, salt)
	SELECT register_account.name, register_account.email, phs.hash, phs.salt FROM sb.get_password_hash_salt(register_account.password) phs
	RETURNING id INTO inserted_id;
	
	RETURN (
		inserted_id,
		EXTRACT(epoch FROM now() + interval '10 day'),
		'identified_account'
    )::sb.jwt_token;
end;
$$;


ALTER FUNCTION sb.register_account(name character varying, email character varying, password character varying) OWNER TO sb;

--
-- TOC entry 309 (class 1255 OID 24927)
-- Name: request_account_recovery(character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.request_account_recovery(email character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE code TEXT;
begin
	SELECT array_to_string(array(select substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
	INTO code;
	
	UPDATE sb.accounts SET recovery_code = code, recovery_code_expiration = NOW() + interval '15 minutes'
	WHERE accounts.email = request_account_recovery.email;
	
	IF FOUND THEN
		PERFORM sb.add_job('mailPasswordRecovery', json_build_object('email', request_account_recovery.email, 'code', code));
	END IF;
	
	RETURN 1;
end;
$$;


ALTER FUNCTION sb.request_account_recovery(email character varying) OWNER TO sb;

--
-- TOC entry 307 (class 1255 OID 16452)
-- Name: suggested_resources(boolean, boolean, boolean, boolean, boolean, boolean, character varying[]); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.suggested_resources(is_product boolean, is_service boolean, can_be_gifted boolean, can_be_exchanged boolean, can_be_delivered boolean, can_be_taken_away boolean, category_codes character varying[]) RETURNS SETOF sb.resources
    LANGUAGE sql STABLE
    AS $$
SELECT r.*
  FROM sb.resources r
  WHERE (ARRAY_LENGTH(category_codes, 1) IS NULL OR EXISTS(
	  SELECT * 
	  FROM sb.resources_resource_categories rrc 
	  WHERE r.id = rrc.resource_id AND rrc.resource_category_code IN (SELECT UNNEST(category_codes))))
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
 
$$;


ALTER FUNCTION sb.suggested_resources(is_product boolean, is_service boolean, can_be_gifted boolean, can_be_exchanged boolean, can_be_delivered boolean, can_be_taken_away boolean, category_codes character varying[]) OWNER TO sb;

--
-- TOC entry 311 (class 1255 OID 16730)
-- Name: update_account(character varying, character varying); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.update_account(name character varying, email character varying) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
	UPDATE sb.accounts
	SET name = update_account.name, email = update_account.email
	WHERE id = sb.current_account_id();
	
	RETURN 1;
end;
$$;


ALTER FUNCTION sb.update_account(name character varying, email character varying) OWNER TO sb;

--
-- TOC entry 304 (class 1255 OID 16453)
-- Name: update_resource(integer, character varying, character varying, timestamp without time zone, boolean, boolean, boolean, boolean, boolean, boolean, character varying[], character varying[]); Type: FUNCTION; Schema: sb; Owner: sb
--

CREATE FUNCTION sb.update_resource(resource_id integer, title character varying, description character varying, expiration timestamp without time zone, is_service boolean, is_product boolean, can_be_delivered boolean, can_be_taken_away boolean, can_be_exchanged boolean, can_be_gifted boolean, images_public_ids character varying[], category_codes character varying[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE ids_images_to_delete INTEGER[];
begin
	UPDATE sb.resources r SET title = update_resource.title, description = update_resource.description, 
		expiration = update_resource.expiration, is_service = update_resource.is_service, 
		is_product = update_resource.is_product, can_be_delivered = update_resource.can_be_delivered, 
		can_be_taken_away = update_resource.can_be_taken_away, can_be_exchanged = update_resource.can_be_exchanged, 
		can_be_gifted = update_resource.can_be_gifted
	WHERE r.id = update_resource.resource_id;
	
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
	
	RETURN 1;
end;
$$;


ALTER FUNCTION sb.update_resource(resource_id integer, title character varying, description character varying, expiration timestamp without time zone, is_service boolean, is_product boolean, can_be_delivered boolean, can_be_taken_away boolean, can_be_exchanged boolean, can_be_gifted boolean, images_public_ids character varying[], category_codes character varying[]) OWNER TO sb;

--
-- TOC entry 222 (class 1259 OID 16454)
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: sb; Owner: sb
--

CREATE SEQUENCE sb.accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sb.accounts_id_seq OWNER TO sb;

--
-- TOC entry 223 (class 1259 OID 16455)
-- Name: accounts; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.accounts (
    id integer DEFAULT nextval('sb.accounts_id_seq'::regclass) NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    hash character varying NOT NULL,
    salt character varying NOT NULL,
    recovery_code character varying,
    recovery_code_expiration timestamp without time zone,
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE sb.accounts OWNER TO sb;

--
-- TOC entry 226 (class 1259 OID 16468)
-- Name: images_id_seq; Type: SEQUENCE; Schema: sb; Owner: sb
--

CREATE SEQUENCE sb.images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sb.images_id_seq OWNER TO sb;

--
-- TOC entry 227 (class 1259 OID 16469)
-- Name: images; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.images (
    id integer DEFAULT nextval('sb.images_id_seq'::regclass) NOT NULL,
    public_id character varying NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE sb.images OWNER TO sb;

--
-- TOC entry 230 (class 1259 OID 16484)
-- Name: participants_id_seq; Type: SEQUENCE; Schema: sb; Owner: sb
--

CREATE SEQUENCE sb.participants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sb.participants_id_seq OWNER TO sb;

--
-- TOC entry 231 (class 1259 OID 16485)
-- Name: participants; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.participants (
    id integer DEFAULT nextval('sb.participants_id_seq'::regclass) NOT NULL,
    account_id integer NOT NULL,
    conversation_id integer NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE sb.participants OWNER TO sb;

--
-- TOC entry 232 (class 1259 OID 16490)
-- Name: resource_categories; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.resource_categories (
    name character varying NOT NULL,
    locale character varying NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    code integer NOT NULL
);


ALTER TABLE sb.resource_categories OWNER TO sb;

--
-- TOC entry 233 (class 1259 OID 16496)
-- Name: resource_categories_id_seq; Type: SEQUENCE; Schema: sb; Owner: sb
--

CREATE SEQUENCE sb.resource_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sb.resource_categories_id_seq OWNER TO sb;

--
-- TOC entry 234 (class 1259 OID 16497)
-- Name: resources_images; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.resources_images (
    resource_id integer NOT NULL,
    image_id integer NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE sb.resources_images OWNER TO sb;

--
-- TOC entry 235 (class 1259 OID 16501)
-- Name: resources_resource_categories; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.resources_resource_categories (
    resource_id integer NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    resource_category_code character varying NOT NULL
);


ALTER TABLE sb.resources_resource_categories OWNER TO sb;

--
-- TOC entry 236 (class 1259 OID 16617)
-- Name: unread_messages; Type: TABLE; Schema: sb; Owner: sb
--

CREATE TABLE sb.unread_messages (
    participant_id integer NOT NULL,
    message_id integer NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE sb.unread_messages OWNER TO sb;

--
-- TOC entry 3364 (class 2606 OID 16508)
-- Name: accounts accounts_pk; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.accounts
    ADD CONSTRAINT accounts_pk PRIMARY KEY (id);


--
-- TOC entry 3378 (class 2606 OID 16510)
-- Name: resource_categories code_locale_unique; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.resource_categories
    ADD CONSTRAINT code_locale_unique UNIQUE (locale, code);


--
-- TOC entry 3370 (class 2606 OID 16512)
-- Name: conversations conversations_pk; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.conversations
    ADD CONSTRAINT conversations_pk PRIMARY KEY (id);


--
-- TOC entry 3366 (class 2606 OID 16514)
-- Name: accounts email_unique; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.accounts
    ADD CONSTRAINT email_unique UNIQUE (email);


--
-- TOC entry 3372 (class 2606 OID 16516)
-- Name: images images_pkey; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- TOC entry 3374 (class 2606 OID 16518)
-- Name: messages messages_pk; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.messages
    ADD CONSTRAINT messages_pk PRIMARY KEY (id);


--
-- TOC entry 3368 (class 2606 OID 16520)
-- Name: accounts name_unique; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.accounts
    ADD CONSTRAINT name_unique UNIQUE (name);


--
-- TOC entry 3376 (class 2606 OID 16522)
-- Name: participants participants_pk; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.participants
    ADD CONSTRAINT participants_pk PRIMARY KEY (id);


--
-- TOC entry 3380 (class 2606 OID 16524)
-- Name: resource_categories resource_categories_pkey; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.resource_categories
    ADD CONSTRAINT resource_categories_pkey PRIMARY KEY (locale, code);


--
-- TOC entry 3362 (class 2606 OID 16526)
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- TOC entry 3382 (class 2606 OID 16622)
-- Name: unread_messages unread_unique; Type: CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.unread_messages
    ADD CONSTRAINT unread_unique UNIQUE (participant_id, message_id);


--
-- TOC entry 3384 (class 2606 OID 16527)
-- Name: conversations conversations_messages_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.conversations
    ADD CONSTRAINT conversations_messages_fk FOREIGN KEY (last_message) REFERENCES sb.messages(id) NOT VALID;


--
-- TOC entry 3385 (class 2606 OID 16532)
-- Name: conversations conversations_resources_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.conversations
    ADD CONSTRAINT conversations_resources_fk FOREIGN KEY (resource_id) REFERENCES sb.resources(id) NOT VALID;


--
-- TOC entry 3386 (class 2606 OID 16603)
-- Name: messages messages_images_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.messages
    ADD CONSTRAINT messages_images_fk FOREIGN KEY (image_id) REFERENCES sb.images(id) NOT VALID;


--
-- TOC entry 3387 (class 2606 OID 16537)
-- Name: messages messages_participants_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.messages
    ADD CONSTRAINT messages_participants_fk FOREIGN KEY (participant_id) REFERENCES sb.participants(id) NOT VALID;


--
-- TOC entry 3388 (class 2606 OID 16542)
-- Name: participants participants_accounts_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.participants
    ADD CONSTRAINT participants_accounts_fk FOREIGN KEY (account_id) REFERENCES sb.accounts(id) NOT VALID;


--
-- TOC entry 3389 (class 2606 OID 16547)
-- Name: participants participants_conversations_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.participants
    ADD CONSTRAINT participants_conversations_fk FOREIGN KEY (conversation_id) REFERENCES sb.conversations(id) NOT VALID;


--
-- TOC entry 3383 (class 2606 OID 16552)
-- Name: resources resource_account_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.resources
    ADD CONSTRAINT resource_account_fk FOREIGN KEY (account_id) REFERENCES sb.accounts(id) NOT VALID;


--
-- TOC entry 3392 (class 2606 OID 16557)
-- Name: resources_resource_categories resource_categories_resource_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.resources_resource_categories
    ADD CONSTRAINT resource_categories_resource_fk FOREIGN KEY (resource_id) REFERENCES sb.resources(id) NOT VALID;


--
-- TOC entry 3390 (class 2606 OID 16562)
-- Name: resources_images resource_images_images_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.resources_images
    ADD CONSTRAINT resource_images_images_fk FOREIGN KEY (image_id) REFERENCES sb.images(id) NOT VALID;


--
-- TOC entry 3391 (class 2606 OID 16567)
-- Name: resources_images resource_images_resource_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.resources_images
    ADD CONSTRAINT resource_images_resource_fk FOREIGN KEY (resource_id) REFERENCES sb.resources(id) NOT VALID;


--
-- TOC entry 3393 (class 2606 OID 16628)
-- Name: unread_messages unread_messages_messages_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.unread_messages
    ADD CONSTRAINT unread_messages_messages_fk FOREIGN KEY (message_id) REFERENCES sb.messages(id) NOT VALID;


--
-- TOC entry 3394 (class 2606 OID 16623)
-- Name: unread_messages unread_messages_participants_fk; Type: FK CONSTRAINT; Schema: sb; Owner: sb
--

ALTER TABLE ONLY sb.unread_messages
    ADD CONSTRAINT unread_messages_participants_fk FOREIGN KEY (participant_id) REFERENCES sb.participants(id) NOT VALID;


--
-- TOC entry 3543 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA sb; Type: ACL; Schema: -; Owner: sb
--

GRANT USAGE ON SCHEMA sb TO anonymous;
GRANT USAGE ON SCHEMA sb TO identified_account;


--
-- TOC entry 3544 (class 0 OID 0)
-- Dependencies: 305
-- Name: FUNCTION authenticate(email character varying, password character varying); Type: ACL; Schema: sb; Owner: sb
--

GRANT ALL ON FUNCTION sb.authenticate(email character varying, password character varying) TO anonymous;


--
-- TOC entry 3545 (class 0 OID 0)
-- Dependencies: 228
-- Name: SEQUENCE messages_id_seq; Type: ACL; Schema: sb; Owner: sb
--

GRANT USAGE ON SEQUENCE sb.messages_id_seq TO identified_account;


--
-- TOC entry 3546 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE messages; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE sb.messages TO identified_account;


--
-- TOC entry 3547 (class 0 OID 0)
-- Dependencies: 313
-- Name: FUNCTION create_message(resource_id integer, text character varying, image_public_id character varying); Type: ACL; Schema: sb; Owner: sb
--

GRANT ALL ON FUNCTION sb.create_message(resource_id integer, text character varying, image_public_id character varying) TO identified_account;


--
-- TOC entry 3548 (class 0 OID 0)
-- Dependencies: 224
-- Name: SEQUENCE conversations_id_seq; Type: ACL; Schema: sb; Owner: sb
--

GRANT USAGE ON SEQUENCE sb.conversations_id_seq TO identified_account;


--
-- TOC entry 3549 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE conversations; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE sb.conversations TO identified_account;


--
-- TOC entry 3550 (class 0 OID 0)
-- Dependencies: 220
-- Name: SEQUENCE resources_id_seq; Type: ACL; Schema: sb; Owner: sb
--

GRANT USAGE ON SEQUENCE sb.resources_id_seq TO identified_account;


--
-- TOC entry 3551 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE resources; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE sb.resources TO identified_account;


--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 300
-- Name: FUNCTION myresources(); Type: ACL; Schema: sb; Owner: sb
--

GRANT ALL ON FUNCTION sb.myresources() TO identified_account;


--
-- TOC entry 3553 (class 0 OID 0)
-- Dependencies: 310
-- Name: FUNCTION recover_account(recovery_code character varying, new_password character varying); Type: ACL; Schema: sb; Owner: sb
--

GRANT ALL ON FUNCTION sb.recover_account(recovery_code character varying, new_password character varying) TO anonymous;


--
-- TOC entry 3554 (class 0 OID 0)
-- Dependencies: 306
-- Name: FUNCTION register_account(name character varying, email character varying, password character varying); Type: ACL; Schema: sb; Owner: sb
--

GRANT ALL ON FUNCTION sb.register_account(name character varying, email character varying, password character varying) TO anonymous;


--
-- TOC entry 3555 (class 0 OID 0)
-- Dependencies: 309
-- Name: FUNCTION request_account_recovery(email character varying); Type: ACL; Schema: sb; Owner: sb
--

GRANT ALL ON FUNCTION sb.request_account_recovery(email character varying) TO anonymous;


--
-- TOC entry 3556 (class 0 OID 0)
-- Dependencies: 307
-- Name: FUNCTION suggested_resources(is_product boolean, is_service boolean, can_be_gifted boolean, can_be_exchanged boolean, can_be_delivered boolean, can_be_taken_away boolean, category_codes character varying[]); Type: ACL; Schema: sb; Owner: sb
--

GRANT ALL ON FUNCTION sb.suggested_resources(is_product boolean, is_service boolean, can_be_gifted boolean, can_be_exchanged boolean, can_be_delivered boolean, can_be_taken_away boolean, category_codes character varying[]) TO identified_account;


--
-- TOC entry 3557 (class 0 OID 0)
-- Dependencies: 222
-- Name: SEQUENCE accounts_id_seq; Type: ACL; Schema: sb; Owner: sb
--

GRANT USAGE ON SEQUENCE sb.accounts_id_seq TO identified_account;


--
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE accounts; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE sb.accounts TO identified_account;


--
-- TOC entry 3559 (class 0 OID 0)
-- Dependencies: 226
-- Name: SEQUENCE images_id_seq; Type: ACL; Schema: sb; Owner: sb
--

GRANT USAGE ON SEQUENCE sb.images_id_seq TO identified_account;


--
-- TOC entry 3560 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE images; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE sb.images TO identified_account;


--
-- TOC entry 3561 (class 0 OID 0)
-- Dependencies: 230
-- Name: SEQUENCE participants_id_seq; Type: ACL; Schema: sb; Owner: sb
--

GRANT USAGE ON SEQUENCE sb.participants_id_seq TO identified_account;


--
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE participants; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE sb.participants TO identified_account;


--
-- TOC entry 3563 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE resource_categories; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT ON TABLE sb.resource_categories TO identified_account;


--
-- TOC entry 3564 (class 0 OID 0)
-- Dependencies: 233
-- Name: SEQUENCE resource_categories_id_seq; Type: ACL; Schema: sb; Owner: sb
--

GRANT USAGE ON SEQUENCE sb.resource_categories_id_seq TO identified_account;


--
-- TOC entry 3565 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE resources_images; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE sb.resources_images TO identified_account;


--
-- TOC entry 3566 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE resources_resource_categories; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE sb.resources_resource_categories TO identified_account;


--
-- TOC entry 3567 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE unread_messages; Type: ACL; Schema: sb; Owner: sb
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE sb.unread_messages TO identified_account;


-- Completed on 2024-01-06 20:48:29 CET

--
-- PostgreSQL database dump complete
--

