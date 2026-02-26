import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

interface N8NTaskWebhook {
  title: string;
  description?: string;
  type: 'TASK' | 'TICKET' | 'MAINTENANCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;
  assignee_id?: string;
  property_id?: string;
  client_id?: string;
  lead_id?: string;
  deal_id?: string;
  workflow_id: string;
  workflow_name?: string;
  execution_id?: string;
  automation_data?: any;
  // For auto-resolution
  resolve_automatically?: boolean;
  resolution_notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`Received ${req.method} request to n8n-task-webhook`);

  try {
    // Verify webhook signature for security
    const webhookSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('N8N_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const signature = req.headers.get('X-N8N-Signature');
    if (!signature) {
      console.error('Missing X-N8N-Signature header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing signature' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Read body for signature verification
    const bodyText = await req.text();
    
    // Verify HMAC signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(bodyText)
    );
    
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    
    // Use constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(signature, expectedSignature)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid signature' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the verified body
    const webhookData: N8NTaskWebhook = JSON.parse(bodyText);

    if (req.method === 'POST') {
      console.log('Webhook payload:', JSON.stringify(webhookData, null, 2));

      // Validate required fields
      if (!webhookData.title || !webhookData.type || !webhookData.workflow_id) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields: title, type, workflow_id' 
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Determine if this should be auto-resolved
      const isAutoResolved = webhookData.resolve_automatically === true;

      // Create task record
      const taskData = {
        title: webhookData.title,
        description: webhookData.description || null,
        type: webhookData.type,
        status: isAutoResolved ? 'COMPLETED' : 'OPEN',
        priority: webhookData.priority || 'MEDIUM',
        due_date: webhookData.due_date ? new Date(webhookData.due_date).toISOString() : null,
        creator_id: null, // N8N automation doesn't have a user
        assignee_id: webhookData.assignee_id || null,
        property_id: webhookData.property_id || null,
        client_id: webhookData.client_id || null,
        lead_id: webhookData.lead_id || null,
        deal_id: webhookData.deal_id || null,
        created_by_automation: true,
        automation_workflow_id: webhookData.workflow_id,
        resolved_by_automation: isAutoResolved,
        automation_resolution_data: isAutoResolved ? {
          workflow_name: webhookData.workflow_name,
          execution_id: webhookData.execution_id,
          resolved_at: new Date().toISOString(),
          automation_data: webhookData.automation_data
        } : null,
        resolved_at: isAutoResolved ? new Date().toISOString() : null,
        resolution_notes: isAutoResolved ? webhookData.resolution_notes : null,
      };

      const { data: task, error: insertError } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating task:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create task', details: insertError.message }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Task created successfully:', task.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          task_id: task.id,
          message: isAutoResolved ? 'Task created and auto-resolved' : 'Task created successfully'
        }), 
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle task resolution via webhook (for existing tasks)
    if (req.method === 'PUT') {
      const { task_id, resolution_notes, automation_data } = JSON.parse(bodyText);

      if (!task_id) {
        return new Response(
          JSON.stringify({ error: 'Missing task_id' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'COMPLETED',
          resolved_at: new Date().toISOString(),
          resolved_by_automation: true,
          resolution_notes: resolution_notes || 'Automatically resolved by N8N workflow',
          automation_resolution_data: {
            resolved_at: new Date().toISOString(),
            automation_data: automation_data
          }
        })
        .eq('id', task_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating task:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update task', details: updateError.message }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Task resolved successfully:', task_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          task_id: task_id,
          message: 'Task resolved automatically'
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in n8n-task-webhook function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: (error as Error).message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});