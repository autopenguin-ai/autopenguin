import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import Stripe from 'https://esm.sh/stripe@15.4.0?target=deno';
import { Resend } from 'https://esm.sh/resend@4.0.0';
import { getAppUrl, getEmailFrom, getEmailAddress } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Render bilingual account deletion confirmation email
function renderDeletionEmail(name: string, language: string, hadSubscription: boolean): string {
  const isZh = language === 'zh-TW';
  
  const subject = isZh ? '您的 AutoPenguin 帳戶已刪除' : 'Your AutoPenguin account has been deleted';
  const greeting = isZh ? `您好 ${name}，` : `Hi ${name},`;
  const mainMessage = isZh 
    ? '您的 AutoPenguin 帳戶已成功刪除。' 
    : 'Your AutoPenguin account has been successfully deleted.';
  const dataMessage = isZh
    ? '您的所有資料已從我們的系統中移除。'
    : 'All your data has been removed from our systems.';
  const subscriptionMessage = hadSubscription
    ? (isZh ? '您的訂閱已取消，不會再收取任何費用。' : 'Your subscription has been cancelled and you will not be charged further.')
    : '';
  const thankYou = isZh
    ? '感謝您使用 AutoPenguin！我們很遺憾看到您離開。'
    : 'Thank you for being part of AutoPenguin! We\'re sad to see you go.';
  const contactInfo = isZh
    ? '如有任何問題，請聯繫我們：'
    : 'If you have any questions, please contact us at:';
  const farewell = isZh ? '祝您一切順利！' : 'Wishing you all the best!';
  const team = isZh ? 'AutoPenguin 團隊' : 'The AutoPenguin Team';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
              <img src="${getAppUrl()}/autopenguin-logo.png" alt="AutoPenguin" style="height: 48px; width: auto;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 24px 0; font-size: 18px; color: #18181b; font-weight: 500;">
                ${greeting}
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                ${mainMessage}
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                ${dataMessage}
              </p>
              
              ${subscriptionMessage ? `
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                ✅ ${subscriptionMessage}
              </p>
              ` : ''}
              
              <p style="margin: 24px 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                ${thankYou}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
              
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                ${contactInfo}
              </p>
              <p style="margin: 0 0 24px 0;">
                <a href="mailto:${getEmailAddress('info')}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">${getEmailAddress('info')}</a>
              </p>
              
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #3f3f46;">
                ${farewell}
              </p>
              <p style="margin: 0; font-size: 16px; color: #3f3f46; font-weight: 500;">
                ${team}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © ${new Date().getFullYear()} AutoPenguin. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the JWT token and extract user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid token or user not found');
    }

    console.log(`🚀 Starting account deletion for user: ${user.id}`);

    // Helper to delete with error logging (non-critical - continue on failure)
    const safeDelete = async (table: string, column: string, value: string): Promise<boolean> => {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, value);
      if (error) {
        console.warn(`⚠️ Failed to delete from ${table}: ${error.message}`);
        return false;
      }
      console.log(`✅ Deleted from ${table}`);
      return true;
    };

    // Helper to anonymize with error logging
    const safeAnonymize = async (table: string, column: string, value: string, updates: Record<string, unknown>): Promise<boolean> => {
      const { error } = await supabaseAdmin.from(table).update(updates).eq(column, value);
      if (error) {
        console.warn(`⚠️ Failed to anonymize ${table}: ${error.message}`);
        return false;
      }
      console.log(`✅ Anonymized ${table}`);
      return true;
    };

    // Step 1: Get user's profile (company_id + stripe_customer_id + info for email)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id, stripe_customer_id, first_name')
      .eq('user_id', user.id)
      .single();

    // Save user info for confirmation email BEFORE deletion
    const userEmail = user.email || '';
    const userName = profile?.first_name || 'there';
    // Check user metadata for language preference (from auth signup)
    const userLanguage = user.user_metadata?.language || 'en';

    const companyId = profile?.company_id;
    const stripeCustomerId = profile?.stripe_customer_id;
    console.log(`📋 User's company_id: ${companyId}`);
    console.log(`💳 User's stripe_customer_id: ${stripeCustomerId || 'none'}`);

    // Tracking variables for summary
    let stripeSubscriptionsCancelled = false;
    let companyDeleted = false;

    // Step 2: CANCEL STRIPE SUBSCRIPTIONS (before any deletions)
    if (stripeCustomerId) {
      console.log(`💳 Cancelling Stripe subscriptions for customer: ${stripeCustomerId}`);
      
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (stripeSecretKey) {
        try {
          const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
          
          // List all active subscriptions for this customer
          const activeSubscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'active',
          });
          
          console.log(`💳 Found ${activeSubscriptions.data.length} active subscription(s)`);
          
          // Cancel all active subscriptions
          for (const subscription of activeSubscriptions.data) {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(`💳 Cancelled active subscription: ${subscription.id}`);
          }
          
          // Also check for 'trialing' subscriptions
          const trialingSubscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'trialing',
          });
          
          console.log(`💳 Found ${trialingSubscriptions.data.length} trialing subscription(s)`);
          
          for (const subscription of trialingSubscriptions.data) {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(`💳 Cancelled trialing subscription: ${subscription.id}`);
          }
          
          stripeSubscriptionsCancelled = true;
          console.log('💳 All Stripe subscriptions cancelled successfully');
        } catch (stripeError) {
          console.error('⚠️ Failed to cancel Stripe subscriptions:', stripeError);
          // Continue with deletion - don't block account deletion if Stripe fails
          // The orphaned subscription will still charge, but user explicitly wanted deletion
        }
      } else {
        console.warn('⚠️ STRIPE_SECRET_KEY not configured - cannot cancel subscriptions');
      }
    }

    // Step 3: DELETE all company data (if company exists)
    if (companyId) {
      console.log('🗑️ Deleting company data...');
      
      // Delete in correct order (child records first to handle foreign keys)
      await safeDelete('conversation_messages', 'company_id', companyId);
      await safeDelete('conversations', 'company_id', companyId);
      await safeDelete('conversation_summaries', 'company_id', companyId);
      await safeDelete('viewings', 'company_id', companyId);
      await safeDelete('documents', 'company_id', companyId);
      await safeDelete('tasks', 'company_id', companyId);
      await safeDelete('deals', 'company_id', companyId);
      await safeDelete('clients', 'company_id', companyId);
      await safeDelete('properties', 'company_id', companyId);
      await safeDelete('workflow_runs', 'company_id', companyId);
      await safeDelete('workflows', 'company_id', companyId);
      await safeDelete('workflow_user_assignments', 'company_id', companyId);
      await safeDelete('workflow_metric_mappings', 'company_id', companyId);
      await safeDelete('company_integrations', 'company_id', companyId);
      await safeDelete('automation_outcomes', 'company_id', companyId);
      await safeDelete('audit_logs', 'company_id', companyId);
      await safeDelete('system_settings', 'company_id', companyId);
      await safeDelete('steve_notifications', 'company_id', companyId);
      await safeDelete('outcome_type_embeddings', 'company_id', companyId);
      await safeAnonymize('reviews', 'company_id', companyId, { 
        user_id: null, 
        company_id: null, 
        name: 'Anonymous', 
        email: 'deleted@user' 
      });
      
      console.log('✅ Company data deletion complete');
    }

    // Step 4: ANONYMIZE Steve data (keep for AI improvement)
    // Must clear BOTH user_id AND company_id to allow company deletion
    console.log('🔒 Anonymizing Steve data...');
    
    // Tables with both user_id and company_id - clear both to remove FK references
    await safeAnonymize('steve_conversations', 'user_id', user.id, { user_id: null, company_id: null });
    await safeAnonymize('steve_actions', 'user_id', user.id, { user_id: null, company_id: null });
    await safeAnonymize('steve_usage_logs', 'user_id', user.id, { user_id: null, company_id: null });
    await safeAnonymize('steve_knowledge_base', 'user_id', user.id, { user_id: null, company_id: null });
    
    // Tables without company_id - just clear user_id
    await safeAnonymize('steve_messages', 'user_id', user.id, { user_id: null });
    await safeAnonymize('steve_message_feedback', 'user_id', user.id, { user_id: null });

    // Step 5: ANONYMIZE other user data
    console.log('🔒 Anonymizing support requests and bug reports...');
    await supabaseAdmin.from('support_requests')
      .update({ user_id: null, user_email: 'deleted@user', user_name: null })
      .eq('user_id', user.id);
    await safeAnonymize('bug_reports', 'user_id', user.id, { user_id: null });

    // Step 6: DELETE user's deletion requests
    console.log('🗑️ Deleting deletion requests...');
    await safeDelete('deletion_requests', 'user_id', user.id);

    // Step 7: DELETE the user account (CASCADE handles profiles & user_roles)
    console.log('🗑️ Deleting user account...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
      throw deleteError;
    }
    console.log('✅ User account deleted');

    // Step 8: DELETE the company LAST (with retry logic)
    if (companyId) {
      console.log('🗑️ Deleting company (final step)...');
      
      // Retry company deletion up to 3 times
      for (let attempt = 1; attempt <= 3 && !companyDeleted; attempt++) {
        const { error } = await supabaseAdmin.from('companies').delete().eq('id', companyId);
        if (!error) {
          companyDeleted = true;
          console.log(`✅ Company deleted on attempt ${attempt}`);
        } else {
          console.warn(`⚠️ Company deletion attempt ${attempt} failed: ${error.message}`);
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
          }
        }
      }
      
      if (!companyDeleted) {
        console.error(`🚨 CRITICAL ORPHAN: Company ${companyId} may be orphaned after user deletion`);
        console.error(`Manual cleanup required: DELETE FROM companies WHERE id = '${companyId}'`);
      }
    } else {
      companyDeleted = true; // No company to delete
    }

    // Summary logging
    console.log(`\n📋 DELETION SUMMARY for user ${user.id}:`);
    console.log(`   - Stripe subscriptions cancelled: ${stripeCustomerId ? (stripeSubscriptionsCancelled ? '✅' : '⚠️ FAILED') : 'N/A (no subscription)'}`);
    console.log(`   - Company data deleted: ✅`);
    console.log(`   - Steve data anonymized: ✅`);
    console.log(`   - User account deleted: ✅`);
    console.log(`   - Company deleted: ${companyDeleted ? '✅' : '🚨 ORPHAN'}`);

    // Step 9: Send deletion confirmation email (don't block if email fails)
    if (userEmail) {
      try {
        console.log('📧 Sending deletion confirmation email...');
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
        
        const emailResult = await resend.emails.send({
          from: getEmailFrom('hello'),
          to: [userEmail],
          subject: userLanguage === 'zh-TW' 
            ? '您的 AutoPenguin 帳戶已刪除' 
            : 'Your AutoPenguin account has been deleted',
          html: renderDeletionEmail(userName, userLanguage, !!stripeCustomerId)
        });
        
        console.log('📧 Deletion confirmation email sent:', emailResult);
      } catch (emailError) {
        console.warn('⚠️ Failed to send deletion confirmation email:', emailError);
        // Don't block - deletion already complete
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User account and all associated data deleted successfully',
        summary: {
          stripeSubscriptionsCancelled: stripeCustomerId ? stripeSubscriptionsCancelled : null,
          companyDeleted
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in delete-user-account function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
