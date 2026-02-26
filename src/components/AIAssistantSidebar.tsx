import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import penguinIconDark from '@/assets/penguin-icon-dark.png';
import penguinIconLight from '@/assets/penguin-icon-light.png';
import { useTranslation } from 'react-i18next';
import { useSteve } from '@/hooks/useSteve';
import { useAuth } from '@/hooks/useAuth';
import { SteveChatInterface } from '@/components/steve/SteveChatInterface';
import { supabase } from '@/integrations/supabase/client';

interface AIAssistantToggleProps {
  onClick: () => void;
}

export function AIAssistantToggle({ onClick }: AIAssistantToggleProps) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick}>
      <img 
        src={penguinIconDark} 
        alt="AI Assistant" 
        className="h-5 w-5 dark:hidden" 
      />
      <img 
        src={penguinIconLight} 
        alt="AI Assistant" 
        className="h-5 w-5 hidden dark:block" 
      />
      <span className="sr-only">AI Assistant</span>
    </Button>
  );
}

interface AIAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Rate limit exemptions checked by subscription plan or domain, not hardcoded emails

const DAILY_LIMITS = { free: 25, supporter: 100 };

export function AIAssistantSidebar({ isOpen, onClose }: AIAssistantSidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { conversationId, messages, isStreaming, isExecuting, sendMessage, thinkingData } = useSteve();
  const [usageData, setUsageData] = useState({ dailyCount: 0, limit: 25, isExempt: false });

  // Fetch usage data on mount and subscribe to realtime updates
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user?.id) return;
      
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from('steve_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, email')
        .eq('user_id', user.id)
        .single();
      
      const isExempt = profile?.subscription_plan === 'admin' || profile?.email?.endsWith('@autopenguin.app');
      const limit = profile?.subscription_plan === 'supporter' ? DAILY_LIMITS.supporter : DAILY_LIMITS.free;
      
      setUsageData({ dailyCount: count || 0, limit, isExempt });
    };
    
    fetchUsage();

    // Subscribe to realtime updates for instant badge refresh
    const channel = supabase
      .channel('steve-usage-sidebar')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'steve_usage_logs',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <div className="h-screen w-full bg-background border-l border-border overflow-hidden">
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img 
              src={penguinIconDark} 
              alt="Assistant"
              className="h-8 w-8 dark:hidden object-contain"
            />
            <img
              src={penguinIconLight}
              alt="Assistant"
              className="h-8 w-8 hidden dark:block object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Chat</h2>
                <Badge 
                  variant={usageData.isExempt ? 'secondary' : usageData.dailyCount >= usageData.limit * 0.8 ? 'yellow' : 'outline'} 
                  className="text-xs font-normal"
                >
                  {usageData.isExempt ? '∞' : `${usageData.dailyCount}/${usageData.limit}`}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI assistant
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <SteveChatInterface
            messages={messages}
            onSendMessage={sendMessage}
            isStreaming={isStreaming}
            isExecuting={isExecuting}
            conversationId={conversationId}
            thinkingData={thinkingData}
          />
        </div>
      </div>
    </div>
  );
}
