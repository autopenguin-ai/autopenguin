import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEBUG = Deno.env.get('DEBUG') === 'true';
const log = (...args: unknown[]) => { if (DEBUG) console.log(...args); };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalize n8n URL: strip trailing slashes and /api or /api/v1 suffixes
function normalizeN8nUrl(url: string): string {
  let normalized = url.trim().replace(/\/+$/, ''); // Remove trailing slashes
  if (normalized.endsWith('/api/v1')) {
    normalized = normalized.slice(0, -7);
  } else if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4);
  }
  return normalized;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    
    // Create client with user's token for auth checks
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated and get their details
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is ADMIN or SUPER_ADMIN
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = roles?.role;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const isSuperAdmin = role === "SUPER_ADMIN";

    const { action, company_id, integration_type, api_url, api_key, integration_id } = await req.json();

    log(`[manage-integration] action=${action} user=${user.id} role=${role} company_id=${company_id}`);

    if (!isAdmin) {
      console.warn("[manage-integration] forbidden: admin access required");
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify company_id matches user's company (skip for SUPER_ADMIN)
    if (!isSuperAdmin) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!profile || profile.company_id !== company_id) {
        console.warn(`[manage-integration] forbidden: invalid company access. Profile company: ${profile?.company_id}, Requested: ${company_id}`);
        return new Response(JSON.stringify({ error: "Forbidden: Invalid company access" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create service role client for Vault operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case "create": {
        let secretName: string | undefined;
        
        try {
          // Validate inputs
          if (!integration_type || !api_url || !api_key) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Normalize n8n URLs
          const normalizedUrl = integration_type === 'n8n' ? normalizeN8nUrl(api_url) : api_url;

          // Pre-cleanup: Delete any existing secret with the same name (from failed previous attempts)
          secretName = `${company_id}_${integration_type}_api_key`;
          log(`[manage-integration] Pre-cleanup: checking for existing secret ${secretName}`);
          
          const { error: preCleanupError } = await supabaseAdmin
            .rpc('delete_vault_secret_by_name', { p_name: secretName });
          
          if (preCleanupError) {
            console.warn(`[manage-integration] Pre-cleanup warning (non-fatal):`, preCleanupError.message);
          } else {
            log(`[manage-integration] Pre-cleanup completed for ${secretName}`);
          }

          // Store API key in Vault using public wrapper function
          const { data: vaultSecretId, error: vaultError } = await supabaseAdmin
            .rpc('create_vault_secret', {
              name: secretName,
              secret: api_key,
            });

          if (vaultError || !vaultSecretId) {
            console.error("[manage-integration] create_vault_secret RPC error:", { 
              code: vaultError?.code, 
              message: vaultError?.message,
              details: vaultError?.details 
            });
            throw new Error("Failed to store API key securely");
          }

          // Create integration record with vault reference
          const { data: integration, error: integrationError } = await supabaseAdmin
            .from("company_integrations")
            .insert({
              company_id,
              integration_type,
              api_url: normalizedUrl,
              vault_secret_id: vaultSecretId,
              is_active: true,
            })
            .select()
            .single();

          if (integrationError) {
            console.error("Integration error:", integrationError);
            throw new Error(`Failed to create integration: ${integrationError.message}`);
          }

          return new Response(JSON.stringify({ success: true, integration }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (error) {
          // If anything fails after creating the secret, delete it using RPC
          if (secretName) {
            console.warn(`[manage-integration] Cleaning up orphaned secret: ${secretName}`);
            const { error: cleanupError } = await supabaseAdmin
              .rpc('delete_vault_secret_by_name', { p_name: secretName });
            
            if (!cleanupError) {
              log(`✓ Cleaned up secret: ${secretName}`);
            } else {
              console.error(`Failed to cleanup secret:`, cleanupError.message);
            }
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error'
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      case "test": {
        if (!integration_id) {
          return new Response(JSON.stringify({ error: "Missing integration_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get integration details
        const { data: integration } = await supabaseAdmin
          .from("company_integrations")
          .select("*")
          .eq("id", integration_id)
          .eq("company_id", company_id)
          .single();

        if (!integration) {
          return new Response(JSON.stringify({ error: "Integration not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get API key from Vault
        const { data: apiKey } = await supabaseAdmin.rpc('get_integration_api_key', {
          p_company_id: company_id,
          p_integration_type: integration.integration_type,
        });

        if (!apiKey) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "API key not found in vault" 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let testSuccess = false;
        let testError = null;

        // Test the connection based on integration type
        if (integration.integration_type === "n8n") {
          try {
            const normalizedUrl = normalizeN8nUrl(integration.api_url);
            const response = await fetch(`${normalizedUrl}/api/v1/workflows`, {
              headers: {
                "X-N8N-API-KEY": apiKey,
                "Accept": "application/json",
              },
            });

            if (response.ok) {
              testSuccess = true;
              
              // Update last_verified_at
              await supabaseAdmin
                .from("company_integrations")
                .update({ last_verified_at: new Date().toISOString() })
                .eq("id", integration_id);

              log("[manage-integration] n8n connection test successful, triggering auto-sync...");

              // Trigger auto-sync
              try {
                const syncResult = await supabaseAdmin.functions.invoke('n8n-api-service', {
                  body: {
                    action: 'sync_workflows',
                    company_id: company_id
                  }
                });

                if (syncResult.error) {
                  console.error("[manage-integration] auto-sync failed:", syncResult.error);
                } else {
                  log("[manage-integration] auto-sync completed:", syncResult.data);
                }
              } catch (syncError) {
                console.error(`[manage-integration] auto-sync failed:`, syncError);
                // Don't fail the test result, sync can be retried
              }
            } else {
              const errorText = await response.text();
              testError = `Connection failed (${response.status}): ${errorText}`;
            }
          } catch (error) {
            testError = error instanceof Error ? error.message : 'Unknown error';
          }
        } else {
          testError = "Testing not implemented for this integration type";
        }

        return new Response(
          JSON.stringify({ success: testSuccess, error: testError }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!integration_id) {
          return new Response(JSON.stringify({ error: "Missing integration_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get integration to find vault secret and integration type
        const { data: integration } = await supabaseAdmin
          .from("company_integrations")
          .select("vault_secret_id, integration_type")
          .eq("id", integration_id)
          .eq("company_id", company_id)
          .single();

        if (!integration) {
          return new Response(JSON.stringify({ error: "Integration not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete integration record
        const { error: deleteError } = await supabaseAdmin
          .from("company_integrations")
          .delete()
          .eq("id", integration_id);

        if (deleteError) {
          console.error("Delete error:", deleteError);
          return new Response(JSON.stringify({ error: "Failed to delete integration" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete vault secret via public wrapper (by ID) - using p_id parameter
        if (integration.vault_secret_id) {
          const { error: vaultDeleteError } = await supabaseAdmin
            .rpc('delete_vault_secret', { p_id: integration.vault_secret_id });
          
          if (vaultDeleteError) {
            console.error("[manage-integration] delete_vault_secret (by ID) error:", {
              code: vaultDeleteError?.code,
              message: vaultDeleteError?.message,
              details: vaultDeleteError?.details
            });
          } else {
            log(`✓ Deleted secret by ID: ${integration.vault_secret_id}`);
          }
        }
        
        // Also try to delete by name (backup cleanup using RPC)
        const secretName = `${company_id}_${integration.integration_type}_api_key`;
        const { error: nameDeleteError } = await supabaseAdmin
          .rpc('delete_vault_secret_by_name', { p_name: secretName });
        
        if (!nameDeleteError) {
          log(`✓ Deleted secret by name: ${secretName}`);
        } else {
          console.warn(`Could not delete secret by name:`, nameDeleteError.message);
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Integration deleted successfully'
          }), 
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list": {
        const { data: integrations, error } = await supabaseAdmin
          .from("company_integrations")
          .select("id, integration_type, api_url, is_active, last_verified_at, created_at")
          .eq("company_id", company_id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("List error:", error);
          return new Response(JSON.stringify({ error: "Failed to fetch integrations" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ integrations }), {
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
     console.error("Error:", error);
     return new Response(JSON.stringify({ error: (error as Error)?.message ?? 'Unknown error' }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
  }
});
