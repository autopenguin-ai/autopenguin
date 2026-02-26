import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getEmailFrom } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscribeRequest {
  email: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, utmSource, utmMedium, utmCampaign }: SubscribeRequest = await req.json();

    // Validate email
    if (!email || !email.includes('@')) {
      console.error('Invalid email provided:', email);
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Subscribing email: ${email}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Save to database
    const { error: dbError } = await supabaseClient
      .from("newsletter_subscriptions")
      .insert({
        email,
        source: utmSource || 'website',
        is_active: true
      });

    if (dbError) {
      // Check for unique constraint violation (duplicate email)
      if (dbError.code === '23505') {
        console.log('Email already subscribed:', email);
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'You are already subscribed!' 
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      console.error('Database error:', dbError);
      throw new Error('Failed to save subscription');
    }

    console.log('Subscription saved to database');

    // Send welcome email with Resend
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      const emailResult = await resend.emails.send({
        from: getEmailFrom('hello'),
        to: [email],
        subject: 'Welcome to AutoPenguin Updates! 🐧',
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to AutoPenguin! 🐧</h1>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Thank you for subscribing to our newsletter! You'll be the first to know about:
            </p>
            
            <ul style="font-size: 16px; line-height: 1.8; color: #374151;">
              <li>New features and product updates</li>
              <li>Automation tips and best practices</li>
              <li>Exclusive early access opportunities</li>
              <li>Industry insights and use cases</li>
            </ul>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-top: 20px;">
              We're excited to have you on board! 🚀
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
      
      if (emailResult.error) {
        console.error('Resend API error:', emailResult.error);
      } else {
        console.log('Welcome email sent successfully:', emailResult.data);
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully subscribed to newsletter!'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in beehiiv-subscribe function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
