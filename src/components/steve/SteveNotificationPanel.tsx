import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, X, MessageCircle, AlertCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { useSteveNotifications } from '@/hooks/useSteveNotifications';
import { useState } from 'react';
import { OutcomeMappingDialog } from './OutcomeMappingDialog';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export function SteveNotificationPanel() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { notifications, isLoading, isError, error, approveSuggestion, dismissNotification } = useSteveNotifications();
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  const toggleExpanded = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };
  
  const handleReload = () => {
    queryClient.invalidateQueries({ queryKey: ['steve-notifications'] });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'yellow' as const;
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getMetricLabel = (metricKey: string) => {
    const labels: Record<string, string> = {
      'meeting_booked': t('notifications.meeting_booked', 'Meeting Booked'),
      'lead_created': t('notifications.lead_created', 'Lead Created'),
      'ticket_created': t('notifications.ticket_created', 'Ticket Created'),
      'ticket_resolved': t('notifications.ticket_resolved', 'Ticket Resolved'),
      'email_sent': t('notifications.email_sent', 'Email Sent'),
      'deal_won': t('notifications.deal_won', 'Deal Won'),
      'unknown': t('notifications.unknown', 'Unknown'),
    };
    return labels[metricKey] || metricKey;
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        {t('loading')}...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive/50" />
        <p className="text-sm font-medium mb-2">{t('error-loading-notifications')}</p>
        <p className="text-xs text-muted-foreground mb-4">
          {error?.message || t('please-try-again')}
        </p>
        <Button 
          onClick={handleReload}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t('reload')}
        </Button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">{t('notifications.no_pending', 'All caught up!')}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('notifications.no_pending_desc', "You'll be notified when action is needed")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-2">{t('notifications.title', "Notifications")}</h3>
        <p className="text-xs text-muted-foreground">
          {notifications.length} {t('notifications.pending_reviews', 'pending reviews')}
        </p>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="divide-y">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                      {notification.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm mb-2">{notification.title}</h4>
                  
                  {/* Expandable Message Details */}
                  <Collapsible 
                    open={expandedNotifications.has(notification.id)}
                    onOpenChange={() => toggleExpanded(notification.id)}
                    className="mb-2"
                  >
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline">
                      {expandedNotifications.has(notification.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {t('notifications.view_details')}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-primary/50">
                        {notification.message}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                  
                  {/* Workflow Context */}
                  {notification.metadata?.workflow_name && (
                    <div className="mb-2 p-2 bg-muted/50 rounded text-xs">
                      <span className="font-medium text-muted-foreground">
                        {t('notifications.workflow')}: 
                      </span>
                      <span className="ml-1 font-mono">
                        "{notification.metadata.workflow_name}"
                      </span>
                    </div>
                  )}
                  
                  {/* Detection Method */}
                  {notification.metadata?.detection_layer && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {notification.metadata.detection_layer === 'vector_semantic' && (
                        <>
                          {t('notifications.detected_semantic')}
                          {notification.metadata.matched_description && (
                            <span className="italic ml-1">
                              "{notification.metadata.matched_description.substring(0, 60)}..."
                            </span>
                          )}
                        </>
                      )}
                      {notification.metadata.detection_layer === 'heuristic' && (
                        t('notifications.detected_keywords')
                      )}
                      {notification.metadata.detection_layer === 'ai' && (
                        <>Detected by Steve</>
                      )}
                      {notification.metadata.detection_layer === 'deterministic' && (
                        t('notifications.detected_deterministic')
                      )}
                    </p>
                  )}
                  
                  {/* Steve's Suggestion */}
                  {notification.metadata?.suggested_mapping && (
                    <div className="flex items-center gap-1 text-xs flex-wrap">
                      <span className="text-muted-foreground">{t('notifications.suggestion')}:</span>
                      <Badge variant="outline" className="text-xs">
                        {getMetricLabel(notification.metadata.suggested_mapping)}
                      </Badge>
                      <span className="text-muted-foreground">
                        ({Math.round((notification.metadata.confidence || 0) * 100)}% {t('notifications.confident')})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    if (notification.metadata?.suggested_mapping) {
                      approveSuggestion({
                        notificationId: notification.id,
                        workflowId: notification.metadata.workflow_id!,
                        metricKey: notification.metadata.suggested_mapping,
                        companyId: notification.company_id,
                        executionId: notification.metadata.execution_id!,
                      });
                    }
                  }}
                  className="flex-1"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {t('notifications.approve', 'Approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedNotification(notification)}
                  className="flex-1"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {t('notifications.change', 'Change')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {selectedNotification && (
        <OutcomeMappingDialog
          notification={selectedNotification}
          open={!!selectedNotification}
          onOpenChange={(open) => !open && setSelectedNotification(null)}
        />
      )}
    </>
  );
}
