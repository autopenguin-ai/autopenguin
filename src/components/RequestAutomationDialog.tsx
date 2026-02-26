import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';

interface RequestAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestAutomationDialog({ open, onOpenChange }: RequestAutomationDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: company } = useUserCompany();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    automationType: '',
    description: '',
    priority: 'Medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-automation-request', {
        body: {
          ...formData,
          company_id: company?.id || null
        }
      });

      if (error) throw error;

      toast({
        title: t('request-submitted-successfully'),
        description: t('request-sent-description'),
      });

      setFormData({
        name: '',
        email: '',
        automationType: '',
        description: '',
        priority: 'Medium'
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('error-sending-request'),
        description: t('try-again-contact-support'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('request-new-ai-agent')}</DialogTitle>
          <DialogDescription>
            Describe the automation you need. Our AI will generate the workflow and deploy it to your n8n instance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('your-name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="automationType">{t('ai-agent-type')}</Label>
            <Input
              id="automationType"
              placeholder={t('ai-agent-type-placeholder')}
              value={formData.automationType}
              onChange={(e) => setFormData({...formData, automationType: e.target.value})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              placeholder={t('description-placeholder')}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  {t('sending')}
                </>
              ) : (
                t('send-request')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}