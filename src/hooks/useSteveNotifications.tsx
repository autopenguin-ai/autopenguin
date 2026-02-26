import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserCompany } from './useCompany';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import i18n from '@/lib/i18n';
import { showNotification, hasNotificationPermission } from '@/lib/browserNotifications';

export interface SteveNotification {
  id: string;
  company_id: string;
  user_id: string | null;
  notification_type: 'outcome_clarification' | 'automation_insight' | 'performance_alert' | 'system_announcement' | 'document_update';
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  metadata: {
    workflow_id?: string;
    workflow_name?: string;
    execution_id?: string;
    suggested_mapping?: string;
    confidence?: number;
    detection_layer?: string;
    execution_summary?: any;
    matched_description?: string;
    matched_embedding_id?: string;
    vector_similarity?: number;
  };
  status: 'pending' | 'reviewed' | 'dismissed';
  action_url: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const useSteveNotifications = () => {
  const { user } = useAuth();
  const { data: company } = useUserCompany();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, isError, error, refetch } = useQuery<SteveNotification[]>({
    queryKey: ['steve-notifications', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from('steve_notifications')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SteveNotification[];
    },
    enabled: !!company?.id,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!company?.id) return;

    const channel = supabase
      .channel('steve-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'steve_notifications',
          filter: `company_id=eq.${company.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['steve-notifications', company.id] });
          
          // Show OS notification if tab is hidden
          if (hasNotificationPermission() && document.hidden) {
            const notification = payload.new as SteveNotification;
            const isChineseLanguage = i18n.language?.toLowerCase().startsWith('zh');
            
            // Determine notification category
            const isWorkflowNotification = [
              'outcome_clarification',
              'automation_insight', 
              'performance_alert'
            ].includes(notification.notification_type);
            
            let title: string;
            let body: string;
            
            if (isWorkflowNotification) {
              // For workflow: company name + "Steve needs help understanding X"
              title = company?.display_name || 'AutoPenguin';
              const workflowName = notification.metadata?.workflow_name || 'a workflow';
              body = isChineseLanguage 
                ? `需要協助理解 ${workflowName}`
                : `Needs help understanding ${workflowName}`;
            } else {
              // For system announcements: use title + message
              title = notification.title;
              body = notification.message.length > 100 
                ? notification.message.substring(0, 100) + '...'
                : notification.message;
            }
            
            showNotification(title, {
              body,
              tag: 'steve-bell',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'steve_notifications',
          filter: `company_id=eq.${company.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['steve-notifications', company.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company?.id, queryClient]);

  const approveSuggestion = useMutation({
    mutationFn: async ({ 
      notificationId, 
      workflowId, 
      metricKey, 
      companyId,
      executionId,
      customDescription 
    }: { 
      notificationId: string;
      workflowId: string;
      metricKey: string;
      companyId: string;
      executionId: string;
      customDescription?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('steve-learn-outcome', {
        body: {
          notification_id: notificationId,
          workflow_id: workflowId,
          confirmed_metric_key: metricKey,
          company_id: companyId,
          execution_id: executionId,
          custom_description: customDescription,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steve-notifications'] });
      toast({
        title: 'Thank you!',
        description: 'Steve has learned from your feedback and will use this for future workflows.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to save',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  const dismissNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('steve_notifications')
        .update({ status: 'dismissed', reviewed_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steve-notifications'] });
    },
  });

  return {
    notifications: notifications || [],
    isLoading,
    isError,
    error,
    pendingCount: notifications?.length || 0,
    approveSuggestion: approveSuggestion.mutate,
    dismissNotification: dismissNotification.mutate,
    isApproving: approveSuggestion.isPending,
    refetchNotifications: refetch,
  };
};
