import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLOUD_PROVIDERS = ["openrouter", "anthropic", "openai", "google"];
const LOCAL_PROVIDERS = ["ollama", "lmstudio"];
const ALL_PROVIDERS = [...CLOUD_PROVIDERS, ...LOCAL_PROVIDERS];

// Make a test call to verify the provider connection works
async function testProvider(
  provider: string,
  model: string,
  apiKey: string | null,
  baseUrl: string | null,
): Promise<{ success: boolean; error?: string; responseTime: number }> {
  const start = Date.now();

  try {
    let url: string;
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: string;

    switch (provider) {
      case "openrouter":
        url = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        });
        break;

      case "anthropic":
        url = "https://api.anthropic.com/v1/messages";
        headers["x-api-key"] = apiKey!;
        headers["anthropic-version"] = "2023-06-01";
        body = JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        });
        break;

      case "openai":
        url = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        });
        break;

      case "google":
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        body = JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }],
        });
        break;

      case "ollama":
        url = `${baseUrl}/api/chat`;
        body = JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hello" }],
          stream: false,
        });
        break;

      case "lmstudio":
        url = `${baseUrl}/v1/chat/completions`;
        body = JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        });
        break;

      default:
        return { success: false, error: `Unknown provider: ${provider}`, responseTime: 0 };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    const responseTime = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Provider returned ${response.status}: ${errorText.substring(0, 200)}`,
        responseTime,
      };
    }

    return { success: true, responseTime };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: Date.now() - start,
    };
  }
}

// Read a decrypted secret from Vault by its ID
async function readVaultSecret(
  supabaseUrl: string,
  supabaseServiceKey: string,
  vaultId: string,
): Promise<string | null> {
  // Method 1: Try RPC function (most reliable)
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: rpcResult, error: rpcError } = await adminClient.rpc('read_vault_secret', { p_id: vaultId });
    if (!rpcError && rpcResult) return rpcResult;
    console.warn(`Vault RPC fallback: ${rpcError?.message || 'no result'}`);
  } catch (e) {
    console.warn(`Vault RPC not available: ${e}`);
  }

  // Method 2: Direct REST API to vault schema
  const res = await fetch(
    `${supabaseUrl}/rest/v1/decrypted_secrets?id=eq.${vaultId}&select=decrypted_secret`,
    {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Accept-Profile": "vault",
      },
    },
  );
  if (res.ok) {
    const rows = await res.json();
    if (rows.length > 0) return rows[0].decrypted_secret;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    // User-scoped client for auth
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for Vault and admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get company_id from profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();
    const companyId = profile?.company_id;

    const { action, provider, model, api_key, base_url } = await req.json();

    switch (action) {
      case "connect": {
        // Validate provider
        if (!provider || !ALL_PROVIDERS.includes(provider)) {
          return new Response(
            JSON.stringify({
              error: `Invalid provider. Must be one of: ${ALL_PROVIDERS.join(", ")}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        // Validate model
        if (!model || typeof model !== "string" || model.trim().length === 0) {
          return new Response(JSON.stringify({ error: "Model is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Validate api_key for cloud providers
        if (CLOUD_PROVIDERS.includes(provider)) {
          if (!api_key || typeof api_key !== "string" || api_key.trim().length === 0) {
            return new Response(
              JSON.stringify({ error: "API key is required for cloud providers" }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }
        }

        // Validate base_url for local providers
        if (LOCAL_PROVIDERS.includes(provider)) {
          if (!base_url || typeof base_url !== "string" || base_url.trim().length === 0) {
            return new Response(
              JSON.stringify({ error: "Base URL is required for local providers" }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }
        }

        // Test the provider connection
        const testResult = await testProvider(provider, model, api_key || null, base_url || null);
        if (!testResult.success) {
          return new Response(
            JSON.stringify({
              error: `Provider test failed: ${testResult.error}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const secretName = `${user.id}_llm_api_key`;
        let vaultSecretId: string | null = null;

        // Store API key in Vault for cloud providers
        if (CLOUD_PROVIDERS.includes(provider) && api_key) {
          // Clean up any existing vault secret
          try {
            await supabaseAdmin.rpc("delete_vault_secret_by_name", { p_name: secretName });
          } catch (_) {
            /* ignore if doesn't exist */
          }

          const { data: newVaultId, error: vaultError } = await supabaseAdmin.rpc(
            "create_vault_secret",
            { name: secretName, secret: api_key },
          );

          if (vaultError || !newVaultId) {
            return new Response(
              JSON.stringify({ error: "Failed to store API key securely" }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }

          vaultSecretId = newVaultId;
        }

        // Delete any existing llm_connections for this user
        await supabaseAdmin.from("llm_connections").delete().eq("user_id", user.id);

        // Insert new connection record
        const { error: dbError } = await supabaseAdmin.from("llm_connections").insert({
          company_id: companyId,
          user_id: user.id,
          provider,
          model: model.trim(),
          api_key_vault_id: vaultSecretId,
          base_url: LOCAL_PROVIDERS.includes(provider) ? base_url.trim() : null,
          is_active: true,
        });

        if (dbError) {
          // Rollback vault secret if DB insert fails
          if (vaultSecretId) {
            await supabaseAdmin.rpc("delete_vault_secret", { p_id: vaultSecretId });
          }
          console.error("manage-llm connect DB error:", dbError);
          return new Response(JSON.stringify({ error: "Failed to save connection" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            provider,
            model: model.trim(),
            response_time: testResult.responseTime,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      case "disconnect": {
        // Get existing connection
        const { data: connection } = await supabaseAdmin
          .from("llm_connections")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!connection) {
          return new Response(JSON.stringify({ error: "No active connection found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete vault secret if exists
        if (connection.api_key_vault_id) {
          await supabaseAdmin.rpc("delete_vault_secret", {
            p_id: connection.api_key_vault_id,
          });
        }

        // Also clean up by name as backup
        const secretName = `${user.id}_llm_api_key`;
        try {
          await supabaseAdmin.rpc("delete_vault_secret_by_name", { p_name: secretName });
        } catch (_) {
          /* ignore */
        }

        // Delete connection record
        await supabaseAdmin.from("llm_connections").delete().eq("user_id", user.id);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "test": {
        // Get existing connection
        const { data: connection } = await supabaseAdmin
          .from("llm_connections")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!connection) {
          return new Response(JSON.stringify({ error: "No active connection found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Read API key from Vault if it's a cloud provider
        let apiKey: string | null = null;
        if (connection.api_key_vault_id) {
          apiKey = await readVaultSecret(supabaseUrl, supabaseServiceKey, connection.api_key_vault_id);
          if (!apiKey) {
            return new Response(
              JSON.stringify({ success: false, error: "API key not found in vault" }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }
        }

        // Run the test
        const testResult = await testProvider(
          connection.provider,
          connection.model,
          apiKey,
          connection.base_url,
        );

        return new Response(
          JSON.stringify({
            success: testResult.success,
            error: testResult.error || undefined,
            response_time: testResult.responseTime,
            provider: connection.provider,
            model: connection.model,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      case "status": {
        const { data: connection } = await supabaseAdmin
          .from("llm_connections")
          .select("provider, model, base_url, is_active, created_at, updated_at")
          .eq("user_id", user.id)
          .single();

        return new Response(JSON.stringify({ connection: connection || null }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("manage-llm error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
