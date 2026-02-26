import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { getEmailFrom } from '../_shared/env.ts';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportRequest {
  user_id: string;
  user_email: string;
  user_name: string;
  message: string;
  company_id: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supportRequest: SupportRequest = await req.json();

    console.log("Support request received:", { email: supportRequest.user_email });

    // Store the support request in the database
    const { data: request, error: requestError } = await supabase
      .from('support_requests')
      .insert({
        user_id: supportRequest.user_id,
        user_email: supportRequest.user_email,
        user_name: supportRequest.user_name,
        message: supportRequest.message,
        company_id: supportRequest.company_id,
        status: 'open',
      })
      .select()
      .single();

    if (requestError) {
      console.error("Error storing support request:", requestError);
      throw new Error("Failed to store support request");
    }

    console.log("Support request stored successfully:", request);

    // Send confirmation email to user
    try {
      const { error: emailError } = await resend.emails.send({
        from: getEmailFrom('notifications'),
        to: [supportRequest.user_email],
        subject: "Support Request Received - We're Here to Help!",
        html: `
          <h1>Thank you for contacting support, ${supportRequest.user_name}!</h1>
          <p>We have received your support request and our team will get back to you as soon as possible.</p>
          <p><strong>Your message:</strong></p>
          <p>${supportRequest.message}</p>
          <p>Request ID: ${request.id}</p>
          <p>Best regards,<br>The AutoPenguin Team</p>
        `,
      });

      if (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the whole request if email fails
      } else {
        console.log("Confirmation email sent successfully");
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the whole request if email fails
    }

    return new Response(JSON.stringify({ success: true, request_id: request.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-support-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
