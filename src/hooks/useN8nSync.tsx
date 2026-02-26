import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from './useCompany';

/**
 * Centralized N8N sync hook - all other hooks depend on this
 * This prevents duplicate sync calls and improves performance
 */
export const useN8nSync = () => {
  const { data: userCompany } = useUserCompany();
  
  return useQuery({
    queryKey: ['n8n-sync', userCompany?.id],
    queryFn: async () => {
      if (!userCompany?.id) {
        console.log('⏭️ Skipping sync: No company ID');
        return false;
      }

      console.log('🔄 Starting N8N sync for company:', userCompany.id);
      
      const { error: workflowError } = await supabase.functions.invoke('n8n-api-service', {
        body: { 
          action: 'sync_workflows',
          company_id: userCompany.id
        }
      });

      if (workflowError) {
        console.error('❌ Workflow sync failed:', workflowError);
        throw workflowError;
      }

      console.log('▶️ Syncing N8N executions...');
      const { error: execError } = await supabase.functions.invoke('n8n-api-service', {
        body: {
          action: 'sync_executions',
          company_id: userCompany.id
        }
      });

      if (execError) {
        console.error('⚠️ Execution sync failed (continuing):', execError);
      } else {
        console.log('✅ Execution sync completed successfully');
      }

      console.log('✅ Overall sync completed');
      return true;
    },
    enabled: !!userCompany?.id,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 5 * 1000, // Auto-refresh every 5 seconds
  });
};
