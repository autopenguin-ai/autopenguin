import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserCompany } from './useCompany';

interface ToggleWorkflowData {
  workflowId: string;
  currentStatus: boolean;
}

export const useWorkflowToggle = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userCompany } = useUserCompany();

  return useMutation({
    mutationFn: async ({ workflowId, currentStatus }: ToggleWorkflowData) => {
      if (!userCompany?.id) {
        toast({
          title: 'Error',
          description: 'Unable to determine your company. Please refresh the page.',
          variant: 'destructive',
        });
        throw new Error('Company ID not found');
      }

      const action = currentStatus ? 'deactivate_workflow' : 'activate_workflow';
      
      const { data, error } = await supabase.functions.invoke('n8n-api-service', {
        body: { 
          action,
          workflow_id: workflowId,
          company_id: userCompany.id
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('❌ Backend error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.success) {
        console.error('❌ Toggle failed:', data);
        throw new Error(data?.message || 'Failed to toggle workflow');
      }

      console.log('✅ Toggle success:', data);
      return data;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['active-workflows', userCompany?.id] });

      // Snapshot the previous value
      const previousWorkflows = queryClient.getQueryData(['active-workflows', userCompany?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(['active-workflows', userCompany?.id], (old: any) => {
        if (!old) return old;
        return old.map((workflow: any) => 
          workflow.n8n_workflow_id === variables.workflowId
            ? { ...workflow, is_active: !variables.currentStatus }
            : workflow
        );
      });

      // Return a context with the previous and new values
      return { previousWorkflows };
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousWorkflows) {
        queryClient.setQueryData(['active-workflows', userCompany?.id], context.previousWorkflows);
      }
      
      console.error('Failed to toggle workflow:', error);
      
      // Extract the actual error message from the backend
      let errorMessage = `Failed to ${variables.currentStatus ? 'deactivate' : 'activate'} the AI agent.`;
      
      // Try to get detailed error from data.error if available
      if (error?.message) {
        errorMessage += ` ${error.message}`;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    onSuccess: (_, variables) => {
      const newStatus = !variables.currentStatus;
      
      toast({
        title: newStatus ? 'Workflow Activated' : 'Workflow Deactivated',
        description: `The AI agent has been ${newStatus ? 'activated' : 'deactivated'} successfully.`,
      });

      // Invalidate and refetch workflows to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['active-workflows', userCompany?.id] });
      queryClient.invalidateQueries({ queryKey: ['workflow-metrics', userCompany?.id] });
    }
  });
};