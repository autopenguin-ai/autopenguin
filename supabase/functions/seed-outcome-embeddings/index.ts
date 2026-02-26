import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Seed data: Multilingual outcome descriptions
const OUTCOME_SEEDS: Record<string, string[]> = {
  meeting_booked: [
    // English variations
    "viewing appointment scheduled with client",
    "meeting booked with customer",
    "calendar event created for consultation",
    "property tour arranged",
    "scheduled walkthrough with prospect",
    "appointment confirmed for property showing",
    "client meeting set up",
    
    // Traditional Chinese
    "安排看房預約",
    "客戶會議已確認",
    "物業參觀時間已定",
    "諮詢預約成功",
    "已安排睇樓",
    "參觀時間確定",
    
    // Mixed/casual
    "set up property viewing",
    "arranged showing appointment",
    "客戶參觀已安排",
    "預約已確認",
  ],
  
  lead_created: [
    // English variations
    "new prospect added to CRM",
    "contact form submitted successfully",
    "lead captured from website",
    "inquiry received from potential customer",
    "new contact created in database",
    "prospect information collected",
    
    // Traditional Chinese
    "潛在客戶已創建",
    "新線索已收集",
    "表單提交成功",
    "客戶查詢已記錄",
    "新聯絡人已添加",
    "潛在買家資料收集",
    
    // Mixed
    "new client contact added",
    "lead generation successful",
    "收集客戶資料",
  ],
  
  ticket_created: [
    // English
    "support ticket opened",
    "maintenance issue logged",
    "customer complaint registered",
    "service request created",
    "problem report submitted",
    
    // Traditional Chinese
    "工單已創建",
    "客訴已記錄",
    "維修請求已提交",
    "問題已登記",
    "服務請求已建立",
    
    // Mixed
    "customer issue reported",
    "維護工單開啟",
  ],
  
  ticket_resolved: [
    // English
    "support ticket closed",
    "issue resolved successfully",
    "problem fixed and verified",
    "ticket marked as complete",
    "customer issue solved",
    
    // Traditional Chinese
    "工單已完成",
    "問題已解決",
    "客訴處理完成",
    "維修已完成",
    "服務請求已結案",
    
    // Mixed
    "issue fixed",
    "問題已處理",
  ],
  
  email_sent: [
    // English
    "automated email delivered",
    "notification message sent",
    "email successfully transmitted",
    "message dispatched to recipient",
    "email campaign delivered",
    
    // Traditional Chinese
    "自動郵件已發送",
    "通知訊息已寄出",
    "電郵發送成功",
    "訊息已傳送",
    "郵件已送達",
    
    // Mixed
    "email notification sent",
    "通知郵件發送",
  ],
  
  deal_won: [
    // English
    "sale successfully closed",
    "contract signed and finalized",
    "deal won and payment received",
    "property sold to buyer",
    "transaction completed",
    
    // Traditional Chinese
    "交易成功完成",
    "合約已簽署",
    "銷售成交",
    "物業已售出",
    "交易已完成",
    
    // Mixed
    "sale completed",
    "成功售出",
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🌱 Starting outcome embeddings seed...');

    let totalSeeded = 0;
    let totalSkipped = 0;

    for (const [metricKey, descriptions] of Object.entries(OUTCOME_SEEDS)) {
      console.log(`\n📊 Processing ${metricKey}...`);

      for (const description of descriptions) {
        // Check if embedding already exists
        const { data: existing } = await supabase
          .from('outcome_type_embeddings')
          .select('id')
          .eq('metric_key', metricKey)
          .eq('description', description)
          .is('company_id', null)
          .maybeSingle();

        if (existing) {
          console.log(`  ⏭️  Skipping existing: "${description.slice(0, 50)}..."`);
          totalSkipped++;
          continue;
        }

        // Generate embedding
        console.log(`  🔄 Generating embedding for: "${description.slice(0, 50)}..."`);
        
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: description,
            model: 'text-embedding-3-small',
          }),
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          console.error(`  ❌ OpenAI API failed for "${description}":`, errorText);
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Detect language
        const isChinese = /[\u4e00-\u9fa5]/.test(description);
        const language = isChinese ? 'zh' : 'en';

        // Insert into database
        const { error: insertError } = await supabase
          .from('outcome_type_embeddings')
          .insert({
            metric_key: metricKey,
            description,
            language,
            embedding,
            source: 'system',
            company_id: null, // Global embeddings
          });

        if (insertError) {
          console.error(`  ❌ Failed to insert "${description}":`, insertError);
        } else {
          console.log(`  ✅ Seeded: "${description}"`);
          totalSeeded++;
        }

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   📥 ${totalSeeded} new embeddings added`);
    console.log(`   ⏭️  ${totalSkipped} existing embeddings skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        total_seeded: totalSeeded,
        total_skipped: totalSkipped,
        outcome_types: Object.keys(OUTCOME_SEEDS),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in seed-outcome-embeddings:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
