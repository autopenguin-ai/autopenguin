import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from './useCompany';

export interface ConversationSummary {
  id: string;
  contact_email: string | null;
  contact_name: string | null;
  period_start: string;
  period_end: string;
  summary: string;
  key_points: string[];
  next_actions: string[];
  last_message_at: string | null;
  created_at: string;
}

export const useConversationSummaries = (searchTerm?: string) => {
  const { data: userCompany } = useUserCompany();

  return useQuery({
    queryKey: ['conversation-summaries', userCompany?.id, searchTerm],
    queryFn: async (): Promise<ConversationSummary[]> => {
      if (!userCompany?.id) return [];

      let query = supabase
        .from('conversation_summaries')
        .select('*')
        .eq('company_id', userCompany.id)
        .order('last_message_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`contact_name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversation summaries:', error);
        throw error;
      }

      return data as ConversationSummary[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!userCompany?.id,
  });
};