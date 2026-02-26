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

interface BugReport {
  user_id: string;
  company_id: string | null;
  title: string;
  description: string;
  category: string;
  severity: string;
  browser_info: string;
  page_url: string;
  user_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bugReport: BugReport = await req.json();

    console.log("Bug report received:", { title: bugReport.title, category: bugReport.category });

    // Store the bug report in the database
    const { data: report, error: reportError } = await supabase
      .from('bug_reports')
      .insert({
        user_id: bugReport.user_id,
        company_id: bugReport.company_id,
        title: bugReport.title,
        description: bugReport.description,
        category: bugReport.category,
        severity: bugReport.severity,
        browser_info: bugReport.browser_info,
        page_url: bugReport.page_url,
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error storing bug report:", reportError);
      throw new Error("Failed to store bug report");
    }

    console.log("Bug report stored successfully:", report);

    // Send confirmation email to user
    try {
      const { error: emailError } = await resend.emails.send({
        from: getEmailFrom('notifications'),
        to: [bugReport.user_email],
        subject: "Bug Report Received - We're On It!",
        html: `
          <h1>Thank you for your bug report!</h1>
          <p>We have received your report about: <strong>${bugReport.title}</strong></p>
          <p>Thank you, we got the report and we'll fix the bug ASAP.</p>
          <p>Report ID: ${report.id}</p>
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

    return new Response(JSON.stringify({ success: true, report_id: report.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-bug-report function:", error);
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
