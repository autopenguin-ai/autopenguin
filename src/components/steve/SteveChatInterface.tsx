import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Paperclip, X, ThumbsUp, ThumbsDown, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import type { Message } from '@/hooks/useSteve';
import { ActionResultBox } from './ActionResultBox';
import { ActionButtons, type ActionButton } from './ActionButtons';
import { format, isToday, isYesterday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import stevePenguinIcon from '@/assets/steve-penguin-icon.png';

interface SteveChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, files?: File[]) => void;
  isStreaming: boolean;
  isExecuting: boolean;
  conversationId: string | null;
  thinkingData?: Map<string, { duration: number; steps: string[] }>;
}

export function SteveChatInterface({ messages, onSendMessage, isStreaming, isExecuting, conversationId, thinkingData }: SteveChatInterfaceProps) {
  const { t, i18n } = useTranslation();
  const { user, userProfile } = useAuth();
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userName = userProfile?.first_name || user?.email?.split('@')[0] || 'there';
  const isEnglish = i18n.language === 'en';

  // Get user initials from first and last name
  const getUserInitials = () => {
    const first = userProfile?.first_name?.[0]?.toUpperCase() || '';
    const last = userProfile?.last_name?.[0]?.toUpperCase() || '';
    if (first && last) return `${first}${last}`;
    if (first) return first;
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return isEnglish ? `Yesterday ${format(date, 'HH:mm')}` : `昨天 ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  // Handle feedback submission
  const handleFeedback = async (messageId: string, rating: 'up' | 'down') => {
    if (feedbackGiven.has(messageId) || !conversationId) return;

    try {
      const { error } = await supabase
        .from('steve_message_feedback')
        .insert({
          message_id: messageId,
          conversation_id: conversationId,
          user_id: user?.id || '',
          rating
        });

      if (error) throw error;

      setFeedbackGiven(prev => new Set(prev).add(messageId));
      toast.success(
        isEnglish 
          ? 'Thanks for your feedback!' 
          : '感謝你的回饋！',
        { duration: 2000 }
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error(
        isEnglish 
          ? 'Failed to submit feedback' 
          : '提交回饋失敗'
      );
    }
  };

  // Parse message content for action results
  const parseMessageContent = (content: string) => {
    // Only detect ACTUAL action results - lines starting with ✓ or ✅
    const successLinePattern = /^[✓✅]\s*(.+?)$/m;
    const successMatch = content.match(successLinePattern);
    
    if (successMatch) {
      return {
        hasAction: true,
        action: successMatch[1].trim(),
        remainingContent: content.replace(successMatch[0], '').trim()
      };
    }
    
    return { hasAction: false, content };
  };

  // Parse action buttons from message content
  const parseActionButtons = (content: string): { buttons: ActionButton[]; cleanContent: string } => {
    const buttons: ActionButton[] = [];
    let cleanContent = content;

    // Match pattern: [ACTION_BUTTON:label:message:variant?]
    const buttonPattern = /\[ACTION_BUTTON:([^:]+):([^:\]]+)(?::([^\]]+))?\]/g;
    let match;

    while ((match = buttonPattern.exec(content)) !== null) {
      buttons.push({
        label: match[1].trim(),
        message: match[2].trim(),
        variant: (match[3]?.trim() as ActionButton['variant']) || 'outline'
      });
    }

    // Remove button markers from content
    cleanContent = content.replace(buttonPattern, '').trim();

    return { buttons, cleanContent };
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    onSendMessage(input, files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-6 py-4">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <p className="text-base mb-2">
                {isEnglish 
                  ? `Hi ${userName}, I'm Steve!` 
                  : `你好 ${userName}，我是 Steve！`}
              </p>
              <p className="text-sm opacity-70">
                {isEnglish
                  ? 'How can I help?'
                  : '我能幫你什麼？'}
              </p>
            </div>
          ) : (
            messages
              .filter(m => m.content.trim() && m.content.trim() !== '.')
              .map((message, messageIndex) => {
              const parsedContent = message.role === 'assistant' 
                ? parseMessageContent(message.content) 
                : { hasAction: false, content: message.content };

              return (
                <div
                  key={message.id}
                  className="flex w-full"
                >
                  {message.role === 'user' ? (
                    <div className="flex gap-3 justify-end items-start w-full">
                      <div className="flex flex-col items-end gap-1">
                        <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[85%] shadow-sm">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground px-2">
                          {formatTimestamp(message.created_at)}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground font-semibold text-sm">
                        {getUserInitials()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 items-start w-full">
                      <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden p-1">
                        <img src={stevePenguinIcon} alt="Assistant" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 space-y-2 overflow-hidden">
                        {thinkingData?.get(message.id) && (
                          <Collapsible className="mb-2">
                            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                              <Clock className="h-3 w-3" />
                              <span>Thought for {thinkingData.get(message.id)!.duration}s</span>
                              <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 pl-4 space-y-1 text-xs text-muted-foreground border-l-2 border-muted">
                              {thinkingData.get(message.id)!.steps.map((step, idx) => (
                                <p key={idx} className="leading-relaxed">{step}</p>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                        {(() => {
                          const { buttons, cleanContent } = parseActionButtons(
                            parsedContent.hasAction ? parsedContent.remainingContent || '' : parsedContent.content
                          );
                          
                          // Check if conversation continued after this message (any subsequent message exists)
                          const hasFollowUpMessage = messageIndex < messages.filter(m => m.content.trim() && m.content.trim() !== '.').length - 1;
                          
                          return (
                            <>
                              {/* Text content - NO bubble */}
                              {cleanContent && (
                                <div className="space-y-1">
                                  {cleanContent.split('\n').map((part, idx) => {
                                    const isStatusMessage = /^[🔍📖✏️✅⚠️💭🔧📋👥➕📝🗑️🎯🏢🔄]\s/.test(part);
                                    if (isStatusMessage) {
                                      return (
                                        <p key={idx} className="text-xs text-muted-foreground italic py-1 leading-relaxed">
                                          {part}
                                        </p>
                                      );
                                    }
                                    return part ? (
                                      <p key={idx} className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                        {part}
                                      </p>
                                    ) : null;
                                  })}
                                </div>
                              )}
                              
                              {/* Action result - IN bubble */}
                              {parsedContent.hasAction && (
                                <ActionResultBox action={parsedContent.action} success={true} />
                              )}
                              
                              {/* Buttons - NO bubble, floating - only show if no follow-up message exists */}
                              {buttons.length > 0 && !hasFollowUpMessage && (
                                <ActionButtons 
                                  buttons={buttons} 
                                  onButtonClick={(msg) => onSendMessage(msg)}
                                />
                              )}
                            </>
                          );
                        })()}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatTimestamp(message.created_at)}</span>
                          {!feedbackGiven.has(message.id) && (
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:text-primary"
                                onClick={() => handleFeedback(message.id, 'up')}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:text-destructive"
                                onClick={() => handleFeedback(message.id, 'down')}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {isExecuting
                    ? t('steve.working', 'Steve is working...')
                    : t('steve.typing', 'Steve is typing...')}
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)] max-w-3xl mx-auto">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
                >
                  <Paperclip className="h-3 w-3" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={isEnglish ? 'Type your message...' : '輸入訊息...'}
                className="min-h-[44px] max-h-[200px] resize-none pr-16"
                disabled={isStreaming}
                rows={1}
                maxLength={500}
              />
              <div
                className={cn(
                  "absolute bottom-2 right-2 text-xs tabular-nums pointer-events-none",
                  input.length > 480
                    ? "text-destructive font-medium"
                    : input.length > 400
                    ? "text-warning"
                    : "text-muted-foreground"
                )}
              >
                {input.length}/500
              </div>
            </div>
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isStreaming}
              className="shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
