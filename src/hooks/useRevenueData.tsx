import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from './useCompany';
import { useIndustry } from '@/contexts/IndustryContext';

export interface RevenueDataPoint {
  date: string;
  recurringRevenue: number;
  onetimeRevenue: number;
}

export interface SeparatedMetrics {
  newLeads: number;
  viewingsBooked: number;
  automationLeads: number;
  automationViewings: number;
  dealsWon: number;
  ticketsOpen: number;
  avgResponseTime: string;
  ticketsAutoClosed: number;
  activeProjects: number;
  tasksDue: number;
}

export const useRevenueData = (timePeriod: string = '30d') => {
  const { data: userCompany } = useUserCompany();
  const { config } = useIndustry();

  return useQuery({
    queryKey: ['revenue-data', timePeriod, userCompany?.id, config.dealsWonStatuses],
    queryFn: async (): Promise<RevenueDataPoint[]> => {
      if (!userCompany?.id) return [];
      // Calculate date range based on time period
      const today = new Date();
      const startDate = new Date();

      switch (timePeriod) {
        case '7d':
          startDate.setDate(today.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(today.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(today.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setDate(today.getDate() - 30);
      }

      // Get current properties with closed statuses to calculate real-time revenue
      const { data: properties, error } = await supabase
        .from('properties')
        .select('revenue_type, price, updated_at, payment_date')
        .in('status', config.dealsWonStatuses)
        .not('price', 'is', null)
        .gt('price', 0)
        .eq('company_id', userCompany.id);

      if (error) {
        console.error('Error fetching property data:', error);
        return [];
      }

      // Initialize all dates in range with zero values
      const groupedData: { [key: string]: { recurringRevenue: number; onetimeRevenue: number } } = {};
      const current = new Date(startDate);
      while (current <= today) {
        const dateString = current.toISOString().split('T')[0];
        groupedData[dateString] = { recurringRevenue: 0, onetimeRevenue: 0 };
        current.setDate(current.getDate() + 1);
      }
      
      // Add revenue to the actual date when project was completed
      if (properties && properties.length > 0) {
        properties.forEach((property) => {
          const price = Number(property.price);
          
          // Use payment_date if available, otherwise fall back to updated_at
          const dealDate = new Date(property.payment_date || property.updated_at);
          const dealDateString = dealDate.toISOString().split('T')[0];
          
          // Only add revenue if the deal date is within our selected time range
          if (groupedData[dealDateString]) {
            if (property.revenue_type === 'RECURRING') {
              groupedData[dealDateString].recurringRevenue += price;
            } else {
              groupedData[dealDateString].onetimeRevenue += price;
            }
          }
        });
      }

      // Convert to array and sort by date
      const result = Object.entries(groupedData).map(([date, values]) => ({
        date,
        recurringRevenue: values.recurringRevenue,
        onetimeRevenue: values.onetimeRevenue,
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 1 * 60 * 1000, // 1 minute for live updates
    enabled: !!userCompany?.id,
  });
};

export const useSeparatedMetrics = () => {
  const { data: userCompany } = useUserCompany();
  const { config } = useIndustry();

  return useQuery({
    queryKey: ['separated-metrics', userCompany?.id, config.dealsWonStatuses],
    queryFn: async (): Promise<SeparatedMetrics> => {
      if (!userCompany?.id) {
        return {
          newLeads: 0,
          viewingsBooked: 0,
          automationLeads: 0,
          automationViewings: 0,
          dealsWon: 0,
          ticketsOpen: 0,
          avgResponseTime: '0m',
          ticketsAutoClosed: 0,
          activeProjects: 0,
          tasksDue: 0,
        };
      }

      // Get N8N automation metrics
      const { data: n8nData, error: n8nError } = await supabase.functions.invoke('n8n-api-service', {
        body: { action: 'get_metrics' }
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

      // Get deals won using industry-appropriate statuses
      const { data: properties } = await supabase
        .from('properties')
        .select('status')
        .in('status', config.dealsWonStatuses)
        .eq('company_id', userCompany.id);

      const dealsWon = properties?.length || 0;

      // Get active projects count (not in a closed status)
      const { data: activeProjectsData } = await supabase
        .from('properties')
        .select('id')
        .not('status', 'in', `(${config.dealsWonStatuses.join(',')})`)
        .eq('company_id', userCompany.id);

      const activeProjects = activeProjectsData?.length || 0;

      // Get tasks due this week
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
      const { data: tasksDueData } = await supabase
        .from('tasks')
        .select('id')
        .neq('status', 'COMPLETED')
        .lte('due_date', endOfWeek.toISOString())
        .eq('company_id', userCompany.id);

      const tasksDue = tasksDueData?.length || 0;

      // Get actual lead counts from database (from clients table)
      const { data: manualLeads } = await supabase
        .from('clients')
        .select('id')
        .eq('created_by_automation', false)
        .eq('company_id', userCompany.id);

      const { data: automatedLeads } = await supabase
        .from('clients')
        .select('id')
        .eq('created_by_automation', true)
        .eq('company_id', userCompany.id);

      const newLeads = manualLeads?.length || 0;
      const automationLeads = automatedLeads?.length || 0;

      // For viewings, use N8N data as before since we don't have a viewings table yet
      const automationViewings = n8nData?.metrics?.viewingsBooked || 0;
      const viewingsBooked = Math.floor(automationViewings * 0.2); // 20% manual estimate

      return {
        newLeads: Math.max(0, newLeads),
        viewingsBooked: Math.max(0, viewingsBooked),
        automationLeads: Math.max(0, automationLeads),
        automationViewings,
        dealsWon,
        ticketsOpen: n8nData?.metrics?.ticketsOpen || 0,
        avgResponseTime,
        ticketsAutoClosed: n8nData?.metrics?.ticketsAutoClosed || 0,
        activeProjects,
        tasksDue,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 1 * 60 * 1000, // 1 minute
    enabled: !!userCompany?.id,
  });
};