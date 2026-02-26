import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from './useCompany';
import { showNotification, hasNotificationPermission } from '@/lib/browserNotifications';

export const useAutomationPush = () => {
  const { data: userCompany } = useUserCompany();
  
  useEffect(() => {
    if (!userCompany?.id || !hasNotificationPermission()) {
      return;
    }
    
    const companyTitle = userCompany.display_name || userCompany.name || userCompany.short_code;
    
    // Subscribe to automation-created tasks
    const taskChannel = supabase
      .channel('automation-tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `company_id=eq.${userCompany.id}`
        },
        (payload) => {
          const task = payload.new as any;
          if (!task.created_by_automation) return;
          
          const isTicket = task.type === 'TICKET';
          const actionLabel = isTicket ? 'Ticket' : 'Task';
          const actionLabelZh = isTicket ? '工單' : '任務';
          const workflowName = 'workflow'; // Can enhance later with workflow lookup
          
          console.log(`📲 Automation push: ${actionLabel} created by ${workflowName}`);
          showNotification(companyTitle, {
            body: `${actionLabel} added by ${workflowName} | ${actionLabelZh}已由「${workflowName}」建立`,
            icon: '/autopenguin-logo.png'
          });
        }
      )
      .subscribe();
    
    // Subscribe to automation-created leads (contacts)
    const leadChannel = supabase
      .channel('automation-leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `company_id=eq.${userCompany.id}`
        },
        (payload) => {
          const lead = payload.new as any;
          if (!lead.created_by_automation) return;
          
          const workflowName = 'workflow';
          console.log(`📲 Automation push: Contact created by ${workflowName}`);
          showNotification(companyTitle, {
            body: `Contact added by ${workflowName} | 聯絡人已由「${workflowName}」建立`,
            icon: '/autopenguin-logo.png'
          });
        }
      )
      .subscribe();
    
    console.log('✅ Automation push notifications enabled');
    
    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(leadChannel);
      console.log('🔌 Automation push notifications disconnected');
    };
  }, [userCompany]);
};
