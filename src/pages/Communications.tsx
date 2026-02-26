import { useTranslation } from 'react-i18next';
import { MessageSquare, Mail, MessageCircle } from 'lucide-react';

export default function Communications() {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-6">
      <div className="text-center max-w-md">
        <MessageSquare className="h-24 w-24 mx-auto mb-6 text-muted-foreground/20" />
        <h1 className="text-3xl font-bold mb-3">{t('communications')}</h1>
        <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          {t('coming-soon')}
        </div>
        <p className="text-muted-foreground mb-6">
          {t('communications-coming-soon-description')}
        </p>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 justify-center">
            <Mail className="h-4 w-4" />
            <span>{t('email-conversations')}</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <MessageCircle className="h-4 w-4" />
            <span>{t('whatsapp-messages')}</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <MessageSquare className="h-4 w-4" />
            <span>{t('sms-threads')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
