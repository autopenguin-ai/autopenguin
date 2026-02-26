import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getEmailFrom, getEmailAddress } from '../_shared/env.ts';
import { escapeHtml, escapeHtmlWithBreaks } from '../_shared/sanitize.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  message: string;
  contact_method?: "email" | "phone" | "whatsapp";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContactData = await req.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate field lengths
    if (data.name.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name too long. Maximum 100 characters.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Email too long. Maximum 255 characters.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Message too long. Maximum 2000 characters.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.company && data.company.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Company name too long. Maximum 200 characters.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.phone && data.phone.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Phone number too long. Maximum 50 characters.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert into contact_submissions
    const { error: dbError } = await supabaseClient
      .from("contact_submissions")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        position: data.position || null,
        message: data.message,
        contact_method: data.contact_method || "email",
        status: "NEW"
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save contact submission");
    }

    console.log("Contact submission saved");

    // Check if user exists in profiles table
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('email', data.email)
      .single();

    // Detect sales intent from message content
    const salesKeywords = ['pricing', 'price', 'cost', 'enterprise', 'demo', 'purchase', 'plan', 'subscription', 'buy', 'sales', 'quote'];
    const isSalesInquiry = salesKeywords.some(keyword => 
      data.message.toLowerCase().includes(keyword)
    );

    // Determine recipient email based on user type and intent
    let recipientEmail: string;
    let routingType: string;
    
    if (existingUser) {
      recipientEmail = getEmailAddress('cs');
      routingType = 'Existing User (Customer Success)';
    } else if (isSalesInquiry) {
      recipientEmail = getEmailAddress('sales');
      routingType = 'New User - Sales Inquiry';
    } else {
      recipientEmail = getEmailAddress('info');
      routingType = 'New User - General Inquiry';
    }

    console.log(`Routing to: ${recipientEmail} (${routingType})`);

    // Send email notification to appropriate team
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      await resend.emails.send({
        from: getEmailFrom('notifications'),
        to: [recipientEmail],
        subject: `New Chatbot Contact Request from ${data.name}`,
        html: `
          <h2>New Contact Request via Chatbot</h2>
          <p><strong>Routing:</strong> ${routingType}</p>
          <p><strong>User Status:</strong> ${existingUser ? '✅ Existing User' : '🆕 New User'}</p>
          ${isSalesInquiry ? '<p><strong>⚡ Sales Intent Detected</strong></p>' : ''}
          <hr>
          <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(data.phone || 'N/A')}</p>
          <p><strong>Company:</strong> ${escapeHtml(data.company || 'N/A')}</p>
          <p><strong>Position:</strong> ${escapeHtml(data.position || 'N/A')}</p>
          <p><strong>Preferred Contact:</strong> ${escapeHtml(data.contact_method || 'email')}</p>
          <p><strong>Message:</strong><br>${escapeHtmlWithBreaks(data.message)}</p>
        `
      });
      console.log(`Email notification sent to ${recipientEmail}`);
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail if email fails
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in submit-contact-chatbot:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your submission" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
