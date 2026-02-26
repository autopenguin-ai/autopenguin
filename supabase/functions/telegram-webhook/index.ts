import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
};

// Timing-safe string comparison to prevent timing attacks on webhook secret
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Split long messages at Telegram's limit (4096 chars), breaking at 4000 to leave room
function splitMessage(text: string, maxLen = 4000): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a newline boundary first
    let splitIdx = remaining.lastIndexOf("\n", maxLen);
    // Fall back to space boundary
    if (splitIdx <= 0) splitIdx = remaining.lastIndexOf(" ", maxLen);
    // Last resort: hard cut
    if (splitIdx <= 0) splitIdx = maxLen;

    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }

  return chunks;
}

// Send a message back to Telegram
async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string
): Promise<void> {
  const chunks = splitMessage(text);

  for (const chunk of chunks) {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: "Markdown",
        }),
      });
    } catch (err) {
      // If Markdown fails (common with unescaped chars), retry without parse_mode
      console.error("Markdown send failed, retrying plain text:", err);
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
        }),
      });
    }
  }
}

// Send typing indicator to Telegram
async function sendTypingIndicator(
  botToken: string,
  chatId: number
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

// Retrieve bot token from Vault via the vault_id stored on the connection
async function getBotToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  connection: { company_id: string; bot_token_vault_id: string }
): Promise<string | null> {
  // Try get_integration_api_key first (works if company_integrations row exists)
  const { data: apiKey } = await supabaseAdmin.rpc("get_integration_api_key", {
    p_company_id: connection.company_id,
    p_integration_type: "telegram",
  });

  if (apiKey) return apiKey;

  // Fall back to reading directly from vault by the stored vault ID
  if (connection.bot_token_vault_id) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Query vault.decrypted_secrets via PostgREST with vault schema
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
      if (rows.length > 0) return rows[0].decrypted_secret;
    }
  }

  return null;
}

// Parse SSE stream from steve-chat and collect the full response text
async function parseSSEResponse(response: Response): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE lines
    const lines = buffer.split("\n");
    // Keep the last potentially incomplete line in the buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const payload = trimmed.slice(6); // Remove "data: " prefix

      // End of stream marker
      if (payload === "[DONE]") break;

      try {
        const parsed = JSON.parse(payload);
        // OpenAI-compatible SSE format: choices[0].delta.content
        const content = parsed?.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }

  return fullText;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Always return 200 to Telegram to prevent retries
  const ok = (body?: string) =>
    new Response(body || JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // Verify webhook secret
    const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");

    if (webhookSecret && (!headerSecret || !timingSafeEqual(headerSecret, webhookSecret))) {
      console.error("Webhook secret mismatch");
      return ok(); // Return 200 even on auth failure to not leak info
    }

    const update = await req.json();

    // Only handle text messages
    const message = update?.message;
    if (!message?.text) {
      return ok();
    }

    const chatId: number = message.chat.id;
    const userText: string = message.text;

    console.log(`Telegram message from chat ${chatId}: ${userText.slice(0, 100)}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Look up connection by chat_id
    const { data: connection } = await supabaseAdmin
      .from("telegram_connections")
      .select("*")
      .eq("telegram_chat_id", chatId)
      .eq("is_active", true)
      .eq("is_verified", true)
      .single();

    // --- Verification flow ---
    if (!connection) {
      // Check if the message text matches a pending verification code
      const { data: pendingConnection } = await supabaseAdmin
        .from("telegram_connections")
        .select("*")
        .eq("verification_code", userText.trim().toUpperCase())
        .eq("is_verified", false)
        .eq("is_active", true)
        .is("telegram_chat_id", null)
        .single();

      if (pendingConnection) {
        // Verify the connection by setting the chat_id
        const { error: verifyError } = await supabaseAdmin
          .from("telegram_connections")
          .update({
            telegram_chat_id: chatId,
            is_verified: true,
            verification_code: null, // Clear code after use
          })
          .eq("id", pendingConnection.id);

        if (verifyError) {
          console.error("Failed to verify telegram connection:", verifyError);
          // Try to send error message if we can get the bot token
          const botToken = await getBotToken(supabaseAdmin, pendingConnection);
          if (botToken) {
            await sendTelegramMessage(
              botToken,
              chatId,
              "Verification failed. Please try again or reconnect from the dashboard."
            );
          }
          return ok();
        }

        // Send success message
        const botToken = await getBotToken(supabaseAdmin, pendingConnection);
        if (botToken) {
          await sendTelegramMessage(
            botToken,
            chatId,
            "Verified! You're connected to Steve AI. Send me a message to get started."
          );
        }

        return ok();
      }

      // No connection found and no matching verification code
      console.log(`No connection found for chat ${chatId}, message: ${userText.slice(0, 50)}`);
      return ok();
    }

    // --- Main message routing ---
    // Get bot token for sending replies
    const botToken = await getBotToken(supabaseAdmin, connection);
    if (!botToken) {
      console.error(`No bot token found for connection ${connection.id}`);
      return ok();
    }

    // Send typing indicator while processing
    await sendTypingIndicator(botToken, chatId);

    // Call steve-chat function
    const steveResponse = await fetch(`${supabaseUrl}/functions/v1/steve-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        message: userText,
        userId: connection.user_id,
        companyId: connection.company_id,
        source: "telegram",
      }),
    });

    if (!steveResponse.ok) {
      console.error(
        `Steve-chat returned ${steveResponse.status}:`,
        await steveResponse.text()
      );
      await sendTelegramMessage(
        botToken,
        chatId,
        "Sorry, I couldn't process your message right now. Please try again."
      );
      return ok();
    }

    // Parse the SSE stream and collect the full response
    const replyText = await parseSSEResponse(steveResponse);

    if (!replyText.trim()) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "I received your message but couldn't generate a response. Please try again."
      );
      return ok();
    }

    // Send the response back via Telegram
    await sendTelegramMessage(botToken, chatId, replyText);

    return ok();
  } catch (error) {
    console.error("telegram-webhook error:", error);
    // Always return 200 to Telegram
    return ok();
  }
});
