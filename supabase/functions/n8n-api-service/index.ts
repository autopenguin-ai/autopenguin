import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { classifyOutcome, uploadToMainTables, createNotification } from './classification.ts'

const DEBUG = Deno.env.get('DEBUG') === 'true';
const log = (...args: unknown[]) => { if (DEBUG) console.log(...args); };

// ARCHITECTURE NOTE:
// This service does NOT use a global N8N_API_TOKEN.
// Each company must configure their own n8n instance in Settings → Integrations.
// API keys are encrypted in Vault and retrieved per-company via company_integrations table.
// This ensures complete data isolation between companies.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Supabase Configuration  
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Safe URL path joining to prevent duplicate /api/v1 segments
function joinPath(baseUrl: string, path: string): string {
  const base = baseUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
  const cleanPath = path.trim();
  
  // If baseUrl already ends with /api or /api/v1, don't add it again
  if (base.endsWith('/api/v1') && cleanPath.startsWith('/api/v1')) {
    return base + cleanPath.replace('/api/v1', '');
  }
  if (base.endsWith('/api') && cleanPath.startsWith('/api')) {
    return base + cleanPath.replace('/api', '');
  }
  
  return base + cleanPath;
}

// Helper function to get company's n8n credentials from company_integrations
async function getCompanyN8nCredentials(supabase: any, company_id?: string) {
  if (!company_id) {
    log("No company_id provided");
    return null;
  }

  const { data: integration, error: integrationError } = await supabase
    .from('company_integrations')
    .select('integration_type, api_url')
    .eq('company_id', company_id)
    .eq('integration_type', 'n8n')
    .eq('is_active', true)
    .single();

  if (integrationError || !integration) {
    log(`No n8n integration found for company ${company_id}:`, integrationError);
    return null;
  }

  // Use the public RPC function to decrypt the API key
  const { data: apiKey, error: secretError } = await supabase.rpc('get_integration_api_key', {
    p_company_id: company_id,
    p_integration_type: 'n8n'
  });

  if (secretError) {
    log(`Failed to decrypt n8n API key for company ${company_id}:`, secretError);
    return null;
  }

  if (!apiKey) {
    log(`No API key found for company ${company_id}`);
    return null;
  }

  // Normalize api_url - ensure it starts with https:// or http://
  let normalizedUrl = integration.api_url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
    log(`Normalized n8n URL from "${integration.api_url}" to "${normalizedUrl}"`);
  }

  return {
    url: normalizedUrl,
    apiKey: apiKey
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get action from request body
    const requestBody = await req.json();
    const { action, company_id } = requestBody;
    
    log('N8N API Service called with action:', action, 'company_id:', company_id);

    switch (action) {
      case 'sync_executions':
        return await syncExecutions(supabase, company_id);
      case 'sync_executions_for_workflow':
        return await syncExecutionsForWorkflow(supabase, company_id, requestBody.n8n_workflow_id);
      case 'get_metrics':
        return await getMetrics(supabase, company_id);
    case 'get_workflow_metrics':
      return await getWorkflowMetrics(supabase, company_id, requestBody.windowDays);
      case 'sync_workflows':
        return await syncWorkflows(supabase, company_id);
      case 'activate_workflow':
        return await activateWorkflow(supabase, requestBody, company_id);
      case 'deactivate_workflow':
        return await deactivateWorkflow(supabase, requestBody, company_id);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in n8n-api-service:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function syncWorkflows(supabase: any, company_id?: string) {
  log('Syncing workflows from N8N...');

  // Get company-specific n8n credentials
  const credentials = await getCompanyN8nCredentials(supabase, company_id);
  
  if (!credentials) {
    log("No n8n integration configured for this company");
    return new Response(
      JSON.stringify({
        synced: 0,
        message: "No n8n integration configured. Please connect your n8n instance in Settings → Integrations."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { url: n8nUrl, apiKey: n8nApiKey } = credentials;

  try {
    // Fetch all workflows from company's n8n instance using safe path joining
    const workflowsUrl = joinPath(n8nUrl, '/api/v1/workflows');
    log(`Fetching workflows from: ${workflowsUrl}`);
    
    const workflowsResponse = await fetch(workflowsUrl, {
      headers: {
        "X-N8N-API-KEY": n8nApiKey,
        'Content-Type': 'application/json'
      },
    });

    if (!workflowsResponse.ok) {
      const contentType = workflowsResponse.headers.get('content-type') || '';
      const bodySnippet = await workflowsResponse.text();
      console.error(`[n8n-api-service] syncWorkflows failed:`, {
        url: workflowsUrl,
        status: workflowsResponse.status,
        contentType,
        bodyPreview: bodySnippet.slice(0, 200)
      });
      throw new Error(`Failed to fetch workflows (${workflowsResponse.status}): ${contentType.includes('html') ? 'HTML response (check API URL and key)' : bodySnippet.slice(0, 100)}`);
    }

    const workflows = await workflowsResponse.json();
    log(`Fetched workflows from N8N: ${workflows.data?.length || 0}`);

    // All workflows from this company's n8n belong to them - no tag filtering needed
    const workflowsToSync = workflows.data || [];

    // Upsert workflows with company_id
    for (const workflow of workflowsToSync) {
      await supabase.from("workflows").upsert({
        n8n_workflow_id: workflow.id.toString(),
        name: workflow.name,
        company_id: company_id,
        is_active: workflow.active || false,
        description: workflow.description || null,
        tags: (workflow.tags || []).map((tag: any) => typeof tag === 'object' ? tag.name : tag).filter(Boolean),
        last_synced_at: new Date().toISOString(),
        updated_at: workflow.updatedAt ? new Date(workflow.updatedAt).toISOString() : new Date().toISOString()
      }, {
        onConflict: 'n8n_workflow_id'
      });
    }

    log(`Synced ${workflowsToSync.length} workflows for company ${company_id}`);

    return new Response(
      JSON.stringify({
        synced: workflowsToSync.length,
        message: `Successfully synced ${workflowsToSync.length} workflows`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error syncing workflows:", error);
    return new Response(
      JSON.stringify({
        synced: 0,
        error: (error as Error).message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function syncExecutions(supabase: any, company_id?: string) {
  // Get company-specific n8n credentials
  const credentials = await getCompanyN8nCredentials(supabase, company_id);
  
  if (!credentials) {
    log("No n8n integration configured for this company");
    return new Response(
      JSON.stringify({
        processed: 0,
        message: "No n8n integration configured"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { url: n8nUrl, apiKey: n8nApiKey } = credentials;

  try {
    // Fetch workflows for this company only
    const { data: workflows, error: workflowsError } = await supabase
      .from("workflows")
      .select("*")
      .eq('company_id', company_id);

    if (workflowsError || !workflows || workflows.length === 0) {
      log("No workflows found for company");
      return new Response(
        JSON.stringify({ processed: 0, message: "No workflows to process" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log(`Found ${workflows.length} workflows for company`);

    let totalProcessed = 0;
    // Process ALL active workflows (not just chatbot ones)
    const activeWorkflows = workflows.filter((w: any) => w.is_active);
    log(`📋 Processing ${activeWorkflows.length} active workflows (removed chatbot-only filter)`);

    for (const workflow of activeWorkflows) {
      log(`Processing executions for workflow: ${workflow.name}`);
      log(`- ${workflow.name} (ID: ${workflow.n8n_workflow_id})`);

      try {
        // Use joinPath and request full execution data
        const executionsUrl = joinPath(n8nUrl, `/api/v1/executions?workflowId=${workflow.n8n_workflow_id}&limit=20&includeData=true&status=success`);
        const executionsResponse = await fetch(executionsUrl, {
          headers: { 
            "X-N8N-API-KEY": n8nApiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'autopenguin-n8n-sync/1.0'
          },
        });

        if (!executionsResponse.ok) {
          const contentType = executionsResponse.headers.get('content-type') || '';
          const bodySnippet = await executionsResponse.text();
          console.error(`[n8n-api-service] Failed to fetch executions for ${workflow.name}:`, {
            url: executionsUrl,
            status: executionsResponse.status,
            contentType,
            bodyPreview: bodySnippet.slice(0, 300)
          });
          if (contentType.includes('html')) {
            console.error('⚠️ HTML page received instead of JSON - likely proxy/WAF issue or wrong API path. Check base URL configuration.');
          }
          continue;
        }

        const executionsData = await executionsResponse.json();
        const executions = executionsData.data || [];
        log(`Fetched ${executions.length} executions for ${workflow.name}`);

        for (const execution of executions) {
          log(`Processing execution: ${execution.id}`);
          await processExecution(supabase, execution, workflow, company_id);
          totalProcessed++;
        }
      } catch (error) {
        console.error(`Error processing workflow ${workflow.name}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        processed: totalProcessed,
        message: `Processed ${totalProcessed} executions from ${activeWorkflows.length} active workflows`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in syncExecutions:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// NEW: Targeted sync for debugging a specific workflow
async function syncExecutionsForWorkflow(supabase: any, company_id?: string, n8n_workflow_id?: string) {
  if (!n8n_workflow_id) {
    return new Response(
      JSON.stringify({ error: 'n8n_workflow_id required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  log(`🎯 Targeted sync for workflow: ${n8n_workflow_id}`);

  const credentials = await getCompanyN8nCredentials(supabase, company_id);
  if (!credentials) {
    return new Response(
      JSON.stringify({ error: 'No n8n integration configured' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { url: n8nUrl, apiKey: n8nApiKey } = credentials;

  try {
    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('n8n_workflow_id', n8n_workflow_id)
      .eq('company_id', company_id)
      .single();

    if (workflowError || !workflow) {
      return new Response(
        JSON.stringify({ error: 'Workflow not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log(`📋 Syncing executions for: ${workflow.name}`);

    // Fetch executions with full data
    const executionsUrl = joinPath(n8nUrl, `/api/v1/executions?workflowId=${n8n_workflow_id}&limit=20&includeData=true&status=success`);
    log(`Fetching from: ${executionsUrl}`);
    
    const executionsResponse = await fetch(executionsUrl, {
      headers: {
        "X-N8N-API-KEY": n8nApiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'autopenguin-n8n-sync/1.0'
      },
    });

    if (!executionsResponse.ok) {
      const contentType = executionsResponse.headers.get('content-type') || '';
      const bodySnippet = await executionsResponse.text();
      console.error(`[n8n-api-service] Failed to fetch executions:`, {
        url: executionsUrl,
        status: executionsResponse.status,
        contentType,
        bodyPreview: bodySnippet.slice(0, 300)
      });
      
      return new Response(
        JSON.stringify({
          error: `Failed to fetch executions (${executionsResponse.status})`,
          details: contentType.includes('html') 
            ? 'HTML response received - check API URL and authentication'
            : bodySnippet.slice(0, 200)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const executionsData = await executionsResponse.json();
    const executions = executionsData.data || [];
    log(`✅ Fetched ${executions.length} executions`);

    let processed = 0;
    for (const execution of executions) {
      log(`Processing execution ${execution.id}...`);
      await processExecution(supabase, execution, workflow, company_id);
      processed++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        workflow: workflow.name,
        processed,
        message: `Processed ${processed} executions for ${workflow.name}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in syncExecutionsForWorkflow:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function processExecution(supabase: any, execution: any, targetWorkflow: any, company_id?: string) {
  // Early return: Check if this execution was already processed by checking for existing records
  const executionId = execution.id.toString();
  
  // Check viewings
  const { data: existingViewing } = await supabase
    .from('viewings')
    .select('id')
    .eq('n8n_execution_id', executionId)
    .eq('company_id', company_id)
    .maybeSingle();
  
  if (existingViewing) {
    log(`⏭️ Execution ${executionId} already processed (viewing exists), skipping`);
    return;
  }
  
  // Check tasks
  const { data: existingTask } = await supabase
    .from('tasks')
    .select('id')
    .eq('company_id', company_id)
    .filter('automation_resolution_data', 'cs', `{"execution_id":"${executionId}"}`)
    .maybeSingle();
  
  if (existingTask) {
    log(`⏭️ Execution ${executionId} already processed (task exists), skipping`);
    return;
  }
  
  // Check notifications
  const { data: existingNotification } = await supabase
    .from('steve_notifications')
    .select('id')
    .eq('company_id', company_id)
    .filter('metadata', 'cs', `{"execution_id":"${executionId}"}`)
    .maybeSingle();
  
  if (existingNotification) {
    log(`⏭️ Execution ${executionId} already processed (notification exists), skipping`);
    return;
  }
  
  const executionStatus = execution.finished ? 
    (execution.status === 'success' ? 'SUCCESS' : 'FAILED') : 
    'RUNNING';

  const { error: runError } = await supabase.from("workflow_runs").upsert({
    n8n_execution_id: execution.id.toString(),
    workflow_id: targetWorkflow.n8n_workflow_id,
    company_id: company_id,
    status: executionStatus,
    trigger_type: execution.mode || 'manual',
    input_data: execution.data?.triggerData || null,
    output_data: execution.data?.resultData || null,
    started_at: execution.startedAt,
    finished_at: execution.stoppedAt,
    error_message: execution.data?.resultData?.error?.message || null,
  }, {
    onConflict: 'n8n_execution_id'
  });

  if (runError) {
    console.error("Error storing workflow run:", runError);
    return;
  }

  await extractChatbotConversationData(supabase, execution, company_id);
  await extractChatbotMetrics(supabase, execution, company_id);
  
  // NEW: Auto-classify and upload outcomes with 3-tier confidence system
  if (company_id && executionStatus === 'SUCCESS') {
    const classification = await classifyOutcome(execution, targetWorkflow, company_id, supabase);
    
    if (classification.confidence >= 0.90) {
      // HIGH CONFIDENCE (90%+): Auto-upload silently, no notification
      log(`✅ High confidence (${Math.round(classification.confidence * 100)}%): Auto-uploading ${classification.metric_key}`);
      await supabase.from('automation_outcomes').insert({
        company_id,
        metric_key: classification.metric_key,
        metric_value: 1,
        description: `Auto-detected (high confidence): ${classification.metric_key}`,
        status: 'confirmed',
        confidence: classification.confidence,
        detection_layer: classification.detection_layer,
      });
      await uploadToMainTables(classification, execution, supabase, company_id);
      
    } else if (classification.confidence >= 0.70) {
      // MEDIUM CONFIDENCE (70-89%): Auto-upload + silent learning, no notification
      log(`🔄 Medium confidence (${Math.round(classification.confidence * 100)}%): Silent learning for ${classification.metric_key}`);
      await supabase.from('automation_outcomes').insert({
        company_id,
        metric_key: classification.metric_key,
        metric_value: 1,
        description: `Learning silently: ${classification.metric_key}`,
        status: 'learning',
        confidence: classification.confidence,
        detection_layer: classification.detection_layer,
      });
      await uploadToMainTables(classification, execution, supabase, company_id);
      
    } else {
      // LOW CONFIDENCE (<70%): Notify user via bell notification
      log(`⚠️ Low confidence (${Math.round(classification.confidence * 100)}%): Creating notification for ${classification.metric_key}`);
      await supabase.from('automation_outcomes').insert({
        company_id,
        metric_key: classification.metric_key,
        metric_value: 1,
        description: `Pending review: ${classification.metric_key}`,
        status: 'pending_review',
        confidence: classification.confidence,
        detection_layer: classification.detection_layer,
      });
      await createNotification(classification, supabase, company_id);
    }
  }
}

// Smart regex-based field extraction (multilingual support)
function extractEmailFromData(data: any): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  
  function searchRecursive(obj: any): string | null {
    if (typeof obj === 'string' && emailRegex.test(obj)) return obj;
    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        const found = searchRecursive(value);
        if (found) return found;
      }
    }
    return null;
  }
  
  return searchRecursive(data);
}

function extractPhoneFromData(data: any): string | null {
  const phoneRegex = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}/;
  
  function searchRecursive(obj: any): string | null {
    if (typeof obj === 'string' && phoneRegex.test(obj)) return obj;
    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        const found = searchRecursive(value);
        if (found) return found;
      }
    }
    return null;
  }
  
  return searchRecursive(data);
}

function findFieldByNames(json: any, fieldNames: string[]): any {
  for (const field of fieldNames) {
    if (json[field]) return json[field];
  }
  return null;
}

async function extractChatbotConversationData(supabase: any, execution: any, company_id?: string) {
  try {
    const executionData = execution.data?.resultData?.runData;
    if (!executionData) return;

    let userInput = null;
    let aiResponse = null;
    let contactName = null;
    let contactEmail = null;
    let contactPhone = null;

    for (const [nodeName, nodeData] of Object.entries(executionData)) {
      const runs = nodeData as any[];
      if (!runs || runs.length === 0) continue;

      for (const run of runs) {
        if (!run.data?.main?.[0]) continue;
        
        for (const item of run.data.main[0]) {
          const json = item.json || {};
          
          if (json.chatInput || json.input || json.message) {
            userInput = json.chatInput || json.input || json.message;
            contactName = json.name || json.user_name || contactName;
            contactEmail = json.email || json.user_email || contactEmail;
            contactPhone = json.phone || json.user_phone || contactPhone;
          }
          
          if (json.output || json.response || json.text) {
            aiResponse = json.output || json.response || json.text;
          }
        }
      }
    }

    if (!userInput && !aiResponse) return;

    // Fix: Remove custom ID, let PostgreSQL generate UUID
    const { data: conv, error: convError } = await supabase.from("conversations").upsert({
      n8n_execution_id: execution.id.toString(),
      company_id: company_id,
      contact_name: contactName || "Unknown",
      contact_email: contactEmail,
      contact_phone: contactPhone,
      last_message: aiResponse || userInput,
      last_message_timestamp: execution.stoppedAt || new Date().toISOString(),
    }, {
      onConflict: 'n8n_execution_id'
    }).select().single();

    if (convError || !conv) {
      console.error("Error creating conversation:", convError);
      return;
    }

    if (userInput) {
      await supabase.from("conversation_messages").insert({
        conversation_id: conv.id,
        company_id: company_id,
        n8n_execution_id: execution.id.toString(),
        content: userInput,
        is_outgoing: false,
        message_type: "CHAT",
      });
    }

    if (aiResponse) {
      await supabase.from("conversation_messages").insert({
        conversation_id: conv.id,
        company_id: company_id,
        n8n_execution_id: execution.id.toString(),
        content: aiResponse,
        is_outgoing: true,
        message_type: "CHAT",
      });
    }
  } catch (error) {
    console.error("Error extracting conversation data:", error);
  }
}

async function extractChatbotMetrics(supabase: any, execution: any, company_id?: string) {
  log(`📊 Extracting metrics from execution ${execution.id}`);
  
  try {
    const executionData = execution.data?.resultData?.runData;
    if (!executionData) return;

    const metrics: any[] = [];
    let leadEmail = null;
    let leadName = null;
    let leadPhone = null;

    // Multilingual field patterns
    const emailFields = ['email', 'user_email', 'contact_email', '電郵'];
    const nameFields = ['name', 'full_name', 'contact_name', '姓名'];
    const phoneFields = ['phone', 'mobile', 'telephone', '電話'];

    for (const [nodeName, nodeData] of Object.entries(executionData)) {
      const runs = nodeData as any[];
      if (!runs || runs.length === 0) continue;

      for (const run of runs) {
        if (!run.data?.main?.[0]) continue;
        
        for (const item of run.data.main[0]) {
          const json = item.json || {};
          
          // Smart field extraction
          if (!leadEmail) leadEmail = findFieldByNames(json, emailFields) || extractEmailFromData(json);
          if (!leadName) leadName = findFieldByNames(json, nameFields);
          if (!leadPhone) leadPhone = findFieldByNames(json, phoneFields) || extractPhoneFromData(json);
          
          if (json.matched_properties || json.property_matches) {
            const count = Array.isArray(json.matched_properties) ? 
              json.matched_properties.length : 
              (json.property_matches?.length || 1);
            metrics.push({
              metric_key: "property_matches",
              metric_value: count,
              description: `Found ${count} matching properties`,
            });
          }
          
          if (json.booking_confirmed || json.viewing_scheduled) {
            metrics.push({
              metric_key: "bookings_scheduled",
              metric_value: 1,
              description: "Viewing/meeting scheduled",
            });
          }
          
          if (json.email_sent || nodeName.toLowerCase().includes('send')) {
            metrics.push({
              metric_key: "emails_sent",
              metric_value: 1,
              description: `Email sent via ${nodeName}`,
            });
          }
          
          if (json.handoff_requested || json.human_required) {
            metrics.push({
              metric_key: "human_handoffs",
              metric_value: 1,
              description: "Human assistance requested",
            });
          }
        }
      }
    }

    if (leadEmail) {
      metrics.push({
        metric_key: "leads_generated",
        metric_value: 1,
        description: `Lead captured: ${leadName || leadEmail}`,
      });

      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("client_id", leadEmail)
        .single();

      if (!existingLead) {
        const { data: client } = await supabase
          .from("clients")
          .upsert({
            email: leadEmail,
            first_name: leadName?.split(' ')[0] || "Unknown",
            last_name: leadName?.split(' ').slice(1).join(' ') || "",
            phone: leadPhone,
            company_id: company_id,
            status: "ACTIVE",
          }, {
            onConflict: 'email'
          })
          .select()
          .single();

        if (client) {
          await supabase.from("leads").insert({
            client_id: client.id,
            source: "chatbot",
            stage: "NEW",
            priority: "MEDIUM",
            company_id: company_id,
            created_by_automation: true,
          });
        }
      }
    }

    for (const metric of metrics) {
      await supabase.from("automation_outcomes").insert({
        ...metric,
        company_id: company_id,
      });
    }
  } catch (error) {
    console.error("Error extracting metrics:", error);
  }
}

async function getWorkflowMetrics(supabase: any, company_id?: string, windowDays?: number | null) {
  log(`📊 Fetching workflow metrics for company ${company_id} (window: ${windowDays === null ? 'all time' : windowDays + ' days'})`);

  // Get company-specific n8n credentials
  const credentials = await getCompanyN8nCredentials(supabase, company_id);
  
  if (!credentials) {
    log("No n8n integration configured for this company");
    return new Response(
      JSON.stringify({
        activeWorkflows: 0,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { url: n8nUrl, apiKey: n8nApiKey } = credentials;

  try {
    // 1. Get active workflows from N8N
    const workflowsUrl = joinPath(n8nUrl, '/api/v1/workflows?active=true');
    const workflowsResponse = await fetch(workflowsUrl, {
      headers: { 
        "X-N8N-API-KEY": n8nApiKey,
        'Content-Type': 'application/json'
      },
    });

    if (!workflowsResponse.ok) {
      throw new Error(`Failed to fetch workflows: ${workflowsResponse.status}`);
    }

    const workflowsData = await workflowsResponse.json();
    const activeWorkflows = workflowsData.data || [];
    const activeWorkflowCount = activeWorkflows.length;
    log(`🔄 Active workflows: ${activeWorkflowCount}`);

    // 2. Calculate date filter cutoff
    let cutoffDate: Date | null = null;
    if (windowDays !== null && windowDays !== undefined) {
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - windowDays);
      log(`🕒 Filtering executions to last ${windowDays} days (since ${cutoffDate.toISOString()})`);
    } else {
      log('🕒 Fetching all-time execution history');
    }

    // 3. Fetch executions for each active workflow (n8n API requires workflowId)
    let allExecutions: any[] = [];
    for (const workflow of activeWorkflows) {
      try {
        const executionsUrl = joinPath(n8nUrl, `/api/v1/executions?workflowId=${workflow.id}&limit=100`);
        const executionsResponse = await fetch(executionsUrl, {
          headers: { 
            "X-N8N-API-KEY": n8nApiKey,
            'Content-Type': 'application/json'
          },
        });

        if (executionsResponse.ok) {
          const executionsData = await executionsResponse.json();
          const executions = executionsData.data || [];
          allExecutions = allExecutions.concat(executions);
        }
      } catch (error) {
        console.error(`Error fetching executions for workflow ${workflow.id}:`, error);
      }
    }

    log(`📦 Fetched ${allExecutions.length} total executions from ${activeWorkflowCount} workflows`);

    // 4. Filter by date if needed
    if (cutoffDate) {
      allExecutions = allExecutions.filter((ex: any) => {
        const executionDate = new Date(ex.startedAt || ex.stoppedAt);
        return executionDate >= cutoffDate;
      });
      log(`📦 Filtered to ${allExecutions.length} executions within date range`);
    }

    // 5. Count statuses from filtered executions
    const totalExecutions = allExecutions.length;
    const successfulExecutions = allExecutions.filter((ex: any) => 
      ex.status === "success" && ex.finished === true
    ).length;
    const failedExecutions = allExecutions.filter((ex: any) => 
      ex.status === "error" || ex.status === "crashed" || ex.status === "canceled"
    ).length;

    const successRate = totalExecutions > 0 
      ? (successfulExecutions / totalExecutions) * 100 
      : 0;

    log(`📊 Metrics: ${totalExecutions} total, ${successfulExecutions} success, ${failedExecutions} failed, ${Math.round(successRate)}% success rate`);

    return new Response(
      JSON.stringify({
        activeWorkflows: activeWorkflowCount,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: Math.round(successRate),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching workflow metrics:", error);
    return new Response(
      JSON.stringify({
        activeWorkflows: 0,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        error: (error as Error).message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Fallback toggler: tries PATCH first, then POST /activate|/deactivate if PATCH isn't allowed (405/404)
async function toggleWorkflowWithFallback(n8nUrl: string, n8nApiKey: string, workflowId: string, activate: boolean) {
  const patchUrl = joinPath(n8nUrl, `/api/v1/workflows/${encodeURIComponent(workflowId)}`);
  log(`⚙️ Toggle (PATCH) URL: ${patchUrl} active=${activate}`);
  const patchResp = await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      "X-N8N-API-KEY": n8nApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ active: activate }),
  });

  if (patchResp.ok) {
    return { ok: true } as const;
  }

  const patchType = patchResp.headers.get('content-type') || '';
  const patchText = await patchResp.text();

  if (patchResp.status === 405 || patchResp.status === 404) {
    const action = activate ? 'activate' : 'deactivate';
    const fallbackUrl = joinPath(n8nUrl, `/api/v1/workflows/${encodeURIComponent(workflowId)}/${action}`);
    log(`↩️ Fallback (POST) URL: ${fallbackUrl}`);
    const fbResp = await fetch(fallbackUrl, {
      method: "POST",
      headers: {
        "X-N8N-API-KEY": n8nApiKey,
        "Content-Type": "application/json",
      },
    });
    if (fbResp.ok) {
      return { ok: true } as const;
    }
    const fbType = fbResp.headers.get('content-type') || '';
    const fbText = await fbResp.text();
    return { 
      ok: false as const, 
      status: fbResp.status, 
      message: fbType.includes('html') 
        ? 'n8n returned HTML error page on fallback. Check API URL/proxy and allow POST.' 
        : fbText.slice(0, 200),
      details: { patch: { status: patchResp.status, body: patchType.includes('html') ? 'html' : patchText.slice(0, 120) }, fallback: { status: fbResp.status, url: fallbackUrl } }
    };
  }

  return { 
    ok: false as const, 
    status: patchResp.status, 
    message: patchType.includes('html') 
      ? 'n8n returned HTML error page. Check API URL and allow PATCH.' 
      : patchText.slice(0, 200),
    details: { patch: { status: patchResp.status, url: patchUrl } }
  };
}

async function getMetrics(supabase: any, company_id?: string) {
  log("Fetching dashboard metrics...");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: newLeads } = await supabase
    .from("leads")
    .select("id")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { data: deals } = await supabase
    .from("deals")
    .select("deal_value, status")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const dealsWon = deals?.filter((d: any) => d.status === "WON").length || 0;
  const revenue = deals
    ?.filter((d: any) => d.status === "WON")
    .reduce((sum: number, d: any) => sum + (parseFloat(d.deal_value) || 0), 0) || 0;

  const { data: tickets } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("type", "TICKET")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const openTickets = tickets?.filter((t: any) => t.status === "OPEN").length || 0;

  const { data: automationLeads } = await supabase
    .from("leads")
    .select("id")
    .eq("created_by_automation", true)
    .gte("created_at", thirtyDaysAgo.toISOString());

  return new Response(
    JSON.stringify({
      newLeads: newLeads?.length || 0,
      dealsWon,
      revenue,
      openTickets,
      avgResponseTime: "2.5h",
      automationLeads: automationLeads?.length || 0,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function activateWorkflow(supabase: any, requestData: any, company_id?: string) {
  const { workflow_id } = requestData;
  
  log('🔵 ACTIVATE REQUEST:', { workflow_id, company_id });

  // Get company-specific n8n credentials
  const credentials = await getCompanyN8nCredentials(supabase, company_id);
  log('🔵 Credentials check:', credentials ? 'Found' : 'NOT FOUND');
  
  if (!credentials) {
    console.error('❌ ACTIVATE FAILED: No n8n integration configured for company', company_id);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "No n8n integration configured. Please set up your n8n instance in Settings → Integrations." 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { url: n8nUrl, apiKey: n8nApiKey } = credentials;

  try {
    const result = await toggleWorkflowWithFallback(n8nUrl, n8nApiKey, workflow_id, true);
    if (!result.ok) {
      const msg = `Activation failed (${result.status || 'unknown'}). ${result.message || 'Unknown error.'}`;
      console.error('❌ ACTIVATE FAILED (after fallback):', { workflow_id, details: result.details, msg });
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updateResult = await supabase
      .from("workflows")
      .update({ is_active: true })
      .eq("n8n_workflow_id", workflow_id)
      .eq("company_id", company_id);
    
    log('✅ ACTIVATE SUCCESS:', { workflow_id, updateResult });

    return new Response(
      JSON.stringify({ success: true, message: "Workflow activated successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("❌ Error activating workflow:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function deactivateWorkflow(supabase: any, requestData: any, company_id?: string) {
  const { workflow_id } = requestData;
  
  log('🔴 DEACTIVATE REQUEST:', { workflow_id, company_id });

  // Get company-specific n8n credentials
  const credentials = await getCompanyN8nCredentials(supabase, company_id);
  log('🔴 Credentials check:', credentials ? 'Found' : 'NOT FOUND');
  
  if (!credentials) {
    console.error('❌ DEACTIVATE FAILED: No n8n integration configured for company', company_id);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "No n8n integration configured. Please set up your n8n instance in Settings → Integrations." 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { url: n8nUrl, apiKey: n8nApiKey } = credentials;

  try {
    const result = await toggleWorkflowWithFallback(n8nUrl, n8nApiKey, workflow_id, false);
    if (!result.ok) {
      const msg = `Deactivation failed (${result.status || 'unknown'}). ${result.message || 'Unknown error.'}`;
      console.error('❌ DEACTIVATE FAILED (after fallback):', { workflow_id, details: result.details, msg });
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updateResult = await supabase
      .from("workflows")
      .update({ is_active: false })
      .eq("n8n_workflow_id", workflow_id)
      .eq("company_id", company_id);
    
    log('✅ DEACTIVATE SUCCESS:', { workflow_id, updateResult });

    return new Response(
      JSON.stringify({ success: true, message: "Workflow deactivated successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("❌ Error deactivating workflow:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}