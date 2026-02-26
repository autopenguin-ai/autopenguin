import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from './useCompany';
import { useN8nSync } from './useN8nSync';

export interface DashboardMetrics {
  newLeads: number;
  viewingsBooked: number;
  dealsWon: number;
  revenue: string;
  ticketsOpen: number;
  avgResponseTime: string;
  automationLeads: string;
  ticketsAutoClosed: number;
}

export interface ConversationData {
  id: string;
  contactName: string;
  contactInfo: string;
  avatar: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: MessageData[];
}

export interface MessageData {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  status: string;
  isOutgoing: boolean;
  workflowName?: string;
}

export const useN8nMetrics = () => {
  const { data: userCompany } = useUserCompany();
  const { data: syncComplete } = useN8nSync(); // Wait for central sync
  
  return useQuery({
    queryKey: ['n8n-metrics', userCompany?.id],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!userCompany?.id) {
        return {
          newLeads: 0,
          viewingsBooked: 0,
          dealsWon: 0,
          revenue: 'HK$0',
          ticketsOpen: 0,
          avgResponseTime: '0m',
          automationLeads: '0%',
          ticketsAutoClosed: 0
        };
      }

      // Get N8N metrics
      const { data: n8nData, error: n8nError } = await supabase.functions.invoke('n8n-api-service', {
        body: { 
          action: 'get_metrics',
          company_id: userCompany.id
        }
      });

      if (n8nError) {
        console.error('Error fetching N8N metrics:', n8nError);
      }

      // Calculate avg response time from conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          conversation_messages (
            timestamp,
            is_outgoing
          )
        `)
        .eq('company_id', userCompany.id);

      let avgResponseTime = '0m';
      if (conversations && conversations.length > 0) {
        const responseTimes: number[] = [];
        
        conversations.forEach((conv: any) => {
          const messages = conv.conversation_messages || [];
          for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];
            
            // If current is incoming and next is outgoing, calculate response time
            if (!current.is_outgoing && next.is_outgoing) {
              const responseTime = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
              responseTimes.push(responseTime);
            }
          }
        });

        if (responseTimes.length > 0) {
          const avgMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
          const avgMinutes = Math.round(avgMs / (1000 * 60));
          avgResponseTime = avgMinutes < 60 ? `${avgMinutes}m` : `${Math.round(avgMinutes / 60)}h`;
        }
      }

      // Get deals won from property status changes (AVAILABLE -> RENTED/SOLD)
      const { data: properties } = await supabase
        .from('properties')
        .select('status, updated_at')
        .in('status', ['RENTED', 'SOLD'])
        .eq('company_id', userCompany.id);

      const dealsWon = properties?.length || 0;

      return {
        newLeads: n8nData?.metrics?.newLeads || 0,
        viewingsBooked: n8nData?.metrics?.viewingsBooked || 0,
        dealsWon,
        revenue: n8nData?.metrics?.revenue || 'HK$0',
        ticketsOpen: n8nData?.metrics?.ticketsOpen || 0,
        avgResponseTime,
        automationLeads: n8nData?.metrics?.automationLeads || '0%',
        ticketsAutoClosed: n8nData?.metrics?.ticketsAutoClosed || 0
      };
    },
    staleTime: 30 * 1000, // 30 seconds for live feel
    refetchInterval: 1 * 60 * 1000, // 1 minute
    enabled: !!userCompany?.id,
  });
};

export const useConversations = () => {
  const { data: userCompany } = useUserCompany();
  const { data: syncComplete } = useN8nSync(); // Wait for central sync
  
  return useQuery({
    queryKey: ['conversations', userCompany?.id],
    queryFn: async (): Promise<ConversationData[]> => {
      if (!userCompany?.id) return [];

      // Fetch conversations with their messages
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_messages (*)
        `)
        .eq('company_id', userCompany.id)
        .order('last_message_timestamp', { ascending: false });

      if (convError) {
        console.error('Error fetching conversations:', convError);
        throw convError;
      }

      // Transform data to match UI format
      return (conversations || []).map(conv => ({
        id: conv.id,
        contactName: conv.contact_name,
        contactInfo: conv.contact_info || conv.contact_email || conv.contact_phone,
        avatar: conv.contact_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'UN',
        lastMessage: conv.last_message || 'No messages',
        lastTimestamp: conv.last_message_timestamp || conv.created_at,
        unreadCount: conv.unread_count || 0,
        messages: (conv.conversation_messages || []).map((msg: any) => ({
          id: msg.id,
          type: msg.message_type,
          content: msg.content,
          timestamp: msg.timestamp,
          status: msg.status,
          isOutgoing: msg.is_outgoing,
          workflowName: msg.workflow_name
        })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      }));
    },
    staleTime: 30 * 1000, // 30 seconds for real-time feel
    refetchInterval: 1 * 60 * 1000, // 1 minute refresh
    enabled: !!userCompany?.id && syncComplete === true,
  });
};

export const useActiveWorkflows = (options?: { enabled?: boolean }) => {
  const { data: userCompany } = useUserCompany();
  const { data: syncComplete } = useN8nSync(); // Wait for central sync
  
  return useQuery({
    queryKey: ['active-workflows', userCompany?.id],
    queryFn: async () => {
      if (!userCompany?.id) return [];

      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('company_id', userCompany.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching workflows:', error);
        throw error;
      }

      // Sort: active workflows first, then by name
      const sortedWorkflows = (data || []).sort((a, b) => {
        if (a.is_active === b.is_active) {
          return (a.name || '').localeCompare(b.name || '');
        }
        return a.is_active ? -1 : 1;
      });

      return sortedWorkflows;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // 2 minutes for auto-sync
    enabled: !!userCompany?.id && syncComplete === true && (options?.enabled !== false),
  });
};

export const useWorkflowMetrics = (options?: { enabled?: boolean; windowDays?: number | null }) => {
  const { data: userCompany } = useUserCompany();
  const { data: syncComplete } = useN8nSync(); // Wait for central sync
  const windowDays = options?.windowDays ?? 7; // Default to 7 days
  
  return useQuery({
    queryKey: ['workflow-metrics', userCompany?.id, windowDays],
    queryFn: async () => {
      if (!userCompany?.id) return null;

      // Get workflow metrics from the edge function (no sync here - already done by useN8nSync)
      const { data, error } = await supabase.functions.invoke('n8n-api-service', {
        body: { 
          action: 'get_workflow_metrics',
          company_id: userCompany.id,
          windowDays
        }
      });

      if (error) throw error;

      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // 2 minutes for auto-sync
    enabled: !!userCompany?.id && syncComplete === true && (options?.enabled !== false),
  });
};