import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AddKnowledgeRequest {
  title: string;
  content: string;
  category: string;
  companyId?: string;
  userId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, category, companyId, userId, tags, metadata }: AddKnowledgeRequest = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    console.log("Adding knowledge entry:", { title, category, companyId, userId });

    // Generate embedding for the content
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: `${title}\n${content}`,
        model: "text-embedding-3-small",
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("OpenAI API error:", errorText);
      throw new Error("Failed to generate embedding");
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Insert into knowledge base
    const { data, error } = await supabase
      .from("steve_knowledge_base")
      .insert({
        title,
        content,
        category,
        company_id: companyId || null,
        user_id: userId || null,
        tags: tags || [],
        metadata: metadata || {},
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting knowledge:", error);
      throw error;
    }

    console.log("Knowledge entry created:", data.id);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in steve-knowledge function:", error);
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
