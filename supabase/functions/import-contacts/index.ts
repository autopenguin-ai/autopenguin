import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ContactRow {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  lead_stage?: string;
  lead_source?: string;
  lead_priority?: string;
  value_estimate?: number;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      throw new Error('User profile or company not found');
    }

    const { csvContent } = await req.json();
    
    if (!csvContent) {
      throw new Error('No CSV content provided');
    }

    console.log('Processing CSV for company:', profile.company_id);

    // Parse CSV
    const lines = csvContent.split('\n').filter((line: string) => line.trim());
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    console.log('CSV Headers:', headers);
    console.log('Total rows:', lines.length - 1);

    const stats = {
      totalRows: lines.length - 1,
      processedContacts: 0,
      insertedContacts: 0,
      processingErrors: 0,
      insertErrors: 0
    };

    const errors: any[] = [];
    const contactsToInsert: any[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map((v: string) => v.trim());
        const row: any = {};
        
        headers.forEach((header: string, index: number) => {
          row[header] = values[index] || '';
        });

        // Validate required fields
        if (!row.first_name || !row.last_name) {
          stats.processingErrors++;
          errors.push({
            row: i + 1,
            error: 'Missing required fields: first_name and last_name are required'
          });
          continue;
        }

        const contact: any = {
          company_id: profile.company_id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email || null,
          phone: row.phone || null,
          company: row.company || null,
          lead_stage: row.lead_stage || 'NEW',
          lead_source: row.lead_source || null,
          lead_priority: row.lead_priority || 'MEDIUM',
          value_estimate: row.value_estimate ? parseFloat(row.value_estimate) : null,
          notes: row.notes || null,
          created_by_automation: false,
        };

        contactsToInsert.push(contact);
        stats.processedContacts++;

      } catch (error) {
        stats.processingErrors++;
        errors.push({
          row: i + 1,
          error: `Error processing row: ${(error as Error).message}`
        });
        console.error(`Error processing row ${i + 1}:`, error);
      }
    }

    // Batch insert contacts
    if (contactsToInsert.length > 0) {
      console.log(`Inserting ${contactsToInsert.length} contacts...`);
      
      const { data: insertedContacts, error: insertError } = await supabase
        .from('clients')
        .insert(contactsToInsert)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        stats.insertErrors++;
        errors.push({
          batch: 'all',
          error: `Database insert error: ${insertError.message}`
        });
      } else {
        stats.insertedContacts = insertedContacts?.length || 0;
        console.log(`Successfully inserted ${stats.insertedContacts} contacts`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Import contacts error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
