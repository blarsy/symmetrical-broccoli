
CREATE OR REPLACE FUNCTION sb.authenticate(
	email character varying,
	password character varying)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare account_id INTEGER;
begin
  select a.id into account_id
    from sb.accounts as a
    where a.email = LOWER(authenticate.email) and a.hash = crypt(password, a.salt);

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
$BODY$;


CREATE OR REPLACE FUNCTION sb.register_account(
	name character varying,
	email character varying,
	password character varying)
    RETURNS jwt_token
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
declare inserted_id integer;
declare hash character varying;
declare salt character varying;
begin
	IF sb.is_password_valid(register_account.password) = FALSE THEN
		RAISE EXCEPTION 'Password invalid';
	ELSE
		IF EXISTS(SELECT id FROM sb.accounts a WHERE a.email = LOWER(register_account.email)) THEN
			RAISE EXCEPTION 'Email is in use';
		END IF;
	END IF;
	
	INSERT INTO sb.accounts(
		name, email, hash, salt)
	SELECT register_account.name, LOWER(register_account.email), phs.hash, phs.salt FROM sb.get_password_hash_salt(register_account.password) phs
	RETURNING id INTO inserted_id;
	
	RETURN (
		inserted_id,
		EXTRACT(epoch FROM now() + interval '100 day'),
		'identified_account'
    )::sb.jwt_token;
end;
$BODY$;


CREATE OR REPLACE FUNCTION sb.update_account(
	name character varying,
	email character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
begin
	UPDATE sb.accounts
	SET name = update_account.name, email = LOWER(update_account.email)
	WHERE id = sb.current_account_id();
	
	RETURN 1;
end;
$BODY$;


CREATE OR REPLACE FUNCTION sb.request_account_recovery(
	email character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE code TEXT;
begin
	SELECT array_to_string(array(select substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',((random()*(36-1)+1)::integer),1) FROM generate_series(1,32)),'')
	INTO code;
	
	UPDATE sb.accounts SET recovery_code = code, recovery_code_expiration = NOW() + interval '15 minutes'
	WHERE accounts.email = LOWER(request_account_recovery.email);
	
	IF FOUND THEN
		PERFORM sb.add_job('mailPasswordRecovery', json_build_object('email', LOWER(request_account_recovery.email), 'code', code));
	END IF;
	
	RETURN 1;
end;
$BODY$;

