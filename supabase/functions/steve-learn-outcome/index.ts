import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { notification_id, workflow_id, confirmed_metric_key, company_id, execution_id, custom_description } = await req.json();

    console.log('Learning outcome:', { notification_id, workflow_id, confirmed_metric_key, custom_description });

    // Update workflow mapping with user confirmation
    const { error: mappingError } = await supabase
      .from('workflow_metric_mappings')
      .upsert({
        company_id,
        n8n_workflow_id: workflow_id,
        inferred_metric_key: confirmed_metric_key,
        confidence: 1.0,
        detection_layer: 'user_confirmed',
        override_metric_key: confirmed_metric_key,
        confirmed_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id,n8n_workflow_id'
      });

    if (mappingError) {
      console.error('Error updating mapping:', mappingError);
      throw mappingError;
    }

    // Learn vector embedding from user confirmation
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (OPENAI_API_KEY) {
      try {
        // Build description from workflow name and custom description
        let workflowDescription = `User confirmed: ${confirmed_metric_key} for workflow "${workflow_id}"`;
        
        if (custom_description && custom_description.trim()) {
          workflowDescription += `\n\nUser Description: ${custom_description.trim()}`;
          workflowDescription += `\n\nContext: This workflow was initially unclear to Steve (marked as "unknown"), but the user explained its purpose. This description helps Steve understand similar workflows in the future.`;
        }
        
        // Generate embedding
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: workflowDescription,
            model: 'text-embedding-3-small',
          }),
        });
        
        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;
          
          // Store user-confirmed embedding
          await supabase.from('outcome_type_embeddings').insert({
            metric_key: confirmed_metric_key,
            description: workflowDescription,
            language: 'mixed',
            embedding,
            source: 'user_confirmed',
            company_id,
            usage_count: 1,
            last_used_at: new Date().toISOString(),
          });
          
          console.log('✅ Learned new embedding from user confirmation');
        }
      } catch (error) {
        console.error('⚠️ Failed to learn embedding:', error);
        // Don't fail the entire request
      }
    }

    // Update pending outcomes to confirmed
    const { error: outcomeError } = await supabase
      .from('automation_outcomes')
      .update({ 
        status: 'confirmed', 
        metric_key: confirmed_metric_key,
        confidence: 1.0,
        detection_layer: 'user_confirmed'
      })
      .eq('workflow_run_id', execution_id)
      .eq('status', 'pending_review');

    if (outcomeError) {
      console.error('Error updating outcomes:', outcomeError);
    }

    // Mark notification as reviewed
    const { error: notificationError } = await supabase
      .from('steve_notifications')
      .update({ 
        status: 'reviewed', 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', notification_id);

    if (notificationError) {
      console.error('Error updating notification:', notificationError);
    }

    // TODO: Retroactively upload data to main tables based on metric_key
    // This will be implemented as part of the uploadToMainTables function

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Steve learned successfully! Future executions will use this mapping.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in steve-learn-outcome:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
