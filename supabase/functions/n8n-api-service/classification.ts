// Classification system for N8N workflow outcomes
// This module provides 3-layer auto-detection: Deterministic → Heuristics → AI Fallback

interface ClassificationResult {
  metric_key: string;
  confidence: number;
  detection_layer: 'deterministic' | 'vector_semantic' | 'heuristic' | 'ai' | 'user_confirmed';
  metadata: {
    workflow_id?: string;
    workflow_name?: string;
    execution_id?: string;
    start_time?: string;
    client_id?: string;
    property_id?: string;
    lead_id?: string;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    contact_name?: string;
    ticket_id?: string;
    matched_description?: string;
    matched_embedding_id?: string;
    vector_similarity?: number;
    [key: string]: any;
  };
  execution_summary?: any;
}

// Multilingual keyword dictionaries (EN + Traditional Chinese)
const KEYWORDS = {
  meeting: [
    'meeting', 'appointment', 'calendar', 'booked', 'confirmed', 'viewing', 
    'inspection', 'demo', 'consultation', 'schedule', 'visit',
    '會議', '預約', '預定', '看房', '參觀', '安排', '諮詢', '約見'
  ],
  lead: [
    'lead', 'prospect', 'contact', 'inquiry', 'signup', 'form', 'submission',
    '表單', '詢問', '線索', '名單', '潛在客戶', '聯絡人', '註冊'
  ],
  ticket: [
    'ticket', 'issue', 'case', 'support', 'problem', 'bug', 'request',
    '工單', '問題', '客訴', '支持', '故障', '請求'
  ],
  email: [
    'email', 'mail', 'send', 'sent', 'message', 'notification',
    '郵件', '電郵', '發送', '訊息', '通知'
  ],
  deal: [
    'deal', 'sale', 'sold', 'closed', 'won', 'purchase', 'contract',
    '交易', '銷售', '成交', '簽約', '購買', '合約'
  ],
};

// Layer 1: Deterministic Rules - High confidence detection based on node types
function detectDeterministic(execution: any, workflow: any): ClassificationResult | null {
  const executionData = execution.data?.resultData?.runData;
  if (!executionData) return null;

  const metadata: any = {
    workflow_id: workflow.n8n_workflow_id,
    workflow_name: workflow.name,
    execution_id: execution.id,
  };

  // Check for calendar/booking nodes
  for (const [nodeName, nodeData] of Object.entries(executionData)) {
    const nodeNameLower = nodeName.toLowerCase();
    const runs = nodeData as any[];
    
    if (!runs || runs.length === 0) continue;

    // Calendar/Booking detection
    if (
      nodeNameLower.includes('calendar') || 
      nodeNameLower.includes('calendly') ||
      nodeNameLower.includes('booking')
    ) {
      for (const run of runs) {
        if (!run.data?.main?.[0]) continue;
        for (const item of run.data.main[0]) {
          const json = item.json || {};
          if (json.start_time || json.scheduled_at || json.attendees || json.event_id) {
            return {
              metric_key: 'meeting_booked',
              confidence: 0.95,
              detection_layer: 'deterministic',
              metadata: {
                ...metadata,
                start_time: json.start_time || json.scheduled_at,
                attendees: json.attendees,
              },
            };
          }
        }
      }
    }

    // CRM/Contact creation detection
    if (
      nodeNameLower.includes('hubspot') || 
      nodeNameLower.includes('pipedrive') ||
      nodeNameLower.includes('crm') ||
      nodeNameLower.includes('supabase') && (nodeNameLower.includes('insert') || nodeNameLower.includes('create'))
    ) {
      for (const run of runs) {
        if (!run.data?.main?.[0]) continue;
        for (const item of run.data.main[0]) {
          const json = item.json || {};
          if ((json.email || json.phone) && json.name) {
            return {
              metric_key: 'lead_created',
              confidence: 0.90,
              detection_layer: 'deterministic',
              metadata: {
                ...metadata,
                email: json.email,
                phone: json.phone,
                first_name: json.first_name || json.name?.split(' ')[0],
                last_name: json.last_name || json.name?.split(' ').slice(1).join(' '),
              },
            };
          }
        }
      }
    }

    // Ticket system detection
    if (
      nodeNameLower.includes('zendesk') ||
      nodeNameLower.includes('jira') ||
      nodeNameLower.includes('freshdesk') ||
      nodeNameLower.includes('github') && nodeNameLower.includes('issue')
    ) {
      for (const run of runs) {
        if (!run.data?.main?.[0]) continue;
        for (const item of run.data.main[0]) {
          const json = item.json || {};
          if (json.ticket_id || json.issue_id) {
            const isResolved = json.status?.toLowerCase().includes('closed') || 
                             json.status?.toLowerCase().includes('resolved');
            return {
              metric_key: isResolved ? 'ticket_resolved' : 'ticket_created',
              confidence: 0.90,
              detection_layer: 'deterministic',
              metadata: {
                ...metadata,
                ticket_id: json.ticket_id || json.issue_id,
                status: json.status,
              },
            };
          }
        }
      }
    }

    // Email sending detection
    if (nodeNameLower.includes('email') || nodeNameLower.includes('gmail') || nodeNameLower.includes('sendgrid')) {
      for (const run of runs) {
        if (!run.data?.main?.[0]) continue;
        for (const item of run.data.main[0]) {
          const json = item.json || {};
          if (json.message_id || json.email_sent || run.error === null) {
            return {
              metric_key: 'email_sent',
              confidence: 0.85,
              detection_layer: 'deterministic',
              metadata: {
                ...metadata,
                to: json.to || json.recipient,
              },
            };
          }
        }
      }
    }
  }

  return null;
}

// Layer 2: Heuristics - Keyword matching across workflow names, node names, and data
function detectHeuristic(execution: any, workflow: any): ClassificationResult | null {
  const workflowName = workflow.name?.toLowerCase() || '';
  const executionData = execution.data?.resultData?.runData;
  
  if (!executionData) return null;

  const metadata: any = {
    workflow_id: workflow.n8n_workflow_id,
    workflow_name: workflow.name,
    execution_id: execution.id,
  };

  // Collect all text content for analysis
  const allText: string[] = [workflowName];
  const allKeys: string[] = [];
  let hasEmail = false;
  let hasPhone = false;
  let hasStartTime = false;
  let hasStatus = false;
  const nodeNames: string[] = [];

  for (const [nodeName, nodeData] of Object.entries(executionData)) {
    nodeNames.push(nodeName);
    allText.push(nodeName.toLowerCase());
    const runs = nodeData as any[];
    
    if (!runs || runs.length === 0) continue;

    for (const run of runs) {
      if (!run.data?.main?.[0]) continue;
      for (const item of run.data.main[0]) {
        const json = item.json || {};
        allKeys.push(...Object.keys(json));
        
        if (json.email) hasEmail = true;
        if (json.phone) hasPhone = true;
        if (json.start_time || json.scheduled_at) hasStartTime = true;
        if (json.status) hasStatus = true;
        
        // Add string values to text analysis
        Object.values(json).forEach(val => {
          if (typeof val === 'string') allText.push(val.toLowerCase());
        });
      }
    }
  }

  const combinedText = allText.join(' ');
  const combinedKeys = allKeys.join(' ').toLowerCase();

  // Score each outcome type
  const scores: Record<string, number> = {
    meeting_booked: 0,
    lead_created: 0,
    ticket_created: 0,
    email_sent: 0,
    deal_won: 0,
  };

  // Meeting scoring
  KEYWORDS.meeting.forEach(keyword => {
    if (combinedText.includes(keyword.toLowerCase())) scores.meeting_booked += 1;
  });
  if (hasStartTime) scores.meeting_booked += 3;
  if (combinedKeys.includes('attendees') || combinedKeys.includes('calendar')) scores.meeting_booked += 2;

  // Lead scoring
  KEYWORDS.lead.forEach(keyword => {
    if (combinedText.includes(keyword.toLowerCase())) scores.lead_created += 1;
  });
  if (hasEmail && hasPhone) scores.lead_created += 4;
  else if (hasEmail || hasPhone) scores.lead_created += 2;

  // Ticket scoring
  KEYWORDS.ticket.forEach(keyword => {
    if (combinedText.includes(keyword.toLowerCase())) scores.ticket_created += 1;
  });
  if (hasStatus) scores.ticket_created += 2;

  // Email scoring
  KEYWORDS.email.forEach(keyword => {
    if (combinedText.includes(keyword.toLowerCase())) scores.email_sent += 1;
  });

  // Deal scoring
  KEYWORDS.deal.forEach(keyword => {
    if (combinedText.includes(keyword.toLowerCase())) scores.deal_won += 1;
  });

  // Find highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return null;

  const topOutcome = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'unknown';
  
  // Normalize confidence: maxScore / threshold (e.g., 5 keywords = ~0.7 confidence)
  const confidence = Math.min(maxScore / 7, 0.75); // Cap at 0.75 for heuristics

  if (confidence < 0.4) return null; // Too low to be useful

  return {
    metric_key: topOutcome,
    confidence,
    detection_layer: 'heuristic',
    metadata: {
      ...metadata,
      execution_summary: {
        nodes: nodeNames.join(', ')
      }
    },
  };
}

// Layer 1.5: Vector Semantic Matching - Semantic similarity using embeddings
async function detectVectorSemantic(
  execution: any, 
  workflow: any, 
  company_id: string,
  supabase: any
): Promise<ClassificationResult | null> {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not set, skipping vector classification');
      return null;
    }

    // Step 1: Build workflow description for embedding
    const workflowName = workflow.name || '';
    const executionData = execution.data?.resultData?.runData;
    
    if (!executionData) return null;
    
    // Collect node names + sample data
    const nodeNames = Object.keys(executionData);
    const sampleData: string[] = [];
    
    for (const [nodeName, nodeData] of Object.entries(executionData).slice(0, 5)) {
      const runs = nodeData as any[];
      if (runs?.[0]?.data?.main?.[0]?.[0]?.json) {
        const json = runs[0].data.main[0][0].json;
        const relevantFields = ['email', 'phone', 'name', 'start_time', 'scheduled_at', 'status', 'ticket_id'];
        const extracted = relevantFields
          .filter(field => json[field])
          .map(field => `${field}: ${json[field]}`);
        if (extracted.length > 0) {
          sampleData.push(`${nodeName}: ${extracted.join(', ')}`);
        }
      }
    }
    
    const workflowDescription = `
Workflow: ${workflowName}
Nodes: ${nodeNames.join(', ')}
Data: ${sampleData.join(' | ')}
    `.trim();
    
    console.log('📝 Workflow description for embedding:', workflowDescription.slice(0, 200));

    // Step 2: Generate embedding for workflow execution
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

    if (!embeddingResponse.ok) {
      console.error('❌ OpenAI embedding failed:', await embeddingResponse.text());
      return null;
    }

    const embeddingData = await embeddingResponse.json();
    const workflowEmbedding = embeddingData.data[0].embedding;

    // Step 3: Query most similar outcome embeddings
    const { data: matches, error } = await supabase.rpc('search_outcome_embeddings', {
      query_embedding: workflowEmbedding,
      match_threshold: 0.70,
      match_count: 3,
      filter_company_id: company_id,
    });

    if (error) {
      console.error('❌ Vector search failed:', error);
      return null;
    }

    if (!matches || matches.length === 0) {
      console.log('📊 No vector matches above 70% threshold');
      return null;
    }

    // Step 4: Return best match
    const bestMatch = matches[0];
    const similarity = bestMatch.similarity;
    
    console.log(`✅ Vector match: ${bestMatch.metric_key} (similarity: ${similarity.toFixed(2)})`);

    // Update usage stats
    await supabase
      .from('outcome_type_embeddings')
      .update({
        usage_count: (bestMatch.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        average_similarity: ((bestMatch.average_similarity || 0) * (bestMatch.usage_count || 0) + similarity) / ((bestMatch.usage_count || 0) + 1)
      })
      .eq('id', bestMatch.id);

    return {
      metric_key: bestMatch.metric_key,
      confidence: similarity,
      detection_layer: 'vector_semantic',
      metadata: {
        workflow_id: workflow.n8n_workflow_id,
        workflow_name: workflow.name,
        execution_id: execution.id,
        matched_description: bestMatch.description,
        matched_embedding_id: bestMatch.id,
        vector_similarity: similarity,
        execution_summary: {
          nodes: nodeNames.join(', ')
        }
      },
    };
  } catch (error) {
    console.error('Error in vector semantic classification:', error);
    return null;
  }
}

// Layer 3: AI Fallback - Call Lovable AI Gateway for unclear cases
async function detectWithAI(execution: any, workflow: any, company_id: string): Promise<ClassificationResult | null> {
  try {
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      console.log('⚠️ OPENROUTER_API_KEY not configured, skipping AI classification');
      return null;
    }

    const executionData = execution.data?.resultData?.runData;
    if (!executionData) return null;

    // Build comprehensive execution summary
    const allNodes = Object.keys(executionData);
    const nodes = allNodes.join(', ');
    
    // Get more node data (up to 10 nodes instead of 3)
    const sampleOutputs = Object.entries(executionData).slice(0, 10).map(([name, data]: [string, any]) => {
      const runs = data as any[];
      if (!runs?.[0]?.data?.main?.[0]?.[0]?.json) return null;
      // Increase JSON sample from 200 to 1000 chars
      return { node: name, sample: JSON.stringify(runs[0].data.main[0][0].json).slice(0, 1000) };
    }).filter(Boolean);
    
    // Get full output of last node (most important)
    const lastNodeName = allNodes[allNodes.length - 1];
    const lastNodeData = executionData[lastNodeName] as any[];
    const lastNodeOutput = lastNodeData?.[0]?.data?.main?.[0]?.[0]?.json;

    const systemPrompt = `You are an expert workflow analyzer for AutoPenguin CRM. Analyze N8N workflow executions and determine business outcomes.

## CORE PRINCIPLES
1. Evidence-Based: Only classify based on concrete data
2. Prioritize Relevance: Last nodes > API calls > Database writes
3. Express Uncertainty: Return "unknown" if confidence < 0.6
4. Extract Metadata: Pull contact info, timestamps, IDs when found

## CLASSIFICATION RULES

**meeting_booked** (confidence ≥ 0.7):
- Required: timestamp field (scheduled_at, start_time, event_date, 預約時間, 會議時間) + contact info
- Signals: Calendar nodes (Calendly, Google Calendar), booking confirmations

**lead_created** (confidence ≥ 0.6):
- Required: Email address + (name OR phone)
- Signals: CRM nodes, database inserts, form submissions

**ticket_created** (confidence ≥ 0.7):
- Required: Ticket ID + status field
- Signals: Ticketing system nodes (Zendesk, Jira)

**ticket_resolved** (confidence ≥ 0.8):
- Required: Ticket ID + status = "closed"/"resolved"

**email_sent** (confidence ≥ 0.7):
- Required: Email service node + recipient + status="sent"

**deal_won** (confidence ≥ 0.8):
- Required: Deal status = "won"/"closed" + deal value

**unknown** (confidence < 0.6):
- Use when evidence is insufficient or ambiguous

## FIELD PATTERNS (English + Traditional Chinese)
- Email: email, contact_email, user_email, 電郵, 電子郵件
- Phone: phone, mobile, telephone, 電話, 手機
- Name: name, full_name, contact_name, 姓名, 名字
- Time: scheduled_at, start_time, event_date, 預約時間, 會議時間
- Status: status, state, 狀態

## OUTPUT FORMAT
Return JSON with:
{
  "metric_key": "<enum>",
  "confidence": <0.0-1.0>,
  "reasoning": "<single sentence>",
  "extracted_data": {
    "scheduled_time": "<ISO 8601>",
    "contact_email": "<string>",
    "contact_name": "<string>",
    "contact_phone": "<string>",
    "ticket_id": "<string>",
    "status": "<string>"
  }
}`;

    const userPrompt = `Analyze this workflow execution:

**Workflow:** ${workflow.name}
**All Nodes:** ${nodes}
**Node Outputs (first 10):**
${JSON.stringify(sampleOutputs, null, 2)}

**Last Node (${lastNodeName}) Full Output:**
${JSON.stringify(lastNodeOutput, null, 2)}

**Execution Status:** ${execution.status || 'success'}

Classify and extract data based on the system instructions.`;

    console.log('🤖 Calling OpenRouter AI with enhanced prompt...');
    console.log(`📊 Sending ${allNodes.length} nodes, ${sampleOutputs.length} samples`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_workflow_outcome",
            description: "Classify workflow business outcome",
            parameters: {
              type: "object",
              properties: {
                metric_key: { 
                  type: "string",
                  enum: ["meeting_booked", "lead_created", "ticket_created", "ticket_resolved", "email_sent", "deal_won", "unknown"]
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                reasoning: { type: "string" },
                extracted_data: { 
                  type: "object",
                  properties: {
                    scheduled_time: { type: "string" },
                    contact_email: { type: "string" },
                    contact_name: { type: "string" },
                    contact_phone: { type: "string" },
                    first_name: { type: "string" },
                    last_name: { type: "string" },
                    ticket_id: { type: "string" },
                    status: { type: "string" }
                  }
                }
              },
              required: ["metric_key", "confidence", "reasoning"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "classify_workflow_outcome" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI classification failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('❌ No tool call in AI response');
      return null;
    }

    const parsedArgs = JSON.parse(toolCall.function.arguments);
    console.log('✅ AI Response:', parsedArgs);

    return {
      metric_key: parsedArgs.metric_key,
      confidence: parsedArgs.confidence,
      detection_layer: 'ai',
      metadata: {
        workflow_id: workflow.n8n_workflow_id,
        workflow_name: workflow.name,
        execution_id: execution.id,
        execution_summary: {
          reasoning: parsedArgs.reasoning,
          nodes: allNodes.join(', ')
        },
        ...parsedArgs.extracted_data
      },
    };
  } catch (error) {
    console.error('Error in AI classification:', error);
    return null;
  }
}

// Main classification orchestrator
export async function classifyOutcome(
  execution: any, 
  workflow: any, 
  company_id: string,
  supabase: any
): Promise<ClassificationResult> {
  console.log(`🔍 Classifying outcome for workflow: ${workflow.name}`);

  // Check if we have a cached mapping first
  const { data: cachedMapping } = await supabase
    .from('workflow_metric_mappings')
    .select('*')
    .eq('company_id', company_id)
    .eq('n8n_workflow_id', workflow.n8n_workflow_id)
    .single();

  if (cachedMapping?.override_metric_key) {
    console.log(`✅ Using cached mapping: ${cachedMapping.override_metric_key}`);
    return {
      metric_key: cachedMapping.override_metric_key,
      confidence: 1.0,
      detection_layer: 'user_confirmed',
      metadata: {
        workflow_id: workflow.n8n_workflow_id,
        workflow_name: workflow.name,
        execution_id: execution.id,
      },
    };
  }

  // Layer 1: Deterministic
  const deterministicResult = detectDeterministic(execution, workflow);
  if (deterministicResult) {
    console.log(`✅ Deterministic classification: ${deterministicResult.metric_key} (${deterministicResult.confidence})`);
    return deterministicResult;
  }

  // Layer 1.5: Vector Semantic Matching
  console.log('🔍 Attempting vector semantic classification...');
  const vectorResult = await detectVectorSemantic(execution, workflow, company_id, supabase);
  if (vectorResult && vectorResult.confidence >= 0.75) {
    console.log(`✅ Vector Semantic: ${vectorResult.metric_key} (${vectorResult.confidence})`);
    return vectorResult;
  }

  // Layer 2: Heuristics (fallback if vector < 0.75 confidence)
  const heuristicResult = detectHeuristic(execution, workflow);
  if (heuristicResult && heuristicResult.confidence >= 0.6) {
    console.log(`✅ Heuristic classification: ${heuristicResult.metric_key} (${heuristicResult.confidence})`);
    return heuristicResult;
  }

  // If vector was 0.70-0.74, use it as last resort before AI
  if (vectorResult) {
    console.log(`✅ Vector Semantic (low confidence): ${vectorResult.metric_key} (${vectorResult.confidence})`);
    return vectorResult;
  }

  // Layer 3: AI Fallback
  console.log('🤖 Using AI fallback for classification...');
  const aiResult = await detectWithAI(execution, workflow, company_id);
  if (aiResult) {
    console.log(`✅ AI classification: ${aiResult.metric_key} (${aiResult.confidence})`);
    return aiResult;
  }

  // Fallback: Unknown
  console.log('❓ Could not classify outcome, marking as unknown');
  return {
    metric_key: 'unknown',
    confidence: 0.0,
    detection_layer: 'heuristic',
    metadata: {
      workflow_id: workflow.n8n_workflow_id,
      workflow_name: workflow.name,
      execution_id: execution.id,
    },
  };
}

// Helper: Upload data to main tables for high-confidence classifications
export async function uploadToMainTables(
  classification: ClassificationResult,
  execution: any,
  supabase: any,
  company_id: string
): Promise<void> {
  const { metric_key, metadata } = classification;

  try {
    switch (metric_key) {
      case 'meeting_booked':
        console.log('📅 Auto-uploading meeting to viewings table');
        
        // Idempotency check: Skip if viewing already exists for this execution
        const { data: existingViewing } = await supabase
          .from('viewings')
          .select('id')
          .eq('n8n_execution_id', execution.id)
          .eq('company_id', company_id)
          .maybeSingle();
        
        if (existingViewing) {
          console.log('ℹ️ Viewing already exists for this execution, skipping all related tasks and notifications');
          break;
        }
        
        // Try to find existing client by email (case-insensitive)
        let clientId = metadata.client_id;
        if (!clientId && metadata.contact_email) {
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .ilike('email', metadata.contact_email)
            .eq('company_id', company_id)
            .maybeSingle();
          
          if (existingClient) {
            clientId = existingClient.id;
          } else if (metadata.contact_email || metadata.contact_phone) {
            // Only create client if we have email or phone
            const { data: newClient } = await supabase
              .from('clients')
              .insert({
                company_id,
                first_name: metadata.contact_name?.split(' ')[0] || 'Unknown',
                last_name: metadata.contact_name?.split(' ').slice(1).join(' ') || '',
                email: metadata.contact_email,
                phone: metadata.contact_phone,
                status: 'ACTIVE',
              })
              .select()
              .single();
            
            if (newClient) clientId = newClient.id;
          }
        }
        
        const { data: viewing, error: viewingError } = await supabase.from('viewings').insert({
          company_id,
          scheduled_at: metadata.scheduled_time || metadata.start_time || execution.startedAt,
          client_id: clientId,
          property_id: metadata.property_id || null,
          lead_id: metadata.lead_id || null,
          status: 'SCHEDULED',
          created_by_automation: true,
          automation_workflow_id: metadata.workflow_id,
          n8n_execution_id: execution.id,
          notes: `Auto-created from ${metadata.workflow_name}. Contact: ${metadata.contact_name || metadata.contact_email || 'Unknown'}`,
        }).select().single();
        
        if (!viewingError && viewing) {
          console.log('✅ Meeting auto-created in viewings table');
          
          // Phase 2: Record automation outcome (optional, for metrics tracking)
          await supabase.from('automation_outcomes').insert({
            company_id,
            metric_key: 'meeting_booked',
            metric_value: 1,
            confidence: classification.confidence,
            description: `Meeting scheduled with ${metadata.contact_name || metadata.contact_email} at ${metadata.scheduled_time || metadata.start_time}`,
            entity_type: 'viewing',
            entity_id: viewing.id,
            status: 'confirmed',
            detection_layer: classification.detection_layer
          });
          console.log('✅ Automation outcome recorded');
          
          // Phase 3: Auto-create task with title-based idempotency (prevents duplicates regardless of client/date)
          const taskTitle = `Prepare for meeting with ${metadata.contact_name || metadata.contact_email || 'client'}`;
          const taskDueDate = metadata.scheduled_time || metadata.start_time;
          
          // Check if OPEN task already exists by title (case-insensitive, ignores client_id and due_date)
          const { data: existingTask } = await supabase
            .from('tasks')
            .select('id')
            .eq('company_id', company_id)
            .eq('automation_workflow_id', metadata.workflow_id)
            .eq('created_by_automation', true)
            .neq('status', 'COMPLETED')
            .ilike('title', taskTitle.trim())
            .maybeSingle();
          
          if (!existingTask) {
            await supabase.from('tasks').insert({
              company_id,
              title: taskTitle,
              description: `Auto-created from ${metadata.workflow_name}. Review client info and property details before meeting.`,
              type: 'TASK',
              status: 'OPEN',
              priority: 'HIGH',
              due_date: taskDueDate,
              created_by_automation: true,
              automation_workflow_id: metadata.workflow_id,
              client_id: clientId,
              automation_resolution_data: { 
                execution_id: execution.id.toString(),
                workflow_id: metadata.workflow_id,
                created_from_meeting: true
              }
            });
            console.log('✅ Task auto-created for meeting preparation');
          } else {
            console.log('ℹ️ Task already exists for this execution, skipping creation and notification');
          }
        }
        break;

      case 'lead_created':
        console.log('👤 Auto-uploading lead to clients/leads tables');
        if (metadata.email || metadata.contact_email) {
          const email = metadata.email || metadata.contact_email;
          
          // Check if client already exists (case-insensitive)
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .ilike('email', email)
            .eq('company_id', company_id)
            .maybeSingle();

          if (!existingClient) {
            const { data: newClient } = await supabase
              .from('clients')
              .insert({
                company_id,
                first_name: metadata.first_name || metadata.contact_name?.split(' ')[0] || 'Unknown',
                last_name: metadata.last_name || metadata.contact_name?.split(' ').slice(1).join(' ') || '',
                email: email,
                phone: metadata.phone || metadata.contact_phone,
                status: 'ACTIVE',
              })
              .select()
              .single();

            if (newClient) {
              await supabase.from('leads').insert({
                company_id,
                client_id: newClient.id,
                source: 'automation',
                stage: 'NEW',
                priority: 'MEDIUM',
                created_by_automation: true,
              });
              console.log('✅ Lead auto-created in leads table');
            }
          } else {
            console.log('ℹ️ Client already exists, skipping lead creation');
          }
        }
        break;

      // Other metric types will be handled as needed
      default:
        console.log(`ℹ️ No auto-upload handler for metric: ${metric_key}`);
    }
  } catch (error) {
    console.error('Error uploading to main tables:', error);
  }
}

// Helper function to define expected fields per metric type
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

// Helper function to get user-friendly metric labels
function getMetricLabel(key: string): string {
  const labels: Record<string, string> = {
    'meeting_booked': 'Meeting Booked',
    'lead_created': 'Lead Created',
    'ticket_created': 'Ticket Created',
    'ticket_resolved': 'Ticket Resolved',
    'email_sent': 'Email Sent',
    'deal_won': 'Deal Won',
    'unknown': 'Unknown Activity',
  };
  return labels[key] || key;
}

// Helper: Create Steve notification for low-confidence classifications
export async function createNotification(
  classification: ClassificationResult,
  supabase: any,
  company_id: string
): Promise<void> {
  try {
    const priority = classification.confidence < 0.3 ? 'high' : 'medium';
    const confidencePercent = Math.round((classification.confidence || 0) * 100);
    
    // Generate context-rich message based on detection layer
    let message = '';
    
    switch (classification.detection_layer) {
      case 'vector_semantic': {
        const nodesList = classification.metadata.execution_summary?.nodes?.split(', ') || [];
        
        let vectorSummary = `Steve found this workflow similar to "${classification.metadata.matched_description || 'a known pattern'}" (${Math.round((classification.metadata.vector_similarity || 0) * 100)}% match), suggesting it's tracking "${getMetricLabel(classification.metric_key)}".\n\n`;
        
        if (nodesList.length > 0) {
          vectorSummary += `What happened:\n`;
          nodesList.slice(0, 5).forEach((node: string) => {
            vectorSummary += `• ${node}\n`;
          });
          if (nodesList.length > 5) {
            vectorSummary += `• ...and ${nodesList.length - 5} more steps\n`;
          }
          vectorSummary += `\n`;
        }
        
        vectorSummary += `Please confirm if this is correct.`;
        message = vectorSummary;
        break;
      }
        
      case 'heuristic': {
        const nodesList = classification.execution_summary?.nodes?.split(', ') || [];
        
        let heuristicSummary = `Steve found keywords suggesting this is tracking "${getMetricLabel(classification.metric_key)}" (${confidencePercent}% confident).\n\n`;
        
        if (nodesList.length > 0) {
          heuristicSummary += `What happened:\n`;
          nodesList.slice(0, 5).forEach((node: string) => {
            heuristicSummary += `• ${node}\n`;
          });
          if (nodesList.length > 5) {
            heuristicSummary += `• ...and ${nodesList.length - 5} more steps\n`;
          }
          heuristicSummary += `\n`;
        }
        
        heuristicSummary += `Please confirm if this looks correct.`;
        message = heuristicSummary;
        break;
      }
        
      case 'ai': {
        // Build human-readable workflow summary
        const reasoning = classification.execution_summary?.reasoning || 'the workflow steps and data';
        const nodesList = classification.execution_summary?.nodes?.split(', ') || [];
        
        let workflowSummary = `Steve analyzed this workflow and thinks it might be tracking "${getMetricLabel(classification.metric_key)}" (${confidencePercent}% confident).\n\n`;
        workflowSummary += `Why: ${reasoning}\n\n`;
        
        if (nodesList.length > 0) {
          workflowSummary += `What happened:\n`;
          nodesList.slice(0, 5).forEach((node: string) => {
            workflowSummary += `• ${node}\n`;
          });
          if (nodesList.length > 5) {
            workflowSummary += `• ...and ${nodesList.length - 5} more steps\n`;
          }
        }
        
        workflowSummary += `\nDoes this look correct? If not, please tell Steve what this workflow should track.`;
        
        message = workflowSummary;
        break;
      }
        
      default: {
        // Fallback for unknown
        const nodesList = classification.execution_summary?.nodes?.split(', ') || [];
        
        let unknownSummary = `Steve couldn't identify what this workflow tracks.\n\n`;
        
        if (nodesList.length > 0) {
          unknownSummary += `What happened:\n`;
          nodesList.slice(0, 5).forEach((node: string) => {
            unknownSummary += `• ${node}\n`;
          });
          if (nodesList.length > 5) {
            unknownSummary += `• ...and ${nodesList.length - 5} more steps\n`;
          }
          unknownSummary += `\n`;
        }
        
        unknownSummary += `This doesn't match known business activities like:\n• Meetings booked\n• Leads created\n• Tickets created/resolved\n• Emails sent\n• Deals won\n\n`;
        unknownSummary += `Please tell Steve what this workflow should track.`;
        
        message = unknownSummary;
        break;
      }
    }
    
    // Check if notification already exists for this execution
    const { data: existingNotification } = await supabase
      .from('steve_notifications')
      .select('id')
      .eq('company_id', company_id)
      .filter('metadata', 'cs', `{"execution_id":"${classification.metadata.execution_id}"}`)
      .eq('notification_type', 'outcome_clarification')
      .maybeSingle();
    
    if (!existingNotification) {
      const { data: notificationData, error: insertError } = await supabase.from('steve_notifications').insert({
        company_id,
        notification_type: 'outcome_clarification',
        priority,
        title: `Need help understanding "${classification.metadata.workflow_name}"`,
        message,
        metadata: {
          workflow_id: classification.metadata.workflow_id,
          workflow_name: classification.metadata.workflow_name,
          execution_id: classification.metadata.execution_id,
          suggested_mapping: classification.metric_key,
          confidence: classification.confidence,
          detection_layer: classification.detection_layer,
          execution_summary: classification.execution_summary,
          matched_description: classification.metadata.matched_description,
          matched_embedding_id: classification.metadata.matched_embedding_id,
          vector_similarity: classification.metadata.vector_similarity,
        },
        status: 'pending',
      }).select().single();

      if (insertError) {
        console.error('Error inserting notification:', insertError);
      } else {
        console.log(`📬 Created notification with context-rich message for: ${classification.metric_key}`);
        
        // Trigger push notification via notifications-dispatch
        try {
          await supabase.functions.invoke('notifications-dispatch', {
            body: {
              company_id,
              subject: `Need help understanding "${classification.metadata.workflow_name}"`,
              message,
              channels: ['push'],
              severity: priority === 'high' ? 'high' : 'medium',
              action_url: '/automations',
            }
          });
          console.log('📱 Push notification dispatched');
        } catch (pushError) {
          console.error('Error dispatching push notification:', pushError);
          // Don't fail the whole operation if push fails
        }
      }
    } else {
      console.log(`ℹ️ Notification already exists for execution ${classification.metadata.execution_id}, skipping`);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}
