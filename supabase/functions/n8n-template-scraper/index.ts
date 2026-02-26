import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface N8nApiWorkflow {
  id: number;
  name: string;
  description?: string;
  workflow?: {
    nodes?: Array<{ type: string; name?: string }>;
    connections?: Record<string, unknown>;
  };
  user?: {
    username?: string;
    name?: string;
  };
  image?: string;
  totalViews?: number;
  categories?: Array<{ name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🚀 Starting n8n template fetching via API...');

    // Parse request body for options
    let limit = 50;
    let page = 1;
    
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 100);
      if (body.page) page = body.page;
    } catch {
      // Use defaults if no body
    }

    // Step 1: Fetch workflows from n8n.io public API
    console.log(`📡 Fetching workflows from n8n.io API (limit ${limit})...`);
    
    const apiUrl = `https://api.n8n.io/api/workflows?rows=${limit}`;
    
    const n8nResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AutoPenguin-Marketplace/1.0',
      },
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ n8n API error:', errorText);
      throw new Error(`n8n API error: ${n8nResponse.status} - ${errorText}`);
    }

    const apiData = await n8nResponse.json();
    const workflows: N8nApiWorkflow[] = apiData.data || apiData.workflows || apiData || [];
    
    console.log(`📦 Received ${workflows.length} workflows from n8n API`);

    if (workflows.length === 0) {
      // Try alternate endpoint structure
      console.log('⚠️ No workflows found, checking alternate structure...');
      console.log('Response keys:', Object.keys(apiData));
    }

    // Step 2: Upsert into marketplace_templates
    let upsertedCount = 0;
    let steveKnowledgeCount = 0;

    for (const workflow of workflows) {
      try {
        const workflowId = String(workflow.id);
        const title = workflow.name || 'Untitled Workflow';
        const description = workflow.description || null;
        const creatorName = workflow.user?.name || workflow.user?.username || null;
        const previewImage = workflow.image || null;
        const categories = workflow.categories?.map(c => c.name) || [];
        
        // Extract nodes from workflow JSON
        const nodesUsed: string[] = [];
        if (workflow.workflow?.nodes) {
          for (const node of workflow.workflow.nodes) {
            const nodeType = node.type?.replace('n8n-nodes-base.', '') || node.name;
            if (nodeType && !nodesUsed.includes(nodeType)) {
              nodesUsed.push(nodeType);
            }
          }
        }

        // Upsert to marketplace_templates (full data with attribution)
        const { error: upsertError } = await supabase
          .from('marketplace_templates')
          .upsert({
            external_id: workflowId,
            title: title,
            description: description,
            preview_image_url: previewImage,
            categories: categories,
            creator_name: creatorName,
            creator_url: creatorName ? `https://n8n.io/creators/${workflow.user?.username || ''}` : null,
            original_url: `https://n8n.io/workflows/${workflowId}`,
            workflow_json: workflow.workflow || null,
            nodes_used: nodesUsed,
            is_free: true,
            source: 'n8n_official',
            last_scraped_at: new Date().toISOString(),
          }, { 
            onConflict: 'external_id',
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error(`⚠️ Failed to upsert template ${workflowId}:`, upsertError);
          continue;
        }

        upsertedCount++;
        console.log(`✅ Upserted: ${title}`);

        // Step 3: Sync technical-only data to steve_knowledge_base
        if (workflow.workflow || nodesUsed.length > 0) {
          const workflowContent = `## Workflow: ${title}

### Purpose
${description || 'No description available'}

### Nodes Used
${nodesUsed.length > 0 ? nodesUsed.map(n => `- ${n}`).join('\n') : 'Not specified'}

### Workflow JSON
\`\`\`json
${JSON.stringify(workflow.workflow || {}, null, 2)}
\`\`\``;

          // Generate embedding for the knowledge entry
          let embedding = null;
          if (OPENAI_API_KEY) {
            try {
              const embeddingText = `${title} ${description || ''} ${nodesUsed.join(' ')}`.slice(0, 8000);
              const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'text-embedding-3-small',
                  input: embeddingText,
                }),
              });

              if (embeddingResponse.ok) {
                const embeddingData = await embeddingResponse.json();
                embedding = JSON.stringify(embeddingData.data[0].embedding);
              }
            } catch (e) {
              console.error('⚠️ Embedding generation failed:', e);
            }
          }

          // Check if knowledge entry already exists
          const { data: existingKnowledge } = await supabase
            .from('steve_knowledge_base')
            .select('id')
            .eq('category', 'n8n_workflow_template')
            .eq('title', `n8n Workflow: ${title}`)
            .limit(1);

          if (!existingKnowledge || existingKnowledge.length === 0) {
            const { error: knowledgeError } = await supabase
              .from('steve_knowledge_base')
              .insert({
                title: `n8n Workflow: ${title}`,
                category: 'n8n_workflow_template',
                content: workflowContent,
                embedding,
                tags: ['n8n', 'workflow', 'automation', ...nodesUsed.slice(0, 5)],
                metadata: {
                  workflow_json: workflow.workflow,
                  preview_image_url: previewImage,
                  nodes_used: nodesUsed,
                  template_id: workflowId,
                },
              });

            if (knowledgeError) {
              console.error(`⚠️ Failed to add knowledge for ${workflowId}:`, knowledgeError);
            } else {
              steveKnowledgeCount++;
            }
          }
        }
      } catch (err) {
        console.error(`❌ Error processing workflow ${workflow.id}:`, err);
      }
    }

    console.log(`✅ Fetching complete: ${upsertedCount} templates upserted, ${steveKnowledgeCount} knowledge entries added`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fetched ${workflows.length} templates`,
        stats: {
          fetched: workflows.length,
          upserted: upsertedCount,
          knowledgeAdded: steveKnowledgeCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Scraper error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
