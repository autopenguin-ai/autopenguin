import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user's company
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: 'No company found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's preferred language from request body (default to 'en')
    const body = await req.json().catch(() => ({}));
    const userLanguage = body.language || 'en';

    // Fetch pending outcome_clarification notifications
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('steve_notifications')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('notification_type', 'outcome_clarification')
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    console.log(`Found ${notifications?.length || 0} pending notifications to backfill`);

    let updated = 0;
    let skipped = 0;

    for (const notification of notifications || []) {
      const metadata = notification.metadata || {};
      const detection_layer = metadata.detection_layer;
      const metric_key = metadata.suggested_mapping || 'unknown';
      const confidencePercent = Math.round((metadata.confidence || 0) * 100);

      let message = '';

      switch (detection_layer) {
        case 'vector_semantic': {
          const similarity = Math.round((metadata.vector_similarity || 0) * 100);
          const matched = metadata.matched_description || 'a known pattern';
          const missing = getMissingFields(metric_key, metadata);
          if (userLanguage === 'zh') {
            message = `與「${matched}」語義相似（${similarity}%）。建議：${metric_key}。缺少欄位：${missing.join('、') || '無'}。`;
          } else {
            message = `Found semantic match to "${matched}" (${similarity}% similarity). Suggested: ${metric_key}. Missing expected fields: ${missing.join(', ') || 'none'}.`;
          }
          break;
        }

        case 'heuristic': {
          const expected = getExpectedFields(metric_key);
          const found = getFoundFields(metadata);
          if (userLanguage === 'zh') {
            message = `關鍵字顯示為 ${metric_key}。信心 ${confidencePercent}%，因預期 [${expected.join('、')}] 但實際為 [${found.join('、') || '無關鍵資料'}]。`;
          } else {
            message = `Keywords suggest ${metric_key}. Confidence ${confidencePercent}% because expected [${expected.join(', ')}] but found [${found.join(', ') || 'no key data'}].`;
          }
          break;
        }

      case 'ai': {
        const reasoning = metadata.execution_summary?.reasoning || 'unclear patterns in the execution data';
        const expected = getExpectedFields(metric_key);
        const found = getFoundFields(metadata);
        const missing = getMissingFields(metric_key, metadata);
        
        if (userLanguage === 'zh') {
          message = `AI 分析顯示可能為 ${metric_key}（信心 ${confidencePercent}%），原因：${reasoning}。\n\n預期欄位：${expected.join('、')}\n實際欄位：${found.length > 0 ? found.join('、') : '無關鍵資料'}\n缺少欄位：${missing.length > 0 ? missing.join('、') : '無'}`;
        } else {
          message = `AI analysis suggests this could be a ${metric_key} (${confidencePercent}% confidence) because: ${reasoning}.\n\nExpected: ${expected.join(', ')}\nFound: ${found.length > 0 ? found.join(', ') : 'no key data fields'}\nMissing: ${missing.length > 0 ? missing.join(', ') : 'none'}`;
        }
        break;
      }

      default: {
        const nodes = metadata.execution_summary?.nodes || 'unknown nodes';
        const found = getFoundFields(metadata);
        
        if (userLanguage === 'zh') {
          message = `無法判定成果（信心 ${confidencePercent}%）。\n\n節點：${nodes}\n偵測到的資料欄位：${found.length > 0 ? found.join('、') : '無'}\n\n沒有明確模式（會議／名單／客服單／郵件／交易）。`;
        } else {
          message = `Couldn't determine an outcome (${confidencePercent}% confidence).\n\nNodes: ${nodes}\nData fields seen: ${found.length > 0 ? found.join(', ') : 'none'}\n\nNo clear patterns matching: meetings, leads, tickets, emails, or deals.`;
        }
        break;
      }
      }

      // Update the notification
      const { error: updateError } = await supabaseClient
        .from('steve_notifications')
        .update({
          message,
          title: `Need help understanding "${metadata.workflow_name || 'this workflow'}"`,
        })
        .eq('id', notification.id);

      if (updateError) {
        console.error(`Failed to update notification ${notification.id}:`, updateError);
        skipped++;
      } else {
        updated++;
      }
    }

    console.log(`Backfill complete: ${updated} updated, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications?.length || 0,
        updated,
        skipped,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getExpectedFields(metric_key: string): string[] {
  const fieldMap: Record<string, string[]> = {
    'meeting_booked': ['scheduled_time', 'contact_email', 'contact_name'],
    'lead_created': ['email', 'name or phone'],
    'ticket_created': ['ticket_id', 'status'],
    'ticket_resolved': ['ticket_id', 'status=closed'],
    'email_sent': ['recipient', 'message_id'],
    'deal_won': ['deal_value', 'status=won'],
    'unknown': ['any identifiable business outcome'],
  };
  return fieldMap[metric_key] || ['unknown fields'];
}

function getFoundFields(metadata: any): string[] {
  const excludeKeys = ['workflow_id', 'workflow_name', 'execution_id', 'detection_layer', 'confidence', 'suggested_mapping', 'matched_description', 'matched_embedding_id', 'vector_similarity', 'execution_summary'];
  return Object.keys(metadata).filter(k => !excludeKeys.includes(k));
}

function getMissingFields(metric_key: string, metadata: any): string[] {
  const expected = getExpectedFields(metric_key);
  const found = getFoundFields(metadata);
  return expected.filter(field => !found.some(f => f.includes(field.split(' ')[0])));
}
