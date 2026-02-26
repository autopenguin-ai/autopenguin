import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { getEmailFrom, getAppUrl } from '../_shared/env.ts';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutomationRequest {
  user_email: string;
  name?: string;
  automationType: string;
  description: string;
  priority: string;
  company_id: string | null;
  language?: string;
}

const renderAutomationRequestEmail = (
  name: string,
  automationType: string,
  taskId: string,
  language: string = 'en'
) => {
  const isEnglish = language === 'en';
  
  const content = {
    subject: isEnglish 
      ? 'Your Automation Request Has Been Received' 
      : '您的自動化請求已收到',
    greeting: isEnglish 
      ? `Dear ${name},` 
      : `親愛的 ${name}，`,
    thankYou: isEnglish
      ? 'Thank you for your automation request!'
      : '感謝您提交自動化請求！',
    received: isEnglish
      ? `We have received your request for: <strong>${automationType}</strong>`
      : `我們已收到您的請求：<strong>${automationType}</strong>`,
    timeline: isEnglish
      ? 'We have got your request and will start the process within <strong>24 hours</strong>. You\'ll get your first draft within <strong>48 hours</strong>.'
      : '我們已收到您的請求，將在 <strong>24 小時內</strong>開始處理。您將在 <strong>48 小時內</strong>收到初稿。',
    whatsapp: isEnglish
      ? 'For any questions, you can reach us on WhatsApp:'
      : '如有任何問題，您可以透過 WhatsApp 聯繫我們：',
    reference: isEnglish
      ? `Reference Number: <strong>#${taskId}</strong>`
      : `參考編號：<strong>#${taskId}</strong>`,
    regards: isEnglish
      ? 'Best regards,'
      : '此致，',
    team: isEnglish
      ? 'The AutoPenguin Team'
      : 'AutoPenguin 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo img {
            max-width: 150px;
            height: auto;
          }
          h1 {
            color: #1a1a1a;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
          }
          p {
            margin-bottom: 15px;
            color: #555;
          }
          .highlight {
            background-color: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0ea5e9;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 500;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            color: #888;
            font-size: 14px;
          }
          .reference {
            background-color: #fafafa;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            margin: 20px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="${getAppUrl()}/autopenguin-logo.png" alt="AutoPenguin" />
          </div>
          
          <h1>${content.thankYou}</h1>
          
          <p>${content.greeting}</p>
          
          <p>${content.received}</p>
          
          <div class="highlight">
            <p style="margin: 0;"><strong>⏱️ ${content.timeline}</strong></p>
          </div>
          
          <div class="reference">
            ${content.reference}
          </div>
          
          ${Deno.env.get('WHATSAPP_LINK') ? `
          <p>${content.whatsapp}</p>
          <div style="text-align: center;">
            <a href="${Deno.env.get('WHATSAPP_LINK')}" class="button">💬 Contact on WhatsApp</a>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>${content.regards}<br>${content.team}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_email, 
      name, 
      automationType, 
      description, 
      priority, 
      company_id,
      language = 'en'
    }: AutomationRequest = await req.json();

    const userName = name || 'User';

    console.log("Automation request received:", { 
      user_email, 
      name: userName, 
      automationType, 
      priority, 
      company_id 
    });

    // Store the automation request in the tasks table
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: `Automation Request: ${automationType}`,
        description: `Request from: ${userName} (${user_email})\nPriority: ${priority}\n\nDescription:\n${description}`,
        type: 'AUTOMATION_REQUEST',
        priority: priority.toUpperCase(),
        status: 'OPEN',
        created_by_automation: true,
        company_id: company_id
      })
      .select()
      .single();

    if (taskError) {
      console.error("Error storing automation request:", taskError);
      throw new Error("Failed to store automation request");
    }

    console.log("Automation request stored successfully:", task);

    // Send confirmation email to user
    try {
      const emailHtml = renderAutomationRequestEmail(
        userName,
        automationType,
        task.id.split('-')[0].toUpperCase(),
        language
      );

      const { error: emailError } = await resend.emails.send({
        from: getEmailFrom('notifications'),
        to: [user_email],
        subject: language === 'en' 
          ? "Your Automation Request Has Been Received"
          : "您的自動化請求已收到",
        html: emailHtml,
      });

      if (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the whole request if email fails
      } else {
        console.log("Confirmation email sent successfully to:", user_email);
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the whole request if email fails
    }

    return new Response(JSON.stringify({ success: true, taskId: task.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-automation-request function:", error);
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
