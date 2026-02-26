import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserCompany } from './useCompany';
import { useIndustry } from '@/contexts/IndustryContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { showNotification, hasNotificationPermission } from '@/lib/browserNotifications';
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useSteve = () => {
  const { user } = useAuth();
  const { data: company } = useUserCompany();
  const { i18n } = useTranslation();
  const { industry } = useIndustry();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [thinkingData, setThinkingData] = useState<Map<string, { duration: number; steps: string[] }>>(new Map());
  const thinkingStepsRef = useRef<string[]>([]);
  const thinkingStartRef = useRef<number | null>(null);

  // Keep a ref to conversationId so sendMessage always uses the current value
  const conversationIdRef = useRef<string | null>(conversationId);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Load all conversations for the user
  const loadConversations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('steve_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations((data as ConversationSummary[]) || []);
  }, [user]);

  // Initialize or load single conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      if (!user || !company) return;

      setIsLoading(true);

      // Load conversation list
      await loadConversations();

      // Try to find existing conversation for this user (most recent non-deleted)
      const { data: existing } = await supabase
        .from('steve_conversations')
        .select('id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        setConversationId(existing.id);
        await loadMessages(existing.id);
      } else {
        // Create first conversation
        const { data: newConv, error } = await supabase
          .from('steve_conversations')
          .insert({
            user_id: user.id,
            company_id: company.id,
            title: 'New Chat',
          })
          .select()
          .single();

        if (!error && newConv) {
          setConversationId(newConv.id);
          await loadConversations();
        }
      }

      setIsLoading(false);
    };

    initConversation();
  }, [user, company]);

  // Load all messages for the conversation
  const loadMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('steve_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages((data as Message[]) || []);
  }, []);

  // Switch to a different conversation
  const switchConversation = useCallback(async (convId: string) => {
    if (convId === conversationId) return;

    setIsLoading(true);
    setMessages([]);
    setThinkingData(new Map());
    setConversationId(convId);
    await loadMessages(convId);
    setIsLoading(false);
  }, [conversationId, loadMessages]);

  // Create a new conversation (and trigger learning extraction on the previous one)
  const createConversation = useCallback(async () => {
    if (!user || !company) return;

    // Capture previous conversation ID for learning extraction
    const previousConversationId = conversationIdRef.current;

    const { data: newConv, error } = await supabase
      .from('steve_conversations')
      .insert({
        user_id: user.id,
        company_id: company.id,
        title: 'New Chat',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create conversation');
      return;
    }

    if (newConv) {
      setConversationId(newConv.id);
      setMessages([]);
      setThinkingData(new Map());
      await loadConversations();
    }

    // Fire-and-forget: extract learnings from previous conversation
    if (previousConversationId) {
      supabase.functions.invoke('extract-learnings', {
        body: {
          conversationId: previousConversationId,
          userId: user.id,
          companyId: company.id,
        },
      }).catch((err) => console.error('Learning extraction failed:', err));
    }
  }, [user, company, loadConversations]);

  // Soft-delete a conversation (retained in DB for 7 days then purged)
  const deleteConversation = useCallback(async (convId: string) => {
    if (!user) return;
    const { error } = await (supabase
      .from('steve_conversations') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', convId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to delete conversation');
      return;
    }

    // If we deleted the active conversation, switch to another or create new
    if (convId === conversationId) {
      const remaining = conversations.filter((c) => c.id !== convId);
      if (remaining.length > 0) {
        await switchConversation(remaining[0].id);
      } else {
        await createConversation();
      }
    }

    await loadConversations();
  }, [conversationId, conversations, switchConversation, createConversation, loadConversations]);

  // Add a local assistant message (e.g. for /help) - not persisted to DB
  const addLocalAssistantMessage = useCallback((content: string) => {
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  }, []);

  // Add a local user message (e.g. for slash commands) - not persisted to DB
  const addLocalUserMessage = useCallback((content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
  }, []);

  // Send message with streaming
  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!user || !company || !conversationId) {
      toast.error('Please wait for chat to initialize');
      return;
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    // Auto-update conversation title from first user message
    const isFirstMessage = messages.filter(m => m.role === 'user').length === 0;
    if (isFirstMessage && conversationId) {
      const title = content.length > 50 ? content.slice(0, 50) + '...' : content;
      supabase
        .from('steve_conversations')
        .update({ title })
        .eq('id', conversationId)
        .then(() => loadConversations());
    }

    // Initialize thinking tracking
    thinkingStartRef.current = Date.now();
    thinkingStepsRef.current = [];

    try {
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Normalize language to either 'zh' or 'en'
      const normalizedLang = i18n.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';

      // Get timezone and currency from localStorage
      const savedSettings = localStorage.getItem('user-display-settings');
      const userSettings = savedSettings ? JSON.parse(savedSettings) : { timezone: 'Asia/Hong_Kong', currency: 'HKD' };
      const userTimezone = userSettings.timezone;
      const userCurrency = userSettings.currency;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/steve-chat`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            conversationId: conversationId,
            message: content,
            userId: user.id,
            companyId: company.id,
            userLanguage: normalizedLang,
            userTimezone: userTimezone,
            userCurrency: userCurrency,
            userIndustry: industry,
            files: files ? await Promise.all(files.map(f => fileToBase64(f))) : undefined,
          }),
        }
      );

      if (!response.ok || !response.body) {
        if (response.status === 401) {
          try {
            const errorData = await response.json();
            toast.error(errorData.error || 'API key invalid or expired. Please reconnect in Settings → AI Connection.', { duration: 8000 });
          } catch {
            toast.error('API key invalid or expired. Please reconnect in Settings → AI Connection.', { duration: 8000 });
          }
        } else if (response.status === 429) {
          toast.error('Rate limit exceeded, please try again later');
        } else if (response.status === 402) {
          toast.error('Payment required, please add funds to your workspace');
        } else if (response.status === 403) {
          // Handle daily limit reached
          try {
            const errorData = await response.json();
            if (errorData.error === 'daily_limit_reached') {
              const isZh = i18n.language?.toLowerCase().startsWith('zh');
              toast.error(
                isZh ? errorData.message_zh : errorData.message,
                {
                  action: {
                    label: isZh ? '升級' : 'Upgrade',
                    onClick: () => window.location.href = '/settings?tab=plan',
                  },
                  duration: 8000,
                }
              );
            } else {
              toast.error(errorData.error || 'Access denied');
            }
          } catch {
            toast.error('Access denied');
          }
        } else {
          // Try to parse error message from response
          try {
            const errorData = await response.json();
            if (errorData.error === 'no_llm_configured' || errorData.error === 'invalid_api_key') {
              toast.error(errorData.message || 'Please connect an AI provider in Settings → AI Connection.', {
                action: {
                  label: 'Settings',
                  onClick: () => window.location.href = '/settings?tab=ai',
                },
                duration: 8000,
              });
            } else {
              toast.error(errorData.error || 'Failed to send message');
            }
          } catch {
            toast.error('Failed to send message');
          }
        }
        setIsStreaming(false);
        return;
      }

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Stream response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullStreamedContent = ''; // Track all streamed content for auto-refresh detection

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              // Handle streamed errors from edge function
              if (parsed.error) {
                toast.error(parsed.error, { duration: 8000 });
                // Remove the empty assistant message placeholder
                setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
                setIsStreaming(false);
                return;
              }

              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                // Check if this is an execution indicator
                if (content.includes('🔄 Executing')) {
                  setIsExecuting(true);
                }

                // Track thinking steps (lines starting with emojis)
                const isThinkingStep = /^[💭🔧🔍📖✏️📝🏢➕🗑️🎯🔄✅ℹ️⚠️👥]\s/.test(content);
                if (isThinkingStep) {
                  thinkingStepsRef.current.push(content.trim());
                }

                // Strip execution indicators from display
                const cleanedContent = content.replace(/🔄 Executing [^\.]+\.\.\./g, '');

                if (cleanedContent) {
                  fullStreamedContent += cleanedContent; // Track for auto-refresh
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content += cleanedContent;
                    }
                    return newMessages;
                  });
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Save thinking data BEFORE reload - ALWAYS show thinking if there was a duration
      const thinkingDuration = thinkingStartRef.current
        ? Math.round((Date.now() - thinkingStartRef.current) / 1000)
        : 0;

      const tempThinkingInfo = thinkingDuration > 0
        ? {
            duration: thinkingDuration,
            steps: thinkingStepsRef.current.length > 0
              ? [...thinkingStepsRef.current]
              : ['Processing your request...']  // Fallback if no steps captured
          }
        : null;

      // Reload messages to get the stored version (use ref to avoid stale closure)
      const currentConvId = conversationIdRef.current;
      if (currentConvId) {
        await loadMessages(currentConvId);
      }

      // After reload, find the latest assistant message and attach thinking data
      if (tempThinkingInfo) {
        setMessages(prevMsgs => {
          const latestAssistant = [...prevMsgs].filter(m => m.role === 'assistant').pop();
          if (latestAssistant) {
            setThinkingData(prev => new Map(prev).set(latestAssistant.id, tempThinkingInfo));
          }
          return prevMsgs;
        });
      }

      // Refresh conversation list (title may have updated)
      await loadConversations();

      // Check the ACTUAL streamed content for auto-refresh triggers
      const streamedContent = fullStreamedContent.toLowerCase();

      // Contacts auto-refresh
      if (
        streamedContent.includes('contact') && (
          streamedContent.includes('updated') ||
          streamedContent.includes('created') ||
          streamedContent.includes('deleted') ||
          streamedContent.includes('cleaned')
        ) ||
        streamedContent.includes('已清理重複')
      ) {
        window.dispatchEvent(new CustomEvent('steve:refetch-clients'));
      }

      // Projects/Properties auto-refresh
      if (
        (streamedContent.includes('property') || streamedContent.includes('project') || streamedContent.includes('項目')) && (
          streamedContent.includes('updated') ||
          streamedContent.includes('created') ||
          streamedContent.includes('deleted')
        )
      ) {
        window.dispatchEvent(new CustomEvent('steve:refetch-projects'));
      }

      // Leads auto-refresh
      if (
        streamedContent.includes('lead') && (
          streamedContent.includes('updated') ||
          streamedContent.includes('created') ||
          streamedContent.includes('deleted')
        )
      ) {
        window.dispatchEvent(new CustomEvent('steve:refetch-leads'));
      }

      // Tasks auto-refresh
      if (
        streamedContent.includes('task') && (
          streamedContent.includes('updated') ||
          streamedContent.includes('created') ||
          streamedContent.includes('deleted') ||
          streamedContent.includes('completed')
        )
      ) {
        window.dispatchEvent(new CustomEvent('steve:refetch-tasks'));
      }

      // Show browser notification if user is on a different tab
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant' && document.hidden && hasNotificationPermission()) {
        const firstName = user?.user_metadata?.first_name || 'there';

        showNotification('AutoPenguin', {
          body: `${firstName}, your request is complete`,
          tag: 'steve-reply',
        });
      }

      // Check for 80% limit warning
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, email')
        .eq('user_id', user.id)
        .single();

      const isExemptUser = profile?.subscription_plan === 'admin' || profile?.email?.endsWith('@autopenguin.app');

      if (!isExemptUser) {
        const dailyLimit = profile?.subscription_plan === 'supporter' ? 100 : 25;
        const warningThreshold = Math.floor(dailyLimit * 0.8);

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const { count: currentCount } = await supabase
          .from('steve_usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        if (currentCount === warningThreshold) {
          const remaining = dailyLimit - currentCount;
          const isZh = i18n.language?.toLowerCase().startsWith('zh');
          toast.warning(
            isZh
              ? `你今天還有 ${remaining} 次對話可用`
              : `You have ${remaining} conversations remaining today`,
            {
              action: profile?.subscription_plan !== 'supporter' ? {
                label: isZh ? '升級' : 'Upgrade',
                onClick: () => window.location.href = '/settings?tab=plan',
              } : undefined,
              duration: 6000,
            }
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsStreaming(false);
      setIsExecuting(false);
    }
  }, [user, company, conversationId, loadMessages, loadConversations, i18n.language]);

  return {
    conversationId,
    messages,
    conversations,
    isLoading,
    isStreaming,
    isExecuting,
    sendMessage,
    thinkingData,
    switchConversation,
    createConversation,
    deleteConversation,
    addLocalAssistantMessage,
    addLocalUserMessage,
  };
};

// Helper to convert file to base64
async function fileToBase64(file: File): Promise<{ name: string; type: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ name: file.name, type: file.type, data: base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
