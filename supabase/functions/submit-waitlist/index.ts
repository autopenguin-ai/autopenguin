import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getAppUrl, getEmailFrom } from '../_shared/env.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistData {
  email: string;
  name: string;
  phone: string;
  company?: string;
  use_case?: string;
  referral_source?: string;
  source?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: WaitlistData = await req.json();
    
    // Validate required fields
    if (!data.email || !data.name || !data.phone) {
      return new Response(
        JSON.stringify({ error: "Email, name, and phone are required" }),
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

    // Validate phone format (basic international format)
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(data.phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert into waitlist
    const { error: dbError } = await supabaseClient
      .from("waitlist")
      .insert({
        email: data.email,
        name: data.name,
        phone: data.phone,
        company: data.company || null,
        use_case: data.use_case || null,
        referral_source: data.referral_source || null,
        source: data.source || 'direct_signup',
        status: 'pending'
      });

    if (dbError) {
      // Check for unique constraint violation (duplicate email)
      if (dbError.code === '23505') {
        console.log('Email already on waitlist:', data.email);
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'You are already on the waitlist!' 
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      console.error("Database error:", dbError);
      throw new Error("Failed to save to waitlist");
    }

    console.log("Waitlist signup successful:", data.email);

    // Send confirmation email
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      const emailResult = await resend.emails.send({
        from: getEmailFrom('hello'),
        to: [data.email],
        subject: "You're on the AutoPenguin Waitlist! 🎉",
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to the AutoPenguin Waitlist! 🎉</h1>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Hi ${data.name},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Thank you for joining the AutoPenguin early access waitlist! You're now in line to experience the future of natural language automation.
            </p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;">We'll notify you as soon as we're ready to onboard you</li>
                <li style="margin-bottom: 8px;">Early access members get 30% off their first year</li>
                <li style="margin-bottom: 8px;">You'll get priority access to new features</li>
                <li>We'll send you exclusive updates about our progress</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              In the meantime, feel free to explore our website to learn more about how AutoPenguin can transform your workflow automation.
            </p>
            
            <div style="margin-top: 30px;">
              <a href="${getAppUrl()}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Visit AutoPenguin
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280;">
                Excited to have you on board! 🚀<br>
                The AutoPenguin Team
              </p>
            </div>
          </div>
        `
      });
      
      if (emailResult.error) {
        console.error('Resend API error:', emailResult.error);
      } else {
        console.log('Confirmation email sent successfully to:', data.email, emailResult.data);
      }
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in submit-waitlist:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
