import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ARCHITECTURE NOTE:
// This webhook receives POST data from n8n workflows.
// Each company configures their own n8n instance in Settings → Integrations.
// Webhook signature verification uses N8N_WEBHOOK_SECRET for security.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }

  try {
    // Verify webhook signature for security
    const webhookSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('N8N_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    const signature = req.headers.get('X-N8N-Signature');
    if (!signature) {
      console.error('Missing X-N8N-Signature header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing signature' }), 
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Read body for signature verification
    const bodyText = await req.text();
    
    // Verify HMAC signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(bodyText)
    );
    
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    
    // Use constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(signature, expectedSignature)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid signature' }), 
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Parse the verified payload
    const payload = JSON.parse(bodyText);
    
    // Log the complete payload for analysis
    console.log('=== N8N Webchat Webhook Received ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Payload keys:', Object.keys(payload));
    console.log('=====================================');

    // Log specific fields we might be interested in
    if (payload.conversation) {
      console.log('Conversation data:', payload.conversation);
    }
    if (payload.user) {
      console.log('User data:', payload.user);
    }
    if (payload.message) {
      console.log('Message data:', payload.message);
    }
    if (payload.outcome) {
      console.log('Outcome:', payload.outcome);
    }
    if (payload.response_time) {
      console.log('Response time:', payload.response_time);
    }

    // Return success response to n8n
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook received successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process webhook',
        message: (error as Error).message 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});