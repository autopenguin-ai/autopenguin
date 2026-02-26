import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company_id from profiles
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    const companyId = profile?.company_id;

    const { action, bot_token } = await req.json();

    switch (action) {
      case "connect": {
        if (!bot_token || typeof bot_token !== "string" || bot_token.trim().length === 0) {
          return new Response(JSON.stringify({ error: "Bot token is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Validate bot token with Telegram API
        const botInfoRes = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
        const botInfo = await botInfoRes.json();
        if (!botInfo.ok) {
          return new Response(JSON.stringify({ error: "Invalid bot token - could not verify with Telegram" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Store bot token in Vault (per-user)
        const secretName = `${user.id}_telegram_bot_token`;

        // Clean up any existing secret with this name (prevent orphans)
        try {
          await supabaseAdmin.rpc("delete_vault_secret_by_name", { p_name: secretName });
        } catch (_) { /* ignore if doesn't exist */ }

        const { data: vaultSecretId, error: vaultError } = await supabaseAdmin
          .rpc("create_vault_secret", { name: secretName, secret: bot_token });

        if (vaultError || !vaultSecretId) {
          return new Response(JSON.stringify({ error: "Failed to store bot token securely" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Generate 6-char alphanumeric uppercase verification code
        const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Delete any existing connection for this user
        await supabaseAdmin.from("telegram_connections").delete().eq("user_id", user.id);

        // Create connection record
        const { error: dbError } = await supabaseAdmin
          .from("telegram_connections")
          .insert({
            company_id: companyId,
            user_id: user.id,
            bot_token_vault_id: vaultSecretId,
            is_verified: false,
            verification_code: verificationCode,
            is_active: true,
          });

        if (dbError) {
          // Rollback vault secret if DB insert fails
          await supabaseAdmin.rpc("delete_vault_secret", { p_id: vaultSecretId });
          return new Response(JSON.stringify({ error: "Failed to save connection" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Set webhook URL on the Telegram bot
        const webhookUrl = `${supabaseUrl}/functions/v1/telegram-webhook`;
        const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") || "";
        const setWebhookRes = await fetch(
          `https://api.telegram.org/bot${bot_token}/setWebhook`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: webhookUrl,
              secret_token: webhookSecret,
              allowed_updates: ["message"],
            }),
          }
        );
        const webhookResult = await setWebhookRes.json();

        return new Response(
          JSON.stringify({
            success: true,
            bot_name: botInfo.result.first_name,
            bot_username: botInfo.result.username,
            verification_code: verificationCode,
            webhook_set: webhookResult.ok,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disconnect": {
        // Get existing connection for this user
        const { data: connection } = await supabaseAdmin
          .from("telegram_connections")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (connection?.bot_token_vault_id) {
          // Read bot token from Vault to remove webhook
          const res = await fetch(
            `${supabaseUrl}/rest/v1/decrypted_secrets?id=eq.${connection.bot_token_vault_id}&select=decrypted_secret`,
            {
              headers: {
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
                "Accept-Profile": "vault",
              },
            }
          );
          if (res.ok) {
            const rows = await res.json();
            if (rows.length > 0) {
              await fetch(`https://api.telegram.org/bot${rows[0].decrypted_secret}/deleteWebhook`);
            }
          }

          // Delete vault secret
          await supabaseAdmin.rpc("delete_vault_secret", { p_id: connection.bot_token_vault_id });
        }

        // Also clean up by name as backup
        const secretName = `${user.id}_telegram_bot_token`;
        try {
          await supabaseAdmin.rpc("delete_vault_secret_by_name", { p_name: secretName });
        } catch (_) { /* ignore */ }

        // Delete connection record
        await supabaseAdmin
          .from("telegram_connections")
          .delete()
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        const { data: connection } = await supabaseAdmin
          .from("telegram_connections")
          .select("id, is_verified, is_active, telegram_chat_id, created_at")
          .eq("user_id", user.id)
          .single();

        return new Response(
          JSON.stringify({ connection: connection || null }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("manage-telegram error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
