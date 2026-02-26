import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getEmailFrom, getEmailAddress } from '../_shared/env.ts';
import { escapeHtml, escapeHtmlWithBreaks } from '../_shared/sanitize.ts';
import { checkRateLimit, getClientIp, rateLimitResponse } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  message: string;
  contact_method?: "email" | "phone" | "whatsapp";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: 3 req/min per IP
  const clientIp = getClientIp(req);
  if (!checkRateLimit(`save-contact-form:${clientIp}`, 3, 60_000)) {
    return rateLimitResponse(corsHeaders);
  }

  try {
    console.log("Received contact form submission");
    const formData: ContactFormData = await req.json();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.error("Invalid email format:", formData.email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Saving to database...");
    
    // Save to database
    const { error: dbError } = await supabaseClient
      .from("contact_submissions")
      .insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        position: formData.position || null,
        message: formData.message,
        contact_method: formData.contact_method || "email",
        status: "NEW"
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save submission");
    }

    console.log("Contact form saved successfully");

    // Send emails
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      // Send internal notification to team
      await resend.emails.send({
        from: getEmailFrom('notifications'),
        to: [getEmailAddress('info')],
        subject: `New Contact Form Submission from ${formData.name}`,
        html: `
          <h2>New Contact Request</h2>
          <p><strong>Name:</strong> ${escapeHtml(formData.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(formData.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(formData.phone || 'N/A')}</p>
          <p><strong>Company:</strong> ${escapeHtml(formData.company || 'N/A')}</p>
          <p><strong>Position:</strong> ${escapeHtml(formData.position || 'N/A')}</p>
          <p><strong>Preferred Contact:</strong> ${escapeHtml(formData.contact_method || 'email')}</p>
          <p><strong>Message:</strong><br>${escapeHtmlWithBreaks(formData.message)}</p>
        `
      });
      console.log("Internal notification sent");

      // Send confirmation email to user
      await resend.emails.send({
        from: getEmailFrom('hello'),
        to: [formData.email],
        subject: 'We received your message - AutoPenguin',
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Thank you for contacting us! 🐧</h1>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Hi ${escapeHtml(formData.name)},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              We've received your message and our team will get back to you within 24 hours. Here's a copy of what you sent:
            </p>
            
            <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0;">
                ${escapeHtmlWithBreaks(formData.message)}
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              If you have any urgent questions in the meantime, feel free to reply to this email.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280;">
                Best regards,<br>
                The AutoPenguin Team
              </p>
            </div>
          </div>
        `
      });
      console.log("Confirmation email sent to user");
      
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({ success: true, message: "Thank you! We'll be in touch soon." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in save-contact-form:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
