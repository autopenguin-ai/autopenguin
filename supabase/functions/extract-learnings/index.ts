import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getAppUrl } from '../_shared/env.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const MEMORY_CAP = 200;

interface LearningEntry {
  title: string;
  content: string;
  category: string;
  type: string;
  scope: "user" | "company";
}

async function readVaultSecret(supabaseUrl: string, serviceKey: string, secretId: string): Promise<string | null> {
  try {
    const client = createClient(supabaseUrl, serviceKey);
    const { data } = await client.rpc('read_secret', { secret_id: secretId });
    return data || null;
  } catch {
    return null;
  }
}

async function getUserLLMConfig(userId: string) {
  const { data: conn } = await supabase
    .from('llm_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!conn) return null;

  let apiKey = '';
  if (conn.api_key_vault_id) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    apiKey = await readVaultSecret(supabaseUrl, serviceKey, conn.api_key_vault_id) || '';
  }

  return {
    provider: conn.provider,
    model: conn.model,
    apiKey,
    baseUrl: conn.base_url || undefined,
  };
}

function getLLMEndpoint(config: { provider: string; baseUrl?: string }) {
  switch (config.provider) {
    case 'openai': return 'https://api.openai.com/v1/chat/completions';
    case 'anthropic': return 'https://api.anthropic.com/v1/messages';
    case 'openrouter': return 'https://openrouter.ai/api/v1/chat/completions';
    case 'local': return config.baseUrl || 'http://localhost:1234/v1/chat/completions';
    default: return 'https://openrouter.ai/api/v1/chat/completions';
  }
}

async function callLLM(config: any, systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    if (config.provider === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.content?.[0]?.text || null;
    }

    const endpoint = getLLMEndpoint(config);
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = getAppUrl();
      headers['X-Title'] = 'AutoPenguin Learning';
    }

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error('LLM call failed:', e);
    return null;
  }
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text, model: "text-embedding-3-small" }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

async function extractForConversation(conversationId: string, userId: string, companyId: string) {
  console.log(`🧠 Extracting learnings for conversation ${conversationId}`);

  // 1. Fetch flagged messages
  const { data: flaggedMessages, error } = await supabase
    .from('steve_messages')
    .select('id, content, metadata, role')
    .eq('conversation_id', conversationId)
    .not('metadata', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return;
  }

  const memoryMessages = (flaggedMessages || []).filter(
    (m: any) => m.metadata?.memory_worthy === true
  );

  if (memoryMessages.length === 0) {
    console.log('No memory-worthy messages found, marking as extracted');
    await (supabase
      .from('steve_conversations') as any)
      .update({ learnings_extracted: true })
      .eq('id', conversationId);
    return;
  }

  console.log(`Found ${memoryMessages.length} memory-worthy messages`);

  // 2. Get user's LLM config
  const llmConfig = await getUserLLMConfig(userId);
  if (!llmConfig) {
    console.log('No LLM configured for user, skipping extraction');
    return;
  }

  // 3. Consolidate via LLM
  const summaries = memoryMessages
    .map((m: any) => `- [${m.metadata.memory_type}] ${m.metadata.memory_summary}`)
    .join('\n');

  const systemPrompt = `You are a knowledge extraction assistant. Your job is to consolidate conversation memory flags into distinct, reusable knowledge entries.

RULES:
- Output ONLY valid JSON array, no markdown fences, no explanation
- Each entry: {"title": "...", "content": "...", "category": "...", "type": "...", "scope": "user|company"}
- Categories: user_preference, user_fact, user_pattern, user_person, company_fact
- type: preference, fact, pattern, person
- scope: "user" for personal preferences/patterns, "company" for business-wide facts
- NEVER store passwords, API keys, credit card numbers, bank details, personal ID numbers, or credentials
- Summarise context without actual sensitive values
- Merge overlapping entries into one
- Be concise: title ≤ 10 words, content ≤ 2 sentences`;

  const userPrompt = `Consolidate these memory flags into distinct knowledge entries:\n\n${summaries}`;

  const llmResponse = await callLLM(llmConfig, systemPrompt, userPrompt);
  if (!llmResponse) {
    console.error('LLM extraction failed');
    return;
  }

  // 4. Parse response
  let entries: LearningEntry[];
  try {
    const cleaned = llmResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    entries = JSON.parse(cleaned);
    if (!Array.isArray(entries)) throw new Error('Not an array');
  } catch (e) {
    console.error('Failed to parse LLM response:', e, llmResponse);
    return;
  }

  console.log(`LLM produced ${entries.length} knowledge entries`);

  // 5. Check memory cap
  const { count: existingCount } = await supabase
    .from('steve_knowledge_base')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  let availableSlots = MEMORY_CAP - (existingCount || 0);

  // 6. For each entry: dedup, embed, insert
  for (const entry of entries) {
    const embedding = await generateEmbedding(`${entry.title}\n${entry.content}`);
    if (!embedding) {
      console.error('Failed to generate embedding for:', entry.title);
      continue;
    }

    const { data: similar } = await supabase.rpc('search_steve_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.85,
      match_count: 1,
      filter_company_id: companyId,
      filter_user_id: userId,
    });

    if (similar && similar.length > 0) {
      console.log(`Updating existing entry: ${similar[0].title} → ${entry.title}`);
      await (supabase
        .from('steve_knowledge_base') as any)
        .update({
          title: entry.title,
          content: entry.content,
          category: entry.category,
          embedding,
          updated_at: new Date().toISOString(),
        })
        .eq('id', similar[0].id);
    } else {
      if (availableSlots <= 0) {
        const { data: oldest } = await (supabase
          .from('steve_knowledge_base') as any)
          .select('id')
          .eq('user_id', userId)
          .in('category', ['user_preference', 'user_fact', 'user_pattern', 'user_person', 'company_fact'])
          .order('last_accessed_at', { ascending: true })
          .limit(1)
          .single();

        if (oldest) {
          await supabase.from('steve_knowledge_base').delete().eq('id', oldest.id);
          availableSlots++;
        }
      }

      if (availableSlots > 0) {
        const scopeUserId = entry.scope === 'user' ? userId : null;
        console.log(`Inserting new entry: ${entry.title} (scope: ${entry.scope})`);
        await (supabase.from('steve_knowledge_base') as any).insert({
          title: entry.title,
          content: entry.content,
          category: entry.category,
          company_id: companyId,
          user_id: scopeUserId,
          embedding,
          tags: [entry.type, 'learned'],
          metadata: { source: 'conversation_learning', conversation_id: conversationId },
        });
        availableSlots--;
      }
    }
  }

  // 7. Mark conversation as extracted
  await (supabase
    .from('steve_conversations') as any)
    .update({ learnings_extracted: true })
    .eq('id', conversationId);

  console.log(`✅ Extraction complete for conversation ${conversationId}`);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { conversationId, userId, companyId, batch } = body;

    if (batch) {
      console.log('🧠 Batch extraction mode');

      const { data: conversations, error } = await (supabase
        .from('steve_conversations') as any)
        .select('id, user_id, company_id')
        .eq('learnings_extracted', false)
        .is('deleted_at', null)
        .limit(50);

      if (error) throw error;

      console.log(`Found ${conversations?.length || 0} conversations to process`);

      for (const conv of conversations || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('learning_enabled')
          .eq('user_id', conv.user_id)
          .single();

        if ((profile as any)?.learning_enabled === false) {
          await (supabase
            .from('steve_conversations') as any)
            .update({ learnings_extracted: true })
            .eq('id', conv.id);
          continue;
        }

        await extractForConversation(conv.id, conv.user_id, conv.company_id);
      }

      return new Response(JSON.stringify({ success: true, processed: conversations?.length || 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!conversationId || !userId || !companyId) {
      return new Response(
        JSON.stringify({ error: 'conversationId, userId, and companyId are required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('learning_enabled')
      .eq('user_id', userId)
      .single();

    if ((profile as any)?.learning_enabled === false) {
      return new Response(JSON.stringify({ skipped: true, reason: 'learning_disabled' }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await extractForConversation(conversationId, userId, companyId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in extract-learnings:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
