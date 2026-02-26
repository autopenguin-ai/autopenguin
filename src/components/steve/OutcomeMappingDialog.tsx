import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useSteveNotifications, SteveNotification } from '@/hooks/useSteveNotifications';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Ticket, Mail, TrendingUp, HelpCircle } from 'lucide-react';

interface OutcomeMappingDialogProps {
  notification: SteveNotification;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OUTCOME_OPTIONS = [
  { 
    value: 'meeting_booked', 
    label: 'Meeting/Viewing Booked',
    labelZh: '會議/看房已預約',
    icon: Calendar,
    description: 'A viewing, consultation, or meeting was scheduled',
    descriptionZh: '已安排看房、諮詢或會議'
  },
  { 
    value: 'lead_created', 
    label: 'Lead Created',
    labelZh: '線索已創建',
    icon: Users,
    description: 'A new potential customer or contact was added',
    descriptionZh: '已添加新的潛在客戶或聯絡人'
  },
  { 
    value: 'ticket_created', 
    label: 'Ticket/Issue Created',
    labelZh: '工單/問題已創建',
    icon: Ticket,
    description: 'A support ticket or maintenance issue was logged',
    descriptionZh: '已記錄支持工單或維護問題'
  },
  { 
    value: 'ticket_resolved', 
    label: 'Ticket Resolved',
    labelZh: '工單已解決',
    icon: Ticket,
    description: 'A support ticket was closed or resolved',
    descriptionZh: '支持工單已關閉或解決'
  },
  { 
    value: 'email_sent', 
    label: 'Email Sent',
    labelZh: '郵件已發送',
    icon: Mail,
    description: 'An automated email was successfully sent',
    descriptionZh: '自動郵件已成功發送'
  },
  { 
    value: 'deal_won', 
    label: 'Deal Won',
    labelZh: '交易成功',
    icon: TrendingUp,
    description: 'A sale or deal was successfully closed',
    descriptionZh: '銷售或交易已成功完成'
  },
  { 
    value: 'unknown', 
    label: 'Other/Unknown',
    labelZh: '其他/未知',
    icon: HelpCircle,
    description: "I'm not sure what this workflow does",
    descriptionZh: '我不確定這個工作流做什麼'
  },
];

export function OutcomeMappingDialog({ notification, open, onOpenChange }: OutcomeMappingDialogProps) {
  const { t, i18n } = useTranslation();
  const { approveSuggestion, isApproving } = useSteveNotifications();
  const [selectedOutcome, setSelectedOutcome] = useState(
    notification.metadata?.suggested_mapping || 'unknown'
  );
  const [customDescription, setCustomDescription] = useState("");

  const isZh = i18n.language === 'zh';

  const handleConfirm = () => {
    approveSuggestion({
      notificationId: notification.id,
      workflowId: notification.metadata?.workflow_id!,
      metricKey: selectedOutcome,
      companyId: notification.company_id,
      executionId: notification.metadata?.execution_id!,
      customDescription: selectedOutcome === 'unknown' ? customDescription : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('steve.dialog.title', 'Help Steve Understand This Workflow')}
          </DialogTitle>
          <DialogDescription>
            {t('steve.dialog.description', 'What did this workflow do?')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('steve.dialog.workflow', 'Workflow:')}
              </span>
              <span className="text-sm">{notification.metadata?.workflow_name}</span>
            </div>
            {notification.metadata?.confidence !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('steve.dialog.confidence', "Steve's Confidence:")}
                </span>
                <Badge variant="outline">
                  {Math.round((notification.metadata.confidence || 0) * 100)}%
                </Badge>
              </div>
            )}
            {notification.metadata?.detection_layer && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('steve.dialog.detection_method', 'Detection Method:')}
                </span>
                <Badge variant="outline">
                  {notification.metadata.detection_layer === 'vector_semantic' 
                    ? t('steve.dialog.semantic_match', 'Semantic Match')
                    : notification.metadata.detection_layer === 'heuristic'
                    ? t('steve.dialog.keyword_match', 'Keyword Match')
                    : notification.metadata.detection_layer === 'ai'
                    ? t('steve.dialog.ai_analysis', 'AI Analysis')
                    : t('steve.dialog.rule_based', 'Rule-Based')}
                </Badge>
              </div>
            )}
            {notification.metadata?.matched_description && (
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">
                  {t('steve.dialog.matched_pattern', 'Matched Pattern:')}
                </span>
                <p className="text-xs text-muted-foreground italic">
                  "{notification.metadata.matched_description}"
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t('steve.dialog.select', 'Select what this workflow did:')}
            </Label>
            <RadioGroup value={selectedOutcome} onValueChange={setSelectedOutcome}>
              {OUTCOME_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOutcome(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor={option.value}
                        className="flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {isZh ? option.labelZh : option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isZh ? option.descriptionZh : option.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>

            {selectedOutcome === 'unknown' && (
              <div className="mt-4 space-y-2 p-4 border rounded-lg bg-muted/50">
                <Label htmlFor="custom-desc" className="text-sm font-medium">
                  {isZh ? '請描述此工作流的作用' : 'Please describe what this workflow does'}
                </Label>
                <Textarea
                  id="custom-desc"
                  placeholder={isZh 
                    ? '例如：當收到新郵件時，將聯絡人添加到 CRM 並發送自動回覆...' 
                    : 'e.g., When a new email arrives, add contact to CRM and send auto-reply...'}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {isZh 
                    ? 'Steve 會從您的描述中學習，並在未來更好地識別類似的工作流' 
                    : 'Steve will learn from your description and better recognize similar workflows in the future'}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApproving}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isApproving || (selectedOutcome === 'unknown' && !customDescription.trim())}
          >
            {isApproving ? t('saving') : t('steve.dialog.confirm', 'Confirm & Teach Steve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
