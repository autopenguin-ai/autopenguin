import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserCompany } from "@/hooks/useCompany";
import { useTranslation } from "react-i18next";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportDialog = ({ open, onOpenChange }: SupportDialogProps) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: userCompany } = useUserCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: t('validation-error'),
        description: 'You must be logged in to send a support request',
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: t('validation-error'),
        description: 'Please enter a message',
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const userName = user.user_metadata?.first_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
        : user.email?.split('@')[0] || 'User';

      const { error } = await supabase.functions.invoke('send-support-request', {
        body: {
          user_id: user.id,
          user_email: user.email,
          user_name: userName,
          message: message.trim(),
          company_id: userCompany?.id || null,
        }
      });

      if (error) throw error;

      toast({
        title: t('supportDialog.success', 'Support request sent'),
        description: t('supportDialog.successDesc', "We'll get back to you as soon as possible."),
      });
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending support request:', error);
      toast({
        title: t('supportDialog.error', 'Error'),
        description: t('supportDialog.errorDesc', 'Failed to send support request. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('supportDialog.title', 'Contact Support')}</DialogTitle>
          <DialogDescription>
            {t('supportDialog.description', "Send us a message and we'll get back to you as soon as possible.")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">{t('supportDialog.message', 'Message')} *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
              placeholder={t('supportDialog.messagePlaceholder', 'Describe your issue or question...')}
              maxLength={2000}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('supportDialog.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {t('supportDialog.sending', 'Sending...')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('supportDialog.submit', 'Send Message')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};