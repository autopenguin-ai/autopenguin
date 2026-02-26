import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Accurate, current knowledge entries for Steve AI
const knowledgeEntries = [
  // ========== PLATFORM INFORMATION ==========
  {
    title: "AutoPenguin Platform Overview",
    content: `AutoPenguin is an AI-powered business automation platform designed to streamline operations through intelligent automation. The platform combines CRM capabilities with workflow automation via n8n integration, all managed through Steve, an AI assistant.

Key components:
- Steve AI: Conversational assistant for managing contacts, tasks, leads, and projects
- CRM Dashboard: Track clients, leads, deals, and business metrics
- Workflow Automation: Connect to n8n for automated workflows
- Analytics: Revenue tracking, workflow outcomes, and performance insights

The platform is available in English and Traditional Chinese (繁體中文).`,
    category: "autopenguin_docs",
    tags: ["autopenguin", "overview", "platform", "features"]
  },
  {
    title: "AutoPenguin Vision and Mission",
    content: `AutoPenguin's mission is to make AI agent operations invisible - automating repetitive business tasks so teams can focus on what matters.

Vision: A unified platform where AI handles routine operations while humans drive strategy and creativity.

Core principles:
- Simplicity: Easy to use without technical expertise
- Intelligence: AI that understands context and learns from actions
- Integration: Connect with existing tools via n8n workflows
- Transparency: Clear visibility into what automation does`,
    category: "autopenguin_docs",
    tags: ["vision", "mission", "philosophy"]
  },

  // ========== STEVE AI CAPABILITIES ==========
  {
    title: "Steve AI - Contact Management",
    content: `Steve can help you manage contacts with these capabilities:

CREATE contacts:
- "Create a contact for John Smith with email john@example.com"
- "Add a new contact: Jane Doe, phone 1234-5678, from ABC Company"

UPDATE contacts:
- "Update John Smith's email to john.smith@newdomain.com"
- "Change Jane's lead stage to Qualified"

SEARCH contacts:
- "Find all contacts from ABC Company"
- "Show me contacts with no email address"
- "List all hot priority leads"

DELETE contacts:
- "Delete the contact John Smith"
- "Remove duplicate contacts"

BULK operations:
- "Update all cold leads to archived status"
- "Delete all contacts without email addresses"`,
    category: "autopenguin_docs",
    tags: ["steve", "contacts", "crm", "management"]
  },
  {
    title: "Steve AI - Task Management",
    content: `Steve can help you manage tasks with these capabilities:

CREATE tasks:
- "Create a task to follow up with ABC Corp"
- "Add a high priority task: Prepare proposal for client, due Friday"

UPDATE tasks:
- "Mark the ABC Corp follow-up task as completed"
- "Change task priority to high"
- "Update the due date to next Monday"

SEARCH tasks:
- "Show all my pending tasks"
- "Find high priority tasks due this week"
- "List overdue tasks"

DELETE tasks:
- "Delete the completed task"
- "Remove all cancelled tasks"

Task types: follow_up, meeting, call, document, review, other
Priorities: low, medium, high
Statuses: pending, in_progress, completed, cancelled`,
    category: "autopenguin_docs",
    tags: ["steve", "tasks", "management", "productivity"]
  },
  {
    title: "Steve AI - Lead Management",
    content: `Steve can help you manage leads through the sales pipeline:

CREATE leads:
- "Create a lead from website inquiry"
- "Add a new lead: Company XYZ, source: Referral"

UPDATE lead stages:
- "Move lead to Qualified stage"
- "Update lead priority to hot"

Lead stages: new, contacted, qualified, proposal, negotiation, won, lost

Lead sources: website, referral, social_media, advertisement, cold_outreach, event, other

SEARCH leads:
- "Show all leads in negotiation stage"
- "Find hot priority leads"
- "List leads from referrals"

Lead priorities: cold, warm, hot`,
    category: "autopenguin_docs",
    tags: ["steve", "leads", "sales", "pipeline"]
  },
  {
    title: "Steve AI - Project Management",
    content: `Steve can help you manage business projects:

CREATE projects:
- "Create a new software project called Mobile App Development"
- "Add a marketing project for Q1 campaign"

UPDATE projects:
- "Update the Mobile App project status to active"
- "Change project type to consulting"

Project types: SOFTWARE, MARKETING, DESIGN, CONSULTING, OPERATIONS

Project statuses: planning, active, on_hold, completed, cancelled

SEARCH projects:
- "Show all active software projects"
- "Find projects in planning stage"
- "List all marketing projects"

BULK operations:
- "Update all planning projects to active"
- "Mark all Q4 projects as completed"`,
    category: "autopenguin_docs",
    tags: ["steve", "projects", "management"]
  },
  {
    title: "Steve AI - Knowledge and History Search",
    content: `Steve has two special search capabilities:

KNOWLEDGE SEARCH (search_knowledge):
- Search the platform knowledge base for help and guidance
- "How do I connect n8n?"
- "What are the pricing plans?"
- "Tell me about task management"

ACTION HISTORY (search_my_actions):
- Review past actions you've taken with Steve
- "Did I already create a contact for John?"
- "What tasks did I create today?"
- "Show my recent lead updates"

This helps avoid duplicates and provides context for your work.`,
    category: "autopenguin_docs",
    tags: ["steve", "search", "knowledge", "history"]
  },

  // ========== N8N INTEGRATION ==========
  {
    title: "n8n Integration - Setup Guide",
    content: `AutoPenguin integrates with n8n for workflow automation.

HOW TO CONNECT:
1. Go to Settings → Integrations
2. Click "Add Integration" and select n8n
3. Enter your n8n instance URL (e.g., https://your-instance.app.n8n.cloud)
4. Enter your n8n API key (found in n8n Settings → API)
5. Click Save

WHAT SYNCS:
- Workflows: All your n8n workflows appear in the Automations page
- Executions: Track workflow runs and their outcomes
- Status: See which workflows are active or paused

WEBHOOK URL for n8n workflows sending data back:
${Deno.env.get('SUPABASE_URL')}/functions/v1/n8n-webchat-webhook`,
    category: "n8n_docs",
    tags: ["n8n", "integration", "setup", "automation"]
  },
  {
    title: "n8n Integration - Workflow Automation",
    content: `With n8n connected, you can automate business processes:

EXAMPLE USE CASES:
- Automatically create contacts from form submissions
- Send follow-up emails when leads reach certain stages
- Create tasks when new deals are added
- Sync data with external CRM systems
- Generate reports on schedule

VIEWING WORKFLOWS:
- Go to Automations page to see all synced workflows
- Toggle workflows on/off directly from AutoPenguin
- View execution history and outcomes

WORKFLOW OUTCOMES:
AutoPenguin tracks automation outcomes like:
- leads_created
- messages_sent
- tasks_completed
- contacts_updated`,
    category: "n8n_workflow_example",
    tags: ["n8n", "automation", "workflows", "examples"]
  },

  // ========== PRICING (FAQ) ==========
  {
    title: "Pricing Plans - Starter (Free)",
    content: `STARTER PLAN (Free)

Included features:
- 25 Steve AI conversations per day (750 per month)
- 1 n8n instance connection
- Basic workflow monitoring
- Full CRM access (contacts, tasks, leads, projects)
- Dashboard and analytics

Perfect for:
- Solo entrepreneurs
- Small teams getting started
- Testing the platform

Daily limit resets at midnight.`,
    category: "faq",
    tags: ["pricing", "free", "starter", "plan"]
  },
  {
    title: "Pricing Plans - Supporter",
    content: `SUPPORTER PLAN ($29/month)

Included features:
- 100 Steve AI conversations per day (3,000 per month)
- Up to 5 n8n instance connections
- Priority email support
- Early access to new features
- Everything in Starter plan

Perfect for:
- Growing businesses
- Power users
- Teams needing more automation capacity

To upgrade: Go to Settings → Plan & Usage → Become a Supporter`,
    category: "faq",
    tags: ["pricing", "supporter", "paid", "plan"]
  },

  // ========== HOW-TO GUIDES (FAQ) ==========
  {
    title: "How To - Getting Started with Steve",
    content: `Getting started with Steve AI assistant:

1. OPEN STEVE:
   - Click the chat icon in the bottom-right corner
   - Or use keyboard shortcut

2. START A CONVERSATION:
   - Type naturally, like talking to an assistant
   - Steve understands context and remembers the conversation

3. EXAMPLE FIRST COMMANDS:
   - "Create a contact for my first client"
   - "Add a task to set up my n8n integration"
   - "Show me all my leads"

4. TIPS:
   - Be specific with names and details
   - Steve can handle bulk operations
   - Ask "What can you do?" for help`,
    category: "faq",
    tags: ["getting-started", "steve", "tutorial", "beginner"]
  },
  {
    title: "How To - Effective Steve Commands",
    content: `Tips for effective commands with Steve:

CREATING RECORDS:
✓ "Create a contact for John Smith, email john@company.com, phone 9876-5432"
✓ "Add a high priority task: Call ABC Corp about proposal, due tomorrow"

SEARCHING:
✓ "Show all hot leads from referrals"
✓ "Find tasks due this week"
✓ "List contacts from XYZ Company"

UPDATING:
✓ "Update John Smith's lead stage to Qualified"
✓ "Mark task #123 as completed"
✓ "Change all pending tasks to in_progress"

BULK OPERATIONS:
✓ "Delete all cancelled tasks"
✓ "Update all cold leads to archived"
✓ "Complete all overdue follow-up tasks"

ASKING ABOUT HISTORY:
✓ "Did I already create a contact for Jane?"
✓ "What did I do yesterday?"
✓ "Show my recent project updates"`,
    category: "faq",
    tags: ["commands", "tips", "steve", "examples"]
  },
  {
    title: "How To - Managing Your Sales Pipeline",
    content: `Managing leads through the sales pipeline:

LEAD STAGES (in order):
1. new - Fresh lead, not yet contacted
2. contacted - Initial outreach made
3. qualified - Confirmed fit and interest
4. proposal - Proposal sent
5. negotiation - Discussing terms
6. won - Deal closed successfully
7. lost - Did not convert

EXAMPLE WORKFLOW:
1. "Create a lead from website, company ABC Corp"
2. "Update ABC Corp lead to contacted"
3. "Change lead stage to qualified, priority hot"
4. "Move lead to proposal stage"
5. "Mark lead as won"

PIPELINE VIEWS:
- Use "Show all leads in [stage]" to see pipeline
- "Find hot priority leads" for urgent follow-ups
- "List leads not contacted in 7 days" for follow-up`,
    category: "faq",
    tags: ["leads", "pipeline", "sales", "workflow"]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking if knowledge base is already populated...');

    // Check if knowledge already exists
    const { count } = await supabase
      .from('steve_knowledge_base')
      .select('*', { count: 'exact', head: true })
      .is('company_id', null)
      .is('user_id', null);

    if (count && count > 0) {
      console.log(`Knowledge base already has ${count} entries, skipping initialization`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Knowledge base already initialized with ${count} entries`,
          skipped: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Populating knowledge base...');
    const results = [];

    for (const entry of knowledgeEntries) {
      try {
        // Generate embedding using OpenRouter
        const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/text-embedding-3-small',
            input: `${entry.title}\n\n${entry.content}`,
          }),
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          throw new Error(`OpenRouter API error: ${embeddingResponse.status} - ${errorText}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Insert into knowledge base
        const { error: insertError } = await supabase
          .from('steve_knowledge_base')
          .insert({
            title: entry.title,
            content: entry.content,
            category: entry.category,
            tags: entry.tags,
            embedding: JSON.stringify(embedding),
            company_id: null,
            user_id: null,
          });

        if (insertError) throw insertError;

        console.log(`✓ Added: ${entry.title}`);
        results.push({ title: entry.title, success: true });
      } catch (error: any) {
        console.error(`✗ Failed to add ${entry.title}:`, error);
        results.push({ title: entry.title, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount === knowledgeEntries.length,
        message: `Initialized ${successCount} of ${knowledgeEntries.length} knowledge entries`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error initializing knowledge base:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
