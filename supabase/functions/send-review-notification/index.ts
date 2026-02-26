import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { getEmailFrom } from '../_shared/env.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewNotification {
  user_email: string;
  user_name: string;
  rating: number;
  review_text: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reviewData: ReviewNotification = await req.json();

    console.log("Review notification received:", { email: reviewData.user_email, rating: reviewData.rating });

    // Send confirmation email to user
    const { error: emailError } = await resend.emails.send({
      from: getEmailFrom('notifications'),
      to: [reviewData.user_email],
      subject: "Thank You for Your Review!",
      html: `
        <h1>Thank you for your review, ${reviewData.user_name}!</h1>
        <p>We have received your ${reviewData.rating}-star review.</p>
        <p><strong>Your review:</strong></p>
        <p>${reviewData.review_text}</p>
        <p>Your feedback helps us improve our service.</p>
        <p>Best regards,<br>The AutoPenguin Team</p>
      `,
    });

    if (emailError) {
      console.error("Error sending confirmation email:", emailError);
      throw new Error("Failed to send confirmation email");
    }

    console.log("Confirmation email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-review-notification function:", error);
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
