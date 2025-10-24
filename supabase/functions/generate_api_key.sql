-- Function to generate a secure API key
CREATE OR REPLACE FUNCTION generate_api_key(
  p_environment text,
  p_name text,
  p_tenant_id uuid,
  p_website_id uuid,
  p_created_by uuid,
  p_scopes jsonb DEFAULT '["read"]'::jsonb,
  p_rate_limit integer DEFAULT 1000,
  p_expires_at timestamp with time zone DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key text;
  v_key_hash text;
  v_key_prefix text;
  v_random_part text;
  v_api_key_id uuid;
BEGIN
  -- Generate key prefix based on environment
  v_key_prefix := 'cms_' || p_environment || '_';
  
  -- Generate random part (32 bytes = 64 hex characters)
  v_random_part := encode(gen_random_bytes(32), 'hex');
  
  -- Combine to create the full key
  v_key := v_key_prefix || v_random_part;
  
  -- Hash the key using pgcrypto extension
  v_key_hash := crypt(v_key, gen_salt('bf', 10));
  
  -- Insert the API key record
  INSERT INTO api_keys (
    name,
    tenant_id,
    website_id,
    key_prefix,
    key_hash,
    scopes,
    rate_limit,
    expires_at,
    metadata,
    created_by,
    is_active
  ) VALUES (
    p_name,
    p_tenant_id,
    p_website_id,
    v_key_prefix,
    v_key_hash,
    p_scopes,
    p_rate_limit,
    p_expires_at,
    p_metadata,
    p_created_by,
    true
  ) RETURNING id INTO v_api_key_id;
  
  -- Return the full key (this is the ONLY time it will be visible)
  RETURN jsonb_build_object(
    'key', v_key,
    'key_id', v_api_key_id,
    'key_prefix', v_key_prefix,
    'key_hash', v_key_hash
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_api_key TO authenticated;

-- Add comment
COMMENT ON FUNCTION generate_api_key IS 'Generates a secure API key and stores its hash. Returns the full key which should be shown only once.';

