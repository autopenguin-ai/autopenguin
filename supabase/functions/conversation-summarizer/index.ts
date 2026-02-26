import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const DEBUG = Deno.env.get('DEBUG') === 'true';
const log = (...args: unknown[]) => { if (DEBUG) console.log(...args); };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { company_id, period_days = 7 } = await req.json();

    if (!company_id) {
      throw new Error('company_id is required');
    }

    log(`📊 Generating conversation summaries for company ${company_id}, last ${period_days} days`);

    // Get conversations from the specified period
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - period_days);

    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_messages (*)
      `)
      .eq('company_id', company_id)
      .gte('last_message_timestamp', periodStart.toISOString())
      .order('last_message_timestamp', { ascending: false });

    if (convError) throw convError;

    if (!conversations || conversations.length === 0) {
      return new Response(JSON.stringify({ message: 'No conversations found for this period' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log(`📬 Found ${conversations.length} conversations to summarize`);

    const summaries = [];

    for (const conv of conversations) {
      const messages = conv.conversation_messages || [];
      if (messages.length === 0) continue;

      // Build conversation text
      const conversationText = messages.map((m: any) => 
        `${m.is_outgoing ? 'Agent' : 'Customer'}: ${m.content}`
      ).join('\n');

      // Call OpenRouter AI for summarization
      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that summarizes customer conversations. Extract key points, next actions, and provide a concise summary.'
            },
            {
              role: 'user',
              content: `Summarize this conversation and extract key points and next actions. Return JSON with: summary (string), key_points (array of strings), next_actions (array of strings).\n\nConversation:\n${conversationText}`
            }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      if (!aiResponse.ok) {
        console.error(`❌ AI summarization failed for conversation ${conv.id}`);
        continue;
      }

      const aiData = await aiResponse.json();
      const result = JSON.parse(aiData.choices[0].message.content);

      // Insert summary into database
      const { error: insertError } = await supabase
        .from('conversation_summaries')
        .insert({
          company_id,
          contact_email: conv.contact_email,
          contact_name: conv.contact_name,
          period_start: messages[0].timestamp,
          period_end: messages[messages.length - 1].timestamp,
          summary: result.summary || 'No summary available',
          key_points: result.key_points || [],
          next_actions: result.next_actions || [],
          last_message_at: conv.last_message_timestamp
        });

      if (insertError) {
        console.error(`❌ Failed to insert summary for conversation ${conv.id}:`, insertError);
      } else {
        summaries.push({ conversation_id: conv.id, summary: result.summary });
        log(`✅ Created summary for conversation with ${conv.contact_name || conv.contact_email}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      summaries_created: summaries.length,
      summaries 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in conversation summarizer:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});