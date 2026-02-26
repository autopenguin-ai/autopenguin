


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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "public"."app_role" AS ENUM (
    'ADMIN',
    'EMPLOYEE',
    'FREELANCER',
    'SUPER_ADMIN',
    'MANAGER',
    'ACCOUNTANT'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_subscribe_waitlist_to_newsletter"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert into newsletter_subscriptions (ignore if already exists)
  INSERT INTO newsletter_subscriptions (email, source, is_active)
  VALUES (NEW.email, 'waitlist_auto_subscribe', true)
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_subscribe_waitlist_to_newsletter"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_deleted_conversations"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN
    DELETE FROM steve_conversations
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '7 days';
  END;
  $$;


ALTER FUNCTION "public"."cleanup_deleted_conversations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_vault_secret"("name" "text", "secret" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Use vault.create_secret to store the secret and return its id
  SELECT vault.create_secret(secret, name) INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."create_vault_secret"("name" "text", "secret" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_vault_secret"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
BEGIN
  DELETE FROM vault.secrets WHERE vault.secrets.id = p_id;
END;
$$;


ALTER FUNCTION "public"."delete_vault_secret"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_vault_secret_by_name"("p_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
BEGIN
  DELETE FROM vault.secrets WHERE name = p_name;
END;
$$;


ALTER FUNCTION "public"."delete_vault_secret_by_name"("p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_company_name"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public, extensions'
    AS $$
DECLARE
  new_name text;
  name_exists boolean;
BEGIN
  LOOP
    -- Generate 12-digit mixed-case alphanumeric
    new_name := substring(encode(extensions.gen_random_bytes(8), 'hex') from 1 for 12);
    
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE name = new_name) INTO name_exists;
    IF NOT name_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_name;
END;
$$;


ALTER FUNCTION "public"."generate_company_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_company_short_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public, extensions'
    AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := upper(substring(encode(extensions.gen_random_bytes(3), 'hex') from 1 for 4));
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE short_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_company_short_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invitation_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN upper(substring(encode(gen_random_bytes(16), 'hex') from 1 for 12));
END;
$$;


ALTER FUNCTION "public"."generate_invitation_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"("p_company_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE company_id = p_company_id;
  RETURN 'INV-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;


ALTER FUNCTION "public"."generate_invoice_number"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_colleagues"() RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "role" "public"."app_role", "is_active" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT p.id, p.first_name, p.last_name, p.role, p.is_active
  FROM profiles p
  WHERE p.company_id = get_user_company_id()
    AND p.is_active = true
    AND (has_role('EMPLOYEE'::app_role) OR has_role('FREELANCER'::app_role) OR has_role('ADMIN'::app_role));
$$;


ALTER FUNCTION "public"."get_company_colleagues"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_integration_api_key"("p_company_id" "uuid", "p_integration_type" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
DECLARE
  v_vault_secret_id uuid;
  v_decrypted_key text;
BEGIN
  -- Get vault secret ID
  SELECT vault_secret_id INTO v_vault_secret_id
  FROM company_integrations
  WHERE company_id = p_company_id 
    AND integration_type = p_integration_type
    AND is_active = true;
  
  IF v_vault_secret_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Retrieve decrypted secret from Vault
  SELECT decrypted_secret INTO v_decrypted_key
  FROM vault.decrypted_secrets
  WHERE id = v_vault_secret_id;
  
  RETURN v_decrypted_key;
END;
$$;


ALTER FUNCTION "public"."get_integration_api_key"("p_company_id" "uuid", "p_integration_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_integration_api_key"("p_company_id" "uuid", "p_integration_type" "text") IS 'Securely retrieves decrypted API key from Vault for a company integration. Used by edge functions to access third-party APIs without exposing keys.';



CREATE OR REPLACE FUNCTION "public"."get_user_company_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_user_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_admin_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Auto-confirm the super admin email and set as ADMIN
  -- Configure via: ALTER SYSTEM SET app.super_admin_email = 'you@example.com';
  -- Or in Supabase Dashboard: Database Settings → Custom Postgres Config
  -- If not set, current_setting returns NULL so no one auto-gets SUPER_ADMIN (safe default)
  IF NEW.email = current_setting('app.super_admin_email', true) THEN
    -- Update the auth.users record to mark email as confirmed
    UPDATE auth.users 
    SET email_confirmed_at = now(), 
        email_confirmed_at = now()
    WHERE id = NEW.id;
    
    -- Update profile to set as ADMIN
    UPDATE public.profiles 
    SET role = 'ADMIN'
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_domain text;
  existing_company_id uuid;
  new_company_id uuid;
  user_role app_role;
  company_name_input text;
  invitation_code_input text;
  invitation_record record;
  is_personal_email boolean;
BEGIN
  -- Extract domain from email
  user_domain := split_part(NEW.email, '@', 2);
  
  -- Get company name and invitation code from metadata
  company_name_input := NEW.raw_user_meta_data ->> 'company_name';
  invitation_code_input := NEW.raw_user_meta_data ->> 'invitation_code';
  
  -- Check if this is a personal email domain
  is_personal_email := user_domain IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com');
  
  -- Handle invitation code
  IF invitation_code_input IS NOT NULL AND invitation_code_input != '' THEN
    -- Look for valid invitation
    SELECT * INTO invitation_record 
    FROM public.invitations 
    WHERE invitation_code = invitation_code_input 
      AND email = NEW.email 
      AND expires_at > now() 
      AND used_at IS NULL;
      
    IF invitation_record IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired invitation code';
    END IF;
    
    -- Use invitation details
    existing_company_id := invitation_record.company_id;
    user_role := invitation_record.role;
    
    -- Mark invitation as used
    UPDATE public.invitations 
    SET used_at = now() 
    WHERE id = invitation_record.id;
    
  ELSE
    -- No invitation code provided
    
    -- Check if company exists
    IF company_name_input IS NOT NULL AND company_name_input != '' THEN
      -- User provided explicit company name
      SELECT id INTO existing_company_id 
      FROM public.companies 
      WHERE LOWER(name) = LOWER(company_name_input) OR LOWER(display_name) = LOWER(company_name_input);
    ELSE
      -- Use domain-based detection (only for corporate emails)
      IF NOT is_personal_email THEN
        SELECT id INTO existing_company_id 
        FROM public.companies 
        WHERE domain = user_domain;
      END IF;
    END IF;
    
    -- If company exists, block unauthorized access
    IF existing_company_id IS NOT NULL THEN
      -- For existing companies, require invitation or create user request
      IF is_personal_email OR (company_name_input IS NOT NULL AND company_name_input != '') THEN
        -- Personal email or explicit company name - create user request for admin approval
        INSERT INTO public.user_requests (company_id, email, first_name, last_name)
        VALUES (
          existing_company_id,
          NEW.email,
          NEW.raw_user_meta_data ->> 'first_name',
          NEW.raw_user_meta_data ->> 'last_name'
        );
        RAISE EXCEPTION 'Company exists. Request sent to admin for approval.';
      ELSE
        -- Corporate email matching company domain - allow but make employee
        user_role := 'EMPLOYEE'::app_role;
      END IF;
    ELSE
      -- No company exists - create new company (except for super admin)
      IF NEW.email != current_setting('app.super_admin_email', true) THEN
        INSERT INTO public.companies (name, display_name, domain)
        VALUES (
          COALESCE(LOWER(company_name_input), LOWER(split_part(user_domain, '.', 1))),
          COALESCE(company_name_input, split_part(user_domain, '.', 1)),
          CASE WHEN is_personal_email OR company_name_input IS NOT NULL THEN NULL ELSE user_domain END
        )
        RETURNING id INTO new_company_id;
        existing_company_id := new_company_id;
        user_role := 'ADMIN'::app_role; -- First user becomes admin
      END IF;
    END IF;
  END IF;
  
  -- Handle super admin (configured via app.super_admin_email Postgres setting)
  IF NEW.email = current_setting('app.super_admin_email', true) THEN
    user_role := 'SUPER_ADMIN'::app_role;
    existing_company_id := (SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1);
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role, company_id, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    user_role,
    existing_company_id,
    'ACTIVE'
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_exact_role"("_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = _role
  );
$$;


ALTER FUNCTION "public"."has_exact_role"("_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = _role
  );
$$;


ALTER FUNCTION "public"."has_role"("_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  );
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."read_vault_secret"("p_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
  DECLARE
    v_secret text;
  BEGIN
    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE id = p_id;
    RETURN v_secret;
  END;
  $$;


ALTER FUNCTION "public"."read_vault_secret"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_outcome_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.70, "match_count" integer DEFAULT 3, "filter_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "metric_key" "text", "description" "text", "language" "text", "similarity" double precision, "usage_count" integer, "average_similarity" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ote.id,
    ote.metric_key,
    ote.description,
    ote.language,
    1 - (ote.embedding <=> query_embedding) AS similarity,
    ote.usage_count,
    ote.average_similarity
  FROM outcome_type_embeddings ote
  WHERE
    (ote.company_id IS NULL OR ote.company_id = filter_company_id)
    AND 1 - (ote.embedding <=> query_embedding) > match_threshold
  ORDER BY ote.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."search_outcome_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_steve_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.7, "match_count" integer DEFAULT 5, "filter_company_id" "uuid" DEFAULT NULL::"uuid", "filter_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "title" "text", "content" "text", "category" "text", "similarity" double precision, "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    1 - (kb.embedding <=> query_embedding) AS similarity,
    kb.metadata
  FROM steve_knowledge_base kb
  WHERE
    (kb.company_id IS NULL OR kb.company_id = filter_company_id) AND
    (kb.user_id IS NULL OR kb.user_id = filter_user_id) AND
    1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."search_steve_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_company_id" "uuid", "filter_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_company_short_code"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public, extensions'
    AS $$
BEGIN
  IF NEW.short_code IS NULL THEN
    NEW.short_code := public.generate_company_short_code();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_company_short_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_public_reviews"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert sanitized data into public_reviews table
  INSERT INTO public.public_reviews (id, rating, review_text, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.rating,
    NEW.review_text,
    CASE 
      WHEN LENGTH(NEW.name) > 2 THEN LEFT(NEW.name, 2) || '***'
      ELSE '***'
    END,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    rating = EXCLUDED.rating,
    review_text = EXCLUDED.review_text,
    display_name = EXCLUDED.display_name;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_public_reviews"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_property_deal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- If property status changed from AVAILABLE to RENTED or SOLD, track as deal won and revenue
  IF OLD.status = 'AVAILABLE' AND NEW.status IN ('RENTED', 'SOLD') THEN
    -- Track deal won
    INSERT INTO automation_outcomes (
      metric_key, 
      metric_value, 
      description, 
      entity_type, 
      entity_id
    ) VALUES (
      'deals_won', 
      1, 
      'Property status changed from AVAILABLE to ' || NEW.status, 
      'property', 
      NEW.id
    );
    
    -- Track revenue based on property type
    IF NEW.price IS NOT NULL AND NEW.price > 0 THEN
      INSERT INTO automation_outcomes (
        metric_key, 
        metric_value, 
        description, 
        entity_type, 
        entity_id
      ) VALUES (
        CASE 
          WHEN NEW.status = 'RENTED' THEN 'rent_revenue'
          WHEN NEW.status = 'SOLD' THEN 'sale_revenue'
        END,
        NEW.price, 
        'Revenue from property ' || COALESCE(NEW.title, 'Unknown') || ' - ' || NEW.status, 
        'property', 
        NEW.id
      );
    END IF;
  END IF;
  
  -- Track price changes for existing RENTED/SOLD properties
  IF OLD.status IN ('RENTED', 'SOLD') AND NEW.status IN ('RENTED', 'SOLD') AND 
     (OLD.price IS DISTINCT FROM NEW.price) AND NEW.price IS NOT NULL AND NEW.price > 0 THEN
    INSERT INTO automation_outcomes (
      metric_key, 
      metric_value, 
      description, 
      entity_type, 
      entity_id
    ) VALUES (
      CASE 
        WHEN NEW.status = 'RENTED' THEN 'rent_revenue'
        WHEN NEW.status = 'SOLD' THEN 'sale_revenue'
      END,
      NEW.price, 
      'Updated revenue from property ' || COALESCE(NEW.title, 'Unknown') || ' - price changed from ' || 
      COALESCE(OLD.price::text, 'NULL') || ' to ' || NEW.price::text, 
      'property', 
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_property_deal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_on_action"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE steve_conversations 
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_on_action"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_owns_or_assigned"("owner_id" "uuid", "assignee_ids" "uuid"[]) RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_company_id uuid;
  assignee_company_id uuid;
  is_admin boolean;
BEGIN
  -- Get current user's company
  SELECT company_id INTO current_user_company_id
  FROM profiles
  WHERE user_id = auth.uid();
  
  -- Check if user is admin (admins can bypass some checks)
  SELECT public.has_role('ADMIN'::app_role) INTO is_admin;
  
  -- Direct ownership check
  IF auth.uid() = owner_id THEN
    RETURN TRUE;
  END IF;
  
  -- Admin override
  IF is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Assignee check WITH company validation
  IF auth.uid() = ANY(COALESCE(assignee_ids, '{}')) THEN
    -- Verify ALL assignees belong to the same company as current user
    -- This prevents cross-company privilege escalation
    FOR assignee_company_id IN 
      SELECT DISTINCT company_id 
      FROM profiles 
      WHERE user_id = ANY(assignee_ids)
    LOOP
      IF assignee_company_id != current_user_company_id THEN
        -- Cross-company assignment detected - reject
        RETURN FALSE;
      END IF;
    END LOOP;
    
    -- All assignees are in same company, allow access
    RETURN TRUE;
  END IF;
  
  -- No match found
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."user_owns_or_assigned"("owner_id" "uuid", "assignee_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_owns_or_assigned"("owner_id" "uuid", "assignee_ids" "uuid"[]) IS 'Checks if current user owns or is assigned to a resource. Validates that all assignees belong to the same company to prevent cross-company privilege escalation.';



CREATE OR REPLACE FUNCTION "public"."validate_assignees_same_company"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  assignee_company_id uuid;
BEGIN
  -- Validate all assignees belong to the same company as the resource
  FOR assignee_company_id IN 
    SELECT DISTINCT company_id 
    FROM profiles 
    WHERE user_id = ANY(NEW.assignee_ids)
  LOOP
    IF assignee_company_id != NEW.company_id THEN
      RAISE EXCEPTION 'Cannot assign users from different companies. Assignee company: %, Resource company: %', 
        assignee_company_id, NEW.company_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_assignees_same_company"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "table_name" "text" NOT NULL,
    "record_id" "uuid",
    "action" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid"
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_outcomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_run_id" "uuid",
    "metric_key" "text" NOT NULL,
    "metric_value" numeric(15,2) NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid",
    "status" "text" DEFAULT 'confirmed'::"text",
    "confidence" numeric(3,2),
    "detection_layer" "text",
    CONSTRAINT "automation_outcomes_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'pending_review'::"text"])))
);


ALTER TABLE "public"."automation_outcomes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "talent_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "project_id" "uuid",
    "booking_type" "text",
    "date" "date",
    "duration" "text",
    "fee" numeric,
    "payment_status" "text" DEFAULT 'pending'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bug_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "severity" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'new'::"text",
    "browser_info" "text",
    "page_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bug_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "company" "text",
    "notes" "text",
    "owner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_type" "text" DEFAULT 'INDIVIDUAL'::"text",
    "status" "text" DEFAULT 'ACTIVE'::"text",
    "preferred_contact_method" "text" DEFAULT 'EMAIL'::"text",
    "address" "text",
    "city" "text",
    "district" "text",
    "postal_code" "text",
    "company_id" "uuid" NOT NULL,
    "lead_stage" "text" DEFAULT 'NONE'::"text",
    "lead_source" "text",
    "lead_priority" "text" DEFAULT 'MEDIUM'::"text",
    "value_estimate" numeric,
    "property_id" "uuid",
    "created_by_automation" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."clients" REPLICA IDENTITY FULL;


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clients"."client_type" IS 'Type of client: INDIVIDUAL, COMPANY, INVESTOR, etc.';



COMMENT ON COLUMN "public"."clients"."status" IS 'Client status: ACTIVE, INACTIVE, PROSPECT, etc.';



COMMENT ON COLUMN "public"."clients"."preferred_contact_method" IS 'Preferred contact method: EMAIL, PHONE, SMS, etc.';



COMMENT ON COLUMN "public"."clients"."lead_stage" IS 'Lead stage: NEW, CONTACTED, QUALIFIED, NEGOTIATION, WON, LOST, NONE';



COMMENT ON COLUMN "public"."clients"."lead_source" IS 'Source where the lead came from';



COMMENT ON COLUMN "public"."clients"."lead_priority" IS 'Priority level: LOW, MEDIUM, HIGH';



COMMENT ON COLUMN "public"."clients"."value_estimate" IS 'Estimated deal value';



COMMENT ON COLUMN "public"."clients"."property_id" IS 'Optional link to property of interest';



COMMENT ON COLUMN "public"."clients"."created_by_automation" IS 'Whether this contact was created by automation';



CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text",
    "domain" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "short_code" "text" DEFAULT "public"."generate_company_short_code"() NOT NULL
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "integration_type" "text" NOT NULL,
    "api_url" "text" NOT NULL,
    "api_key" "text",
    "is_active" boolean DEFAULT true,
    "last_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "vault_secret_id" "uuid",
    CONSTRAINT "company_integrations_integration_type_check" CHECK (("integration_type" = ANY (ARRAY['n8n'::"text", 'make'::"text"])))
);


ALTER TABLE "public"."company_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "company" "text",
    "position" "text",
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'NEW'::"text" NOT NULL,
    "company_id" "uuid",
    "contact_method" "text",
    CONSTRAINT "contact_submissions_contact_method_check" CHECK (("contact_method" = ANY (ARRAY['email'::"text", 'phone'::"text", 'whatsapp'::"text"]))),
    CONSTRAINT "contact_submissions_status_check" CHECK (("status" = ANY (ARRAY['NEW'::"text", 'CONTACTED'::"text", 'RESOLVED'::"text"])))
);


ALTER TABLE "public"."contact_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "n8n_execution_id" "text",
    "message_type" "text" DEFAULT 'CHAT'::"text" NOT NULL,
    "content" "text" NOT NULL,
    "is_outgoing" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'SENT'::"text",
    "workflow_name" "text",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."conversation_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversation_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "contact_email" "text",
    "contact_name" "text",
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "summary" "text" NOT NULL,
    "key_points" "jsonb" DEFAULT '[]'::"jsonb",
    "next_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversation_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "n8n_execution_id" "text" NOT NULL,
    "contact_name" "text" NOT NULL,
    "contact_email" "text",
    "contact_phone" "text",
    "contact_info" "text",
    "last_message" "text",
    "last_message_timestamp" timestamp with time zone,
    "unread_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."conversations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "lead_id" "uuid",
    "property_id" "uuid",
    "client_id" "uuid",
    "deal_value" numeric(15,2) NOT NULL,
    "probability" integer DEFAULT 50 NOT NULL,
    "status" "text" DEFAULT 'OPEN'::"text" NOT NULL,
    "expected_close_date" "date",
    "actual_close_date" "date",
    "commission_rate" numeric(5,2) DEFAULT 2.5,
    "notes" "text",
    "owner_id" "uuid",
    "assignee_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    CONSTRAINT "deals_probability_check" CHECK ((("probability" >= 0) AND ("probability" <= 100)))
);

ALTER TABLE ONLY "public"."deals" REPLICA IDENTITY FULL;


ALTER TABLE "public"."deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deletion_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '14 days'::interval) NOT NULL,
    "reviewed_by" "uuid"[] DEFAULT '{}'::"uuid"[],
    "rejection_reason" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "deletion_requests_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text", 'CANCELLED'::"text", 'EXPIRED'::"text"])))
);


ALTER TABLE "public"."deletion_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "category" "text",
    "property_id" "uuid",
    "lead_id" "uuid",
    "deal_id" "uuid",
    "client_id" "uuid",
    "uploaded_by" "uuid",
    "version" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid" NOT NULL
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text",
    "amount" numeric NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE,
    "receipt_url" "text",
    "project_id" "uuid",
    "talent_id" "uuid",
    "submitted_by" "uuid",
    "approved_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."app_role" DEFAULT 'EMPLOYEE'::"public"."app_role" NOT NULL,
    "invitation_code" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_by" "uuid" NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role_template_id" "uuid",
    "invited_by" "uuid",
    "token" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "client_id" "uuid",
    "talent_id" "uuid",
    "booking_id" "uuid",
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "subtotal" numeric DEFAULT 0,
    "tax_rate" numeric DEFAULT 0,
    "tax" numeric DEFAULT 0,
    "total" numeric DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "issue_date" "date" DEFAULT CURRENT_DATE,
    "due_date" "date",
    "paid_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "source" "text" DEFAULT 'manual'::"text",
    "stage" "text" DEFAULT 'NEW'::"text" NOT NULL,
    "priority" "text" DEFAULT 'MEDIUM'::"text",
    "company_id" "uuid" NOT NULL,
    "owner_id" "uuid",
    "notes" "text",
    "created_by_automation" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."llm_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "model" "text" NOT NULL,
    "api_key_vault_id" "uuid",
    "base_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."llm_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "how_it_works" "text",
    "setup_steps" "text",
    "preview_image_url" "text",
    "categories" "text"[] DEFAULT '{}'::"text"[],
    "creator_name" "text",
    "creator_url" "text",
    "original_url" "text" NOT NULL,
    "workflow_json" "jsonb",
    "nodes_used" "text"[] DEFAULT '{}'::"text"[],
    "is_free" boolean DEFAULT true,
    "price" numeric,
    "source" "text" DEFAULT 'n8n_official'::"text",
    "last_updated_text" "text",
    "last_scraped_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."marketplace_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "subscribed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "unsubscribed_at" timestamp with time zone,
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."newsletter_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outcome_type_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_key" "text" NOT NULL,
    "description" "text" NOT NULL,
    "language" "text" DEFAULT 'en'::"text",
    "embedding" "public"."vector"(1536) NOT NULL,
    "source" "text" DEFAULT 'system'::"text",
    "company_id" "uuid",
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "average_similarity" numeric
);


ALTER TABLE "public"."outcome_type_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "two_factor_enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid",
    "status" "text" DEFAULT 'ACTIVE'::"text",
    "onboarding_completed" boolean DEFAULT false,
    "experience_level" "text",
    "industry" "text",
    "automation_frequency" "text",
    "terms_accepted_at" timestamp with time zone,
    "subscription_plan" "text" DEFAULT 'free'::"text",
    "notify_push" boolean DEFAULT true,
    "onesignal_player_id" "text",
    "stripe_customer_id" "text",
    "assistant_name" "text" DEFAULT 'Steve'::"text",
    "learning_enabled" boolean DEFAULT true,
    CONSTRAINT "profiles_automation_frequency_check" CHECK (("automation_frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text", 'rarely'::"text", 'first_time'::"text", NULL::"text"]))),
    CONSTRAINT "profiles_experience_level_check" CHECK (("experience_level" = ANY (ARRAY['experienced'::"text", 'beginner'::"text", NULL::"text"]))),
    CONSTRAINT "profiles_subscription_plan_check" CHECK (("subscription_plan" = ANY (ARRAY['free'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "address" "text" NOT NULL,
    "district" "text",
    "property_type" "text" NOT NULL,
    "status" "text" DEFAULT 'AVAILABLE'::"text" NOT NULL,
    "price" numeric(15,2),
    "bedrooms" integer,
    "bathrooms" integer,
    "square_feet" integer,
    "owner_id" "uuid",
    "assignee_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "property_code" "text",
    "facilities" "jsonb" DEFAULT '[]'::"jsonb",
    "is_featured" boolean DEFAULT false,
    "company_id" "uuid" NOT NULL,
    "revenue_type" "text" DEFAULT 'ONE_TIME'::"text",
    "payment_date" "date",
    CONSTRAINT "properties_revenue_type_check" CHECK (("revenue_type" = ANY (ARRAY['RECURRING'::"text", 'ONE_TIME'::"text"])))
);

ALTER TABLE ONLY "public"."properties" REPLICA IDENTITY FULL;


ALTER TABLE "public"."properties" OWNER TO "postgres";


COMMENT ON COLUMN "public"."properties"."revenue_type" IS 'Defines if the project revenue is recurring (subscription/rental) or one-time (sale/project completion)';



CREATE TABLE IF NOT EXISTS "public"."public_reviews" (
    "id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "created_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."public_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text",
    "email" "text",
    "review_text" "text" NOT NULL,
    "rating" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid",
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_built_in" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."steve_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "tool_name" "text" NOT NULL,
    "tool_args" "jsonb" NOT NULL,
    "tool_result" "jsonb",
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "summary" "text",
    "entity_type" "text",
    "entity_id" "uuid"
);


ALTER TABLE "public"."steve_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."steve_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "title" "text",
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "learnings_extracted" boolean DEFAULT false
);


ALTER TABLE "public"."steve_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."steve_knowledge_base" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "user_id" "uuid",
    "category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536),
    "tags" "text"[],
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "steve_knowledge_base_category_check" CHECK (("category" = ANY (ARRAY['autopenguin_docs'::"text", 'n8n_workflow_example'::"text", 'n8n_node_example'::"text", 'make_scenario_example'::"text", 'n8n_docs'::"text", 'make_docs'::"text", 'user_workflow_pattern'::"text", 'faq'::"text", 'user_preference'::"text", 'user_fact'::"text", 'user_pattern'::"text", 'user_person'::"text", 'company_fact'::"text"])))
);


ALTER TABLE "public"."steve_knowledge_base" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."steve_message_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "rating" "text" NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "steve_message_feedback_rating_check" CHECK (("rating" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


ALTER TABLE "public"."steve_message_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."steve_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536),
    "model_used" "text",
    "tokens_used" integer,
    "cost_usd" numeric(10,6),
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "source" "text" DEFAULT 'web'::"text",
    CONSTRAINT "steve_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."steve_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."steve_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "notification_type" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "action_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    CONSTRAINT "steve_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['outcome_clarification'::"text", 'automation_insight'::"text", 'performance_alert'::"text"]))),
    CONSTRAINT "steve_notifications_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "steve_notifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewed'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."steve_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."steve_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "conversation_id" "uuid",
    "model_used" "text" NOT NULL,
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "total_tokens" integer,
    "cost_usd" numeric(10,6),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."steve_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text" NOT NULL,
    "user_name" "text",
    "message" "text" NOT NULL,
    "company_id" "uuid",
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "support_requests_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid"
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."talent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "stage_name" "text",
    "category" "text",
    "social_handles" "jsonb" DEFAULT '{}'::"jsonb",
    "follower_count" integer,
    "engagement_rate" numeric,
    "rate_card" "jsonb" DEFAULT '{}'::"jsonb",
    "availability" "text" DEFAULT 'available'::"text",
    "contract_start" "date",
    "contract_end" "date",
    "email" "text",
    "phone" "text",
    "notes" "text",
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."talent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" DEFAULT 'TASK'::"text" NOT NULL,
    "status" "text" DEFAULT 'OPEN'::"text" NOT NULL,
    "priority" "text" DEFAULT 'MEDIUM'::"text" NOT NULL,
    "due_date" timestamp with time zone,
    "assignee_id" "uuid",
    "creator_id" "uuid",
    "property_id" "uuid",
    "lead_id" "uuid",
    "deal_id" "uuid",
    "client_id" "uuid",
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "created_by_automation" boolean DEFAULT false NOT NULL,
    "automation_workflow_id" "text",
    "resolved_by_automation" boolean DEFAULT false NOT NULL,
    "automation_resolution_data" "jsonb",
    "subtype" "text",
    "company_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."tasks" REPLICA IDENTITY FULL;


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."telegram_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "telegram_chat_id" bigint,
    "bot_token_vault_id" "uuid",
    "is_verified" boolean DEFAULT false,
    "verification_code" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."telegram_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "rejection_reason" "text"
);


ALTER TABLE "public"."user_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "permissions" "jsonb",
    "role_template_id" "uuid"
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "lead_id" "uuid",
    "property_id" "uuid",
    "client_id" "uuid",
    "scheduled_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'SCHEDULED'::"text",
    "created_by_automation" boolean DEFAULT false,
    "automation_workflow_id" "text",
    "n8n_execution_id" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "viewings_status_check" CHECK (("status" = ANY (ARRAY['SCHEDULED'::"text", 'COMPLETED'::"text", 'CANCELLED'::"text", 'NO_SHOW'::"text"])))
);


ALTER TABLE "public"."viewings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "company" "text",
    "use_case" "text",
    "referral_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'direct_signup'::"text",
    "phone" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "valid_waitlist_source" CHECK (("source" = ANY (ARRAY['direct_signup'::"text", 'chatbot'::"text", 'facebook_ads'::"text", 'website_form'::"text"]))),
    CONSTRAINT "valid_waitlist_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'contacted'::"text", 'onboarded'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


COMMENT ON COLUMN "public"."waitlist"."phone" IS 'Contact phone number in international format';



COMMENT ON COLUMN "public"."waitlist"."status" IS 'Tracks the lifecycle: pending (new signup) → approved (reviewed) → contacted (reached out) → onboarded (became customer) or declined (not a fit)';



CREATE OR REPLACE VIEW "public"."waitlist_analytics" WITH ("security_invoker"='true') AS
 SELECT "source",
    "count"(*) AS "signup_count",
    "count"(*) FILTER (WHERE ("created_at" >= ("now"() - '7 days'::interval))) AS "last_7_days",
    "count"(*) FILTER (WHERE ("created_at" >= ("now"() - '30 days'::interval))) AS "last_30_days",
    "min"("created_at") AS "first_signup",
    "max"("created_at") AS "most_recent_signup"
   FROM "public"."waitlist"
  GROUP BY "source"
  ORDER BY ("count"(*)) DESC;


ALTER VIEW "public"."waitlist_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_metric_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "n8n_workflow_id" "text" NOT NULL,
    "inferred_metric_key" "text" NOT NULL,
    "confidence" numeric(3,2),
    "detection_layer" "text",
    "rules_used" "jsonb",
    "override_metric_key" "text",
    "confirmed_by" "uuid",
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "vector_similarity" numeric,
    "matched_embedding_id" "uuid",
    CONSTRAINT "workflow_metric_mappings_detection_layer_check" CHECK (("detection_layer" = ANY (ARRAY['deterministic'::"text", 'heuristic'::"text", 'ai'::"text", 'user_confirmed'::"text"])))
);


ALTER TABLE "public"."workflow_metric_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "text",
    "n8n_execution_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "trigger_type" "text",
    "input_data" "jsonb",
    "output_data" "jsonb",
    "error_message" "text",
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."workflow_runs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."workflow_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_user_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "can_view" boolean DEFAULT true NOT NULL,
    "can_edit" boolean DEFAULT false NOT NULL,
    "can_toggle" boolean DEFAULT true NOT NULL,
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_user_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "n8n_workflow_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid"
);


ALTER TABLE "public"."workflows" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_outcomes"
    ADD CONSTRAINT "automation_outcomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_outcomes"
    ADD CONSTRAINT "automation_outcomes_workflow_run_metric_unique" UNIQUE ("workflow_run_id", "metric_key");



COMMENT ON CONSTRAINT "automation_outcomes_workflow_run_metric_unique" ON "public"."automation_outcomes" IS 'Ensures only one outcome record per execution and metric type to prevent duplication';



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bug_reports"
    ADD CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_short_code_key" UNIQUE ("short_code");



ALTER TABLE ONLY "public"."company_integrations"
    ADD CONSTRAINT "company_integrations_company_id_integration_type_key" UNIQUE ("company_id", "integration_type");



ALTER TABLE ONLY "public"."company_integrations"
    ADD CONSTRAINT "company_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_submissions"
    ADD CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_summaries"
    ADD CONSTRAINT "conversation_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_n8n_execution_id_key" UNIQUE ("n8n_execution_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deletion_requests"
    ADD CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invitation_code_key" UNIQUE ("invitation_code");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llm_connections"
    ADD CONSTRAINT "llm_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llm_connections"
    ADD CONSTRAINT "llm_connections_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."marketplace_templates"
    ADD CONSTRAINT "marketplace_templates_external_id_key" UNIQUE ("external_id");



ALTER TABLE ONLY "public"."marketplace_templates"
    ADD CONSTRAINT "marketplace_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outcome_type_embeddings"
    ADD CONSTRAINT "outcome_type_embeddings_metric_key_description_company_id_key" UNIQUE ("metric_key", "description", "company_id");



ALTER TABLE ONLY "public"."outcome_type_embeddings"
    ADD CONSTRAINT "outcome_type_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."public_reviews"
    ADD CONSTRAINT "public_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_templates"
    ADD CONSTRAINT "role_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steve_actions"
    ADD CONSTRAINT "steve_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steve_conversations"
    ADD CONSTRAINT "steve_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steve_knowledge_base"
    ADD CONSTRAINT "steve_knowledge_base_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steve_message_feedback"
    ADD CONSTRAINT "steve_message_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steve_messages"
    ADD CONSTRAINT "steve_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steve_notifications"
    ADD CONSTRAINT "steve_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steve_usage_logs"
    ADD CONSTRAINT "steve_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_requests"
    ADD CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."talent"
    ADD CONSTRAINT "talent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."telegram_connections"
    ADD CONSTRAINT "telegram_connections_company_id_telegram_chat_id_key" UNIQUE ("company_id", "telegram_chat_id");



ALTER TABLE ONLY "public"."telegram_connections"
    ADD CONSTRAINT "telegram_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "unique_property_code" UNIQUE ("property_code");



ALTER TABLE ONLY "public"."user_requests"
    ADD CONSTRAINT "user_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."viewings"
    ADD CONSTRAINT "viewings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_metric_mappings"
    ADD CONSTRAINT "workflow_metric_mappings_company_id_n8n_workflow_id_key" UNIQUE ("company_id", "n8n_workflow_id");



ALTER TABLE ONLY "public"."workflow_metric_mappings"
    ADD CONSTRAINT "workflow_metric_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_n8n_execution_id_key" UNIQUE ("n8n_execution_id");



ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_user_assignments"
    ADD CONSTRAINT "workflow_user_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_user_assignments"
    ADD CONSTRAINT "workflow_user_assignments_workflow_id_user_id_key" UNIQUE ("workflow_id", "user_id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_n8n_workflow_id_key" UNIQUE ("n8n_workflow_id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "companies_display_name_unique" ON "public"."companies" USING "btree" ("lower"("display_name"));



CREATE INDEX "idx_automation_outcomes_created_at" ON "public"."automation_outcomes" USING "btree" ("created_at");



CREATE INDEX "idx_automation_outcomes_entity" ON "public"."automation_outcomes" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_automation_outcomes_metric_key" ON "public"."automation_outcomes" USING "btree" ("metric_key");



CREATE INDEX "idx_bug_reports_created_at" ON "public"."bug_reports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bug_reports_status" ON "public"."bug_reports" USING "btree" ("status");



CREATE INDEX "idx_bug_reports_user_id" ON "public"."bug_reports" USING "btree" ("user_id");



CREATE INDEX "idx_clients_lead_stage" ON "public"."clients" USING "btree" ("lead_stage");



CREATE INDEX "idx_clients_property_id" ON "public"."clients" USING "btree" ("property_id");



CREATE INDEX "idx_company_integrations_vault_secret" ON "public"."company_integrations" USING "btree" ("vault_secret_id");



CREATE INDEX "idx_contact_submissions_created_at" ON "public"."contact_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_submissions_status" ON "public"."contact_submissions" USING "btree" ("status");



CREATE INDEX "idx_conversation_messages_conversation_id" ON "public"."conversation_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_messages_timestamp" ON "public"."conversation_messages" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_conversation_summaries_company_id" ON "public"."conversation_summaries" USING "btree" ("company_id");



CREATE INDEX "idx_conversation_summaries_contact_email" ON "public"."conversation_summaries" USING "btree" ("contact_email");



CREATE INDEX "idx_conversation_summaries_period" ON "public"."conversation_summaries" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_conversations_contact_name" ON "public"."conversations" USING "btree" ("contact_name");



CREATE INDEX "idx_conversations_n8n_execution_id" ON "public"."conversations" USING "btree" ("n8n_execution_id");



CREATE INDEX "idx_invitations_code" ON "public"."invitations" USING "btree" ("invitation_code");



CREATE INDEX "idx_invitations_email" ON "public"."invitations" USING "btree" ("email");



CREATE INDEX "idx_marketplace_templates_categories" ON "public"."marketplace_templates" USING "gin" ("categories");



CREATE INDEX "idx_marketplace_templates_nodes" ON "public"."marketplace_templates" USING "gin" ("nodes_used");



CREATE INDEX "idx_marketplace_templates_source" ON "public"."marketplace_templates" USING "btree" ("source");



CREATE INDEX "idx_newsletter_subscriptions_email" ON "public"."newsletter_subscriptions" USING "btree" ("email");



CREATE INDEX "idx_newsletter_subscriptions_is_active" ON "public"."newsletter_subscriptions" USING "btree" ("is_active");



CREATE INDEX "idx_notifications_company_status" ON "public"."steve_notifications" USING "btree" ("company_id", "status", "created_at" DESC);



CREATE INDEX "idx_profiles_onesignal_player_id" ON "public"."profiles" USING "btree" ("onesignal_player_id") WHERE ("onesignal_player_id" IS NOT NULL);



CREATE INDEX "idx_properties_facilities" ON "public"."properties" USING "gin" ("facilities");



CREATE INDEX "idx_properties_is_featured" ON "public"."properties" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_properties_property_code" ON "public"."properties" USING "btree" ("property_code");



CREATE INDEX "idx_steve_actions_created_at" ON "public"."steve_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_steve_actions_entity" ON "public"."steve_actions" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_steve_actions_tool_name" ON "public"."steve_actions" USING "btree" ("tool_name");



CREATE INDEX "idx_steve_actions_user_id" ON "public"."steve_actions" USING "btree" ("user_id");



CREATE INDEX "idx_steve_conversations_learnings" ON "public"."steve_conversations" USING "btree" ("user_id", "learnings_extracted") WHERE (("learnings_extracted" = false) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_steve_message_feedback_conversation_id" ON "public"."steve_message_feedback" USING "btree" ("conversation_id");



CREATE INDEX "idx_steve_message_feedback_message_id" ON "public"."steve_message_feedback" USING "btree" ("message_id");



CREATE INDEX "idx_steve_messages_memory_worthy" ON "public"."steve_messages" USING "gin" ("metadata") WHERE ("metadata" IS NOT NULL);



CREATE INDEX "idx_support_requests_company_id" ON "public"."support_requests" USING "btree" ("company_id");



CREATE INDEX "idx_support_requests_status" ON "public"."support_requests" USING "btree" ("status");



CREATE INDEX "idx_support_requests_user_id" ON "public"."support_requests" USING "btree" ("user_id");



CREATE INDEX "idx_user_requests_email" ON "public"."user_requests" USING "btree" ("email");



CREATE INDEX "idx_user_requests_status" ON "public"."user_requests" USING "btree" ("status");



CREATE INDEX "idx_viewings_automation" ON "public"."viewings" USING "btree" ("automation_workflow_id") WHERE ("created_by_automation" = true);



CREATE INDEX "idx_viewings_company_scheduled" ON "public"."viewings" USING "btree" ("company_id", "scheduled_at");



CREATE INDEX "idx_waitlist_created_at" ON "public"."waitlist" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_waitlist_email" ON "public"."waitlist" USING "btree" ("email");



CREATE INDEX "idx_waitlist_source" ON "public"."waitlist" USING "btree" ("source");



CREATE INDEX "idx_workflow_mappings_workflow" ON "public"."workflow_metric_mappings" USING "btree" ("company_id", "n8n_workflow_id");



CREATE INDEX "idx_workflow_runs_status_created" ON "public"."workflow_runs" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_workflow_runs_workflow_id" ON "public"."workflow_runs" USING "btree" ("workflow_id");



CREATE INDEX "outcome_embeddings_filter_idx" ON "public"."outcome_type_embeddings" USING "btree" ("metric_key", "company_id");



CREATE INDEX "outcome_embeddings_vector_idx" ON "public"."outcome_type_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "steve_knowledge_embedding_idx" ON "public"."steve_knowledge_base" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "steve_messages_embedding_idx" ON "public"."steve_messages" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE UNIQUE INDEX "uniq_open_auto_task_by_title" ON "public"."tasks" USING "btree" ("company_id", "automation_workflow_id", "lower"(TRIM(BOTH FROM "title"))) WHERE (("created_by_automation" = true) AND ("status" <> 'COMPLETED'::"text"));



CREATE OR REPLACE TRIGGER "on_waitlist_signup_subscribe_newsletter" AFTER INSERT ON "public"."waitlist" FOR EACH ROW EXECUTE FUNCTION "public"."auto_subscribe_waitlist_to_newsletter"();



CREATE OR REPLACE TRIGGER "property_deal_tracker" AFTER UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."track_property_deal"();



CREATE OR REPLACE TRIGGER "sync_public_reviews_trigger" AFTER INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."sync_public_reviews"();



CREATE OR REPLACE TRIGGER "trigger_update_conversation_on_action" AFTER INSERT ON "public"."steve_actions" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_on_action"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversation_summaries_updated_at" BEFORE UPDATE ON "public"."conversation_summaries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_deals_updated_at" BEFORE UPDATE ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_deletion_requests_updated_at" BEFORE UPDATE ON "public"."deletion_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_expenses_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_invitations_updated_at" BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_invoices_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_llm_connections_updated_at" BEFORE UPDATE ON "public"."llm_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_marketplace_templates_updated_at" BEFORE UPDATE ON "public"."marketplace_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_newsletter_subscriptions_updated_at" BEFORE UPDATE ON "public"."newsletter_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reviews_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_role_templates_updated_at" BEFORE UPDATE ON "public"."role_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_settings_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_talent_updated_at" BEFORE UPDATE ON "public"."talent" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_telegram_connections_updated_at" BEFORE UPDATE ON "public"."telegram_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_viewings_updated_at" BEFORE UPDATE ON "public"."viewings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_waitlist_updated_at" BEFORE UPDATE ON "public"."waitlist" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflow_assignments_updated_at" BEFORE UPDATE ON "public"."workflow_user_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflow_mappings_updated_at" BEFORE UPDATE ON "public"."workflow_metric_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflows_updated_at" BEFORE UPDATE ON "public"."workflows" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_deals_assignees" BEFORE INSERT OR UPDATE OF "assignee_ids" ON "public"."deals" FOR EACH ROW EXECUTE FUNCTION "public"."validate_assignees_same_company"();



CREATE OR REPLACE TRIGGER "validate_properties_assignees" BEFORE INSERT OR UPDATE OF "assignee_ids" ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."validate_assignees_same_company"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."automation_outcomes"
    ADD CONSTRAINT "automation_outcomes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."automation_outcomes"
    ADD CONSTRAINT "automation_outcomes_workflow_run_id_fkey" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "public"."talent"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bug_reports"
    ADD CONSTRAINT "bug_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bug_reports"
    ADD CONSTRAINT "bug_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_integrations"
    ADD CONSTRAINT "company_integrations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."company_integrations"
    ADD CONSTRAINT "company_integrations_vault_secret_id_fkey" FOREIGN KEY ("vault_secret_id") REFERENCES "vault"."secrets"("id");



ALTER TABLE ONLY "public"."contact_submissions"
    ADD CONSTRAINT "contact_submissions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_summaries"
    ADD CONSTRAINT "conversation_summaries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."deletion_requests"
    ADD CONSTRAINT "deletion_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deletion_requests"
    ADD CONSTRAINT "deletion_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "public"."talent"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "public"."role_templates"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "public"."talent"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."llm_connections"
    ADD CONSTRAINT "llm_connections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."llm_connections"
    ADD CONSTRAINT "llm_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outcome_type_embeddings"
    ADD CONSTRAINT "outcome_type_embeddings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."role_templates"
    ADD CONSTRAINT "role_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."steve_actions"
    ADD CONSTRAINT "steve_actions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."steve_actions"
    ADD CONSTRAINT "steve_actions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."steve_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."steve_conversations"
    ADD CONSTRAINT "steve_conversations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."steve_conversations"
    ADD CONSTRAINT "steve_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."steve_knowledge_base"
    ADD CONSTRAINT "steve_knowledge_base_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."steve_knowledge_base"
    ADD CONSTRAINT "steve_knowledge_base_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."steve_message_feedback"
    ADD CONSTRAINT "steve_message_feedback_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."steve_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."steve_message_feedback"
    ADD CONSTRAINT "steve_message_feedback_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."steve_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."steve_messages"
    ADD CONSTRAINT "steve_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."steve_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."steve_notifications"
    ADD CONSTRAINT "steve_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."steve_usage_logs"
    ADD CONSTRAINT "steve_usage_logs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."steve_conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_requests"
    ADD CONSTRAINT "support_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_requests"
    ADD CONSTRAINT "support_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."talent"
    ADD CONSTRAINT "talent_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."telegram_connections"
    ADD CONSTRAINT "telegram_connections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."telegram_connections"
    ADD CONSTRAINT "telegram_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_template_id_fkey" FOREIGN KEY ("role_template_id") REFERENCES "public"."role_templates"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewings"
    ADD CONSTRAINT "viewings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."viewings"
    ADD CONSTRAINT "viewings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewings"
    ADD CONSTRAINT "viewings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workflow_metric_mappings"
    ADD CONSTRAINT "workflow_metric_mappings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_metric_mappings"
    ADD CONSTRAINT "workflow_metric_mappings_matched_embedding_id_fkey" FOREIGN KEY ("matched_embedding_id") REFERENCES "public"."outcome_type_embeddings"("id");



ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."workflow_user_assignments"
    ADD CONSTRAINT "workflow_user_assignments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_user_assignments"
    ADD CONSTRAINT "workflow_user_assignments_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



CREATE POLICY "Admins can create invitations" ON "public"."invitations" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "Admins can delete contact submissions" ON "public"."contact_submissions" FOR DELETE TO "authenticated" USING ("public"."has_role"('ADMIN'::"public"."app_role"));



CREATE POLICY "Admins can delete marketplace templates" ON "public"."marketplace_templates" FOR DELETE USING (("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"()));



CREATE POLICY "Admins can insert marketplace templates" ON "public"."marketplace_templates" FOR INSERT WITH CHECK (("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"()));



CREATE POLICY "Admins can manage company role templates" ON "public"."role_templates" USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "Admins can manage deletion requests" ON "public"."deletion_requests" USING ("public"."has_role"('ADMIN'::"public"."app_role"));



CREATE POLICY "Admins can manage roles" ON "public"."user_roles" USING (("public"."is_super_admin"() OR "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "Admins can manage user requests" ON "public"."user_requests" USING ("public"."has_role"('ADMIN'::"public"."app_role"));



CREATE POLICY "Admins can update bug reports" ON "public"."bug_reports" FOR UPDATE USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "Admins can update contact submissions" ON "public"."contact_submissions" FOR UPDATE TO "authenticated" USING ("public"."has_role"('ADMIN'::"public"."app_role")) WITH CHECK ("public"."has_role"('ADMIN'::"public"."app_role"));



CREATE POLICY "Admins can update invitations" ON "public"."invitations" FOR UPDATE USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "Admins can update marketplace templates" ON "public"."marketplace_templates" FOR UPDATE USING (("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"()));



CREATE POLICY "Admins can update newsletter subscriptions" ON "public"."newsletter_subscriptions" FOR UPDATE USING ("public"."has_role"('ADMIN'::"public"."app_role"));



CREATE POLICY "Admins can update support requests" ON "public"."support_requests" FOR UPDATE TO "authenticated" USING (("public"."has_role"('ADMIN'::"public"."app_role") AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "Admins can view all bug reports" ON "public"."bug_reports" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "Admins can view all company support requests" ON "public"."support_requests" FOR SELECT TO "authenticated" USING (("public"."has_role"('ADMIN'::"public"."app_role") AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "Admins can view all waitlist entries" ON "public"."waitlist" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'ADMIN'::"public"."app_role")))));



CREATE POLICY "Admins can view company invitations" ON "public"."invitations" FOR SELECT USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "Admins can view newsletter subscriptions" ON "public"."newsletter_subscriptions" FOR SELECT USING ("public"."has_role"('ADMIN'::"public"."app_role"));



COMMENT ON POLICY "Admins can view newsletter subscriptions" ON "public"."newsletter_subscriptions" IS 'Global newsletter list - intentionally allows all admins to view. Newsletter is not company-specific.';



CREATE POLICY "Anyone can join waitlist" ON "public"."waitlist" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can submit contact form" ON "public"."contact_submissions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can subscribe to newsletter" ON "public"."newsletter_subscriptions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view marketplace templates" ON "public"."marketplace_templates" FOR SELECT USING (true);



CREATE POLICY "Super admins can view contact submissions" ON "public"."contact_submissions" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Users can create own llm connection" ON "public"."llm_connections" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "Users can create own telegram connection" ON "public"."telegram_connections" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "Users can delete own llm connection" ON "public"."llm_connections" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own telegram connection" ON "public"."telegram_connections" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert feedback for their conversations" ON "public"."steve_message_feedback" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."steve_conversations"
  WHERE (("steve_conversations"."id" = "steve_message_feedback"."conversation_id") AND ("steve_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own support requests" ON "public"."support_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own actions" ON "public"."steve_actions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own bug reports" ON "public"."bug_reports" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own llm connection" ON "public"."llm_connections" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own telegram connection" ON "public"."telegram_connections" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own company bookings" ON "public"."bookings" FOR SELECT USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "Users can view own company expenses" ON "public"."expenses" FOR SELECT USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "Users can view own company invoices" ON "public"."invoices" FOR SELECT USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "Users can view own company talent" ON "public"."talent" FOR SELECT USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "Users can view own company telegram connections" ON "public"."telegram_connections" FOR SELECT USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "Users can view own llm connection" ON "public"."llm_connections" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own support requests" ON "public"."support_requests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view role templates for their company" ON "public"."role_templates" FOR SELECT USING ((("company_id" IS NULL) OR ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "Users can view their own actions" ON "public"."steve_actions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own bug reports" ON "public"."bug_reports" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own deletion requests" ON "public"."deletion_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own feedback" ON "public"."steve_message_feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."steve_conversations"
  WHERE (("steve_conversations"."id" = "steve_message_feedback"."conversation_id") AND ("steve_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own requests" ON "public"."user_requests" FOR SELECT USING (("email" = ( SELECT "profiles"."email"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_super_admin"()));



CREATE POLICY "Users with access can manage bookings" ON "public"."bookings" USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "Users with access can manage talent" ON "public"."talent" USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "Users with finance access can manage expenses" ON "public"."expenses" USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "Users with finance access can manage invoices" ON "public"."invoices" USING (("company_id" = "public"."get_user_company_id"()));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_access" ON "public"."audit_logs" USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



ALTER TABLE "public"."automation_outcomes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "automation_outcomes_all" ON "public"."automation_outcomes" USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bug_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_delete" ON "public"."clients" FOR DELETE USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR ("owner_id" = "auth"."uid"())))));



CREATE POLICY "clients_insert" ON "public"."clients" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR ("owner_id" = "auth"."uid"())))));



CREATE POLICY "clients_select" ON "public"."clients" FOR SELECT USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR ("public"."has_role"('EMPLOYEE'::"public"."app_role") AND ("owner_id" = "auth"."uid"())) OR ("public"."has_role"('FREELANCER'::"public"."app_role") AND ("owner_id" = "auth"."uid"()))))));



CREATE POLICY "clients_update" ON "public"."clients" FOR UPDATE USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR ("owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_delete" ON "public"."companies" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "companies_insert" ON "public"."companies" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("public"."has_role"('ADMIN'::"public"."app_role") AND ("public"."get_user_company_id"() IS NULL))));



CREATE POLICY "companies_select" ON "public"."companies" FOR SELECT USING (("public"."is_super_admin"() OR ("id" = "public"."get_user_company_id"())));



CREATE POLICY "companies_update" ON "public"."companies" FOR UPDATE TO "authenticated" USING (("public"."is_super_admin"() OR (("id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role"))));



ALTER TABLE "public"."company_integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company_integrations_delete" ON "public"."company_integrations" FOR DELETE USING (("company_id" IN ( SELECT "profiles"."company_id"
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."user_id" IN ( SELECT "user_roles"."user_id"
           FROM "public"."user_roles"
          WHERE ("user_roles"."role" = ANY (ARRAY['ADMIN'::"public"."app_role", 'SUPER_ADMIN'::"public"."app_role"]))))))));



CREATE POLICY "company_integrations_insert" ON "public"."company_integrations" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "profiles"."company_id"
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."user_id" IN ( SELECT "user_roles"."user_id"
           FROM "public"."user_roles"
          WHERE ("user_roles"."role" = ANY (ARRAY['ADMIN'::"public"."app_role", 'SUPER_ADMIN'::"public"."app_role"]))))))));



CREATE POLICY "company_integrations_select_admin" ON "public"."company_integrations" FOR SELECT USING ((("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"()) AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "company_integrations_update" ON "public"."company_integrations" FOR UPDATE USING (("company_id" IN ( SELECT "profiles"."company_id"
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."user_id" IN ( SELECT "user_roles"."user_id"
           FROM "public"."user_roles"
          WHERE ("user_roles"."role" = ANY (ARRAY['ADMIN'::"public"."app_role", 'SUPER_ADMIN'::"public"."app_role"]))))))));



ALTER TABLE "public"."contact_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversation_messages_delete" ON "public"."conversation_messages" FOR DELETE USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "conversation_messages_insert" ON "public"."conversation_messages" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "conversation_messages_select" ON "public"."conversation_messages" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role"))));



CREATE POLICY "conversation_messages_update" ON "public"."conversation_messages" FOR UPDATE USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



ALTER TABLE "public"."conversation_summaries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversation_summaries_insert" ON "public"."conversation_summaries" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "conversation_summaries_select" ON "public"."conversation_summaries" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role"))));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_delete" ON "public"."conversations" FOR DELETE USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "conversations_insert" ON "public"."conversations" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "conversations_select" ON "public"."conversations" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role"))));



CREATE POLICY "conversations_update" ON "public"."conversations" FOR UPDATE USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



ALTER TABLE "public"."deals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deals_delete" ON "public"."deals" FOR DELETE USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."user_owns_or_assigned"("owner_id", "assignee_ids"))));



CREATE POLICY "deals_insert" ON "public"."deals" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."user_owns_or_assigned"("owner_id", "assignee_ids"))));



CREATE POLICY "deals_select" ON "public"."deals" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role") OR ("public"."has_role"('FREELANCER'::"public"."app_role") AND "public"."user_owns_or_assigned"("owner_id", "assignee_ids")))));



CREATE POLICY "deals_update" ON "public"."deals" FOR UPDATE USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."user_owns_or_assigned"("owner_id", "assignee_ids"))));



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_select" ON "public"."leads" FOR SELECT USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "leads_insert" ON "public"."leads" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "leads_update" ON "public"."leads" FOR UPDATE USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR ("owner_id" = "auth"."uid"())))));



CREATE POLICY "leads_delete" ON "public"."leads" FOR DELETE USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role"))));



ALTER TABLE "public"."deletion_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "documents_insert" ON "public"."documents" FOR INSERT WITH CHECK ((( SELECT "public"."has_role"('ADMIN'::"public"."app_role") AS "has_role") OR ("uploaded_by" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."llm_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "outcome_embeddings_admin_all" ON "public"."outcome_type_embeddings" USING (("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"()));



CREATE POLICY "outcome_embeddings_select_global" ON "public"."outcome_type_embeddings" FOR SELECT USING ((("company_id" IS NULL) OR ("company_id" = "public"."get_user_company_id"())));



ALTER TABLE "public"."outcome_type_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert" ON "public"."profiles" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("public"."has_role"('ADMIN'::"public"."app_role") AND ("company_id" = "public"."get_user_company_id"()))));



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT USING (("public"."is_super_admin"() OR ("user_id" = "auth"."uid"()) OR (("company_id" = "public"."get_user_company_id"()) AND ("company_id" IS NOT NULL) AND ("public"."get_user_company_id"() IS NOT NULL) AND "public"."has_role"('ADMIN'::"public"."app_role"))));



CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE USING ((("public"."has_role"('ADMIN'::"public"."app_role") AND ("company_id" = "public"."get_user_company_id"())) OR ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "properties_delete" ON "public"."properties" FOR DELETE USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."user_owns_or_assigned"("owner_id", "assignee_ids")))));



CREATE POLICY "properties_insert" ON "public"."properties" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."user_owns_or_assigned"("owner_id", "assignee_ids")))));



CREATE POLICY "properties_select" ON "public"."properties" FOR SELECT USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role") OR ("public"."has_role"('FREELANCER'::"public"."app_role") AND "public"."user_owns_or_assigned"("owner_id", "assignee_ids"))))));



CREATE POLICY "properties_update" ON "public"."properties" FOR UPDATE USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."user_owns_or_assigned"("owner_id", "assignee_ids")))));



ALTER TABLE "public"."public_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_reviews_select" ON "public"."public_reviews" FOR SELECT USING (true);



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_insert" ON "public"."reviews" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_id"()) AND ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())) OR (("auth"."uid"() IS NULL) AND ("user_id" IS NULL) AND ("name" IS NOT NULL) AND ("email" IS NOT NULL)))));



CREATE POLICY "reviews_select" ON "public"."reviews" FOR SELECT USING (((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")) OR ("auth"."uid"() = "user_id")));



ALTER TABLE "public"."role_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."steve_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."steve_conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "steve_conversations_delete" ON "public"."steve_conversations" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "steve_conversations_insert" ON "public"."steve_conversations" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "steve_conversations_select" ON "public"."steve_conversations" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "steve_conversations_update" ON "public"."steve_conversations" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."steve_knowledge_base" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "steve_knowledge_delete_user" ON "public"."steve_knowledge_base" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "steve_knowledge_insert_user" ON "public"."steve_knowledge_base" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "steve_knowledge_select" ON "public"."steve_knowledge_base" FOR SELECT USING ((("company_id" IS NULL) OR (("company_id" IN ( SELECT "profiles"."company_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))) AND ("user_id" IS NULL)) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "steve_knowledge_update_user" ON "public"."steve_knowledge_base" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."steve_message_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."steve_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "steve_messages_insert" ON "public"."steve_messages" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."steve_conversations"
  WHERE (("steve_conversations"."id" = "steve_messages"."conversation_id") AND ("steve_conversations"."user_id" = "auth"."uid"()))))));



CREATE POLICY "steve_messages_select" ON "public"."steve_messages" FOR SELECT USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."steve_conversations"
  WHERE (("steve_conversations"."id" = "steve_messages"."conversation_id") AND ("steve_conversations"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."steve_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "steve_notifications_select" ON "public"."steve_notifications" FOR SELECT USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role")))));



CREATE POLICY "steve_notifications_update" ON "public"."steve_notifications" FOR UPDATE USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role")))));



ALTER TABLE "public"."steve_usage_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "steve_usage_select_admin" ON "public"."steve_usage_logs" FOR SELECT USING (("company_id" IN ( SELECT "profiles"."company_id"
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."user_id" IN ( SELECT "user_roles"."user_id"
           FROM "public"."user_roles"
          WHERE ("user_roles"."role" = ANY (ARRAY['ADMIN'::"public"."app_role", 'SUPER_ADMIN'::"public"."app_role"]))))))));



ALTER TABLE "public"."support_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_settings_access" ON "public"."system_settings" USING (((("company_id" = "public"."get_user_company_id"()) OR ("company_id" IS NULL)) AND "public"."has_role"('ADMIN'::"public"."app_role")));



ALTER TABLE "public"."talent" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_delete" ON "public"."tasks" FOR DELETE USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR ("assignee_id" = "auth"."uid"()) OR ("creator_id" = "auth"."uid"())))));



CREATE POLICY "tasks_insert" ON "public"."tasks" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR ("assignee_id" = "auth"."uid"()) OR ("creator_id" = "auth"."uid"())))));



CREATE POLICY "tasks_select" ON "public"."tasks" FOR SELECT USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR ("assignee_id" = "auth"."uid"()) OR ("creator_id" = "auth"."uid"()) OR ("public"."has_role"('EMPLOYEE'::"public"."app_role") AND ((("property_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "tasks"."property_id") AND "public"."user_owns_or_assigned"("properties"."owner_id", "properties"."assignee_ids"))))) OR (("client_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "tasks"."client_id") AND ("clients"."owner_id" = "auth"."uid"()))))) OR (("deal_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."deals"
  WHERE (("deals"."id" = "tasks"."deal_id") AND "public"."user_owns_or_assigned"("deals"."owner_id", "deals"."assignee_ids")))))))))));



CREATE POLICY "tasks_update" ON "public"."tasks" FOR UPDATE USING (("public"."is_super_admin"() OR (("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR ("assignee_id" = "auth"."uid"()) OR ("creator_id" = "auth"."uid"())))));



ALTER TABLE "public"."telegram_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viewings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "viewings_delete" ON "public"."viewings" FOR DELETE USING ((("company_id" = "public"."get_user_company_id"()) AND "public"."has_role"('ADMIN'::"public"."app_role")));



CREATE POLICY "viewings_insert" ON "public"."viewings" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role"))));



CREATE POLICY "viewings_select" ON "public"."viewings" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role") OR "public"."has_role"('FREELANCER'::"public"."app_role"))));



CREATE POLICY "viewings_update" ON "public"."viewings" FOR UPDATE USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role"))));



ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workflow_assignments_admin_all" ON "public"."workflow_user_assignments" USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"())));



CREATE POLICY "workflow_assignments_select" ON "public"."workflow_user_assignments" FOR SELECT USING ((("user_id" = "auth"."uid"()) AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "workflow_mappings_manage" ON "public"."workflow_metric_mappings" USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"())));



CREATE POLICY "workflow_mappings_select" ON "public"."workflow_metric_mappings" FOR SELECT USING (("company_id" = "public"."get_user_company_id"()));



ALTER TABLE "public"."workflow_metric_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workflow_runs_delete" ON "public"."workflow_runs" FOR DELETE USING ("public"."has_role"('ADMIN'::"public"."app_role"));



CREATE POLICY "workflow_runs_insert" ON "public"."workflow_runs" FOR INSERT WITH CHECK ("public"."has_role"('ADMIN'::"public"."app_role"));



CREATE POLICY "workflow_runs_select" ON "public"."workflow_runs" FOR SELECT USING (("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."has_role"('EMPLOYEE'::"public"."app_role") OR "public"."has_role"('FREELANCER'::"public"."app_role")));



CREATE POLICY "workflow_runs_update" ON "public"."workflow_runs" FOR UPDATE USING ("public"."has_role"('ADMIN'::"public"."app_role"));



ALTER TABLE "public"."workflow_user_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workflows_delete" ON "public"."workflows" FOR DELETE USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"())));



CREATE POLICY "workflows_insert" ON "public"."workflows" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"())));



CREATE POLICY "workflows_select" ON "public"."workflows" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"() OR "public"."has_role"('EMPLOYEE'::"public"."app_role") OR "public"."has_role"('FREELANCER'::"public"."app_role"))));



CREATE POLICY "workflows_update" ON "public"."workflows" FOR UPDATE USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."has_role"('ADMIN'::"public"."app_role") OR "public"."is_super_admin"() OR "public"."has_role"('EMPLOYEE'::"public"."app_role") OR "public"."has_role"('FREELANCER'::"public"."app_role"))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."audit_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."automation_outcomes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bug_reports";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."clients";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."companies";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."company_integrations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."contact_submissions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."deals";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."deletion_requests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."documents";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."newsletter_subscriptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."properties";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."public_reviews";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."reviews";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."steve_actions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."steve_conversations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."steve_knowledge_base";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."steve_message_feedback";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."steve_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."steve_notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."steve_usage_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."support_requests";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."system_settings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."tasks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_roles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."viewings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."waitlist";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."workflow_metric_mappings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."workflow_runs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."workflow_user_assignments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."workflows";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."auto_subscribe_waitlist_to_newsletter"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_subscribe_waitlist_to_newsletter"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_subscribe_waitlist_to_newsletter"() TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_deleted_conversations"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_deleted_conversations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_deleted_conversations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_vault_secret"("name" "text", "secret" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_vault_secret"("name" "text", "secret" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_vault_secret"("name" "text", "secret" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_vault_secret"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_vault_secret"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_vault_secret"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_vault_secret_by_name"("p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_vault_secret_by_name"("p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_vault_secret_by_name"("p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_company_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_company_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_company_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_company_short_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_company_short_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_company_short_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invitation_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invitation_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invitation_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_colleagues"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_colleagues"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_colleagues"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_integration_api_key"("p_company_id" "uuid", "p_integration_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_integration_api_key"("p_company_id" "uuid", "p_integration_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_integration_api_key"("p_company_id" "uuid", "p_integration_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_exact_role"("_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_exact_role"("_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_exact_role"("_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."read_vault_secret"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."read_vault_secret"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."read_vault_secret"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_outcome_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."search_outcome_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_outcome_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_steve_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_company_id" "uuid", "filter_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."search_steve_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_company_id" "uuid", "filter_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_steve_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_company_id" "uuid", "filter_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_company_short_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_company_short_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_company_short_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_public_reviews"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_public_reviews"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_public_reviews"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_property_deal"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_property_deal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_property_deal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_on_action"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_on_action"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_on_action"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_owns_or_assigned"("owner_id" "uuid", "assignee_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."user_owns_or_assigned"("owner_id" "uuid", "assignee_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_owns_or_assigned"("owner_id" "uuid", "assignee_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_assignees_same_company"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_assignees_same_company"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_assignees_same_company"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";















GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."automation_outcomes" TO "anon";
GRANT ALL ON TABLE "public"."automation_outcomes" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_outcomes" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."bug_reports" TO "anon";
GRANT ALL ON TABLE "public"."bug_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."bug_reports" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_integrations" TO "anon";
GRANT ALL ON TABLE "public"."company_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."company_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."contact_submissions" TO "anon";
GRANT ALL ON TABLE "public"."contact_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_messages" TO "anon";
GRANT ALL ON TABLE "public"."conversation_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_messages" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_summaries" TO "anon";
GRANT ALL ON TABLE "public"."conversation_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."deletion_requests" TO "anon";
GRANT ALL ON TABLE "public"."deletion_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."deletion_requests" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."llm_connections" TO "anon";
GRANT ALL ON TABLE "public"."llm_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_connections" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_templates" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_templates" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."outcome_type_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."outcome_type_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."outcome_type_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."public_reviews" TO "anon";
GRANT ALL ON TABLE "public"."public_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."public_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."role_templates" TO "anon";
GRANT ALL ON TABLE "public"."role_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."role_templates" TO "service_role";



GRANT ALL ON TABLE "public"."steve_actions" TO "anon";
GRANT ALL ON TABLE "public"."steve_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."steve_actions" TO "service_role";



GRANT ALL ON TABLE "public"."steve_conversations" TO "anon";
GRANT ALL ON TABLE "public"."steve_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."steve_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."steve_knowledge_base" TO "anon";
GRANT ALL ON TABLE "public"."steve_knowledge_base" TO "authenticated";
GRANT ALL ON TABLE "public"."steve_knowledge_base" TO "service_role";



GRANT ALL ON TABLE "public"."steve_message_feedback" TO "anon";
GRANT ALL ON TABLE "public"."steve_message_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."steve_message_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."steve_messages" TO "anon";
GRANT ALL ON TABLE "public"."steve_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."steve_messages" TO "service_role";



GRANT ALL ON TABLE "public"."steve_notifications" TO "anon";
GRANT ALL ON TABLE "public"."steve_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."steve_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."steve_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."steve_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."steve_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."support_requests" TO "anon";
GRANT ALL ON TABLE "public"."support_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."support_requests" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."talent" TO "anon";
GRANT ALL ON TABLE "public"."talent" TO "authenticated";
GRANT ALL ON TABLE "public"."talent" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."telegram_connections" TO "anon";
GRANT ALL ON TABLE "public"."telegram_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."telegram_connections" TO "service_role";



GRANT ALL ON TABLE "public"."user_requests" TO "anon";
GRANT ALL ON TABLE "public"."user_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."user_requests" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."viewings" TO "anon";
GRANT ALL ON TABLE "public"."viewings" TO "authenticated";
GRANT ALL ON TABLE "public"."viewings" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_analytics" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_metric_mappings" TO "anon";
GRANT ALL ON TABLE "public"."workflow_metric_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_metric_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_runs" TO "anon";
GRANT ALL ON TABLE "public"."workflow_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_runs" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_user_assignments" TO "anon";
GRANT ALL ON TABLE "public"."workflow_user_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_user_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."workflows" TO "anon";
GRANT ALL ON TABLE "public"."workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."workflows" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































