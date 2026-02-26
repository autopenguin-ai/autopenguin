import { ThumbsUp, ThumbsDown, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { ActionResultBox } from '@/components/steve/ActionResultBox';
import { ActionButtons, type ActionButton } from '@/components/steve/ActionButtons';
import { format, isToday, isYesterday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import stevePenguinIcon from '@/assets/steve-penguin-icon.png';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
  conversationId: string | null;
  thinkingData?: { duration: number; steps: string[] };
  isLastAssistant?: boolean;
  onSendMessage?: (message: string) => void;
  assistantName?: string;
}

export function ChatMessage({ message, conversationId, thinkingData, isLastAssistant, onSendMessage, assistantName }: ChatMessageProps) {
  const { user, userProfile } = useAuth();
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const getUserInitials = () => {
    const first = userProfile?.first_name?.[0]?.toUpperCase() || '';
    const last = userProfile?.last_name?.[0]?.toUpperCase() || '';
    if (first && last) return `${first}${last}`;
    if (first) return first;
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM d, HH:mm');
  };

  const handleFeedback = async (rating: 'up' | 'down') => {
    if (feedbackGiven || !conversationId) return;

    try {
      const { error } = await supabase
        .from('steve_message_feedback')
        .insert({
          message_id: message.id,
          conversation_id: conversationId,
          user_id: user?.id || '',
          rating,
        });

      if (error) throw error;

      setFeedbackGiven(true);
      toast.success('Thanks for your feedback!', { duration: 2000 });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast.error('Failed to submit feedback');
    }
  };

  // Parse action results from message content
  const parseMessageContent = (content: string) => {
    const successLinePattern = /^[✓✅]\s*(.+?)$/m;
    const successMatch = content.match(successLinePattern);

    if (successMatch) {
      return {
        hasAction: true,
        action: successMatch[1].trim(),
        remainingContent: content.replace(successMatch[0], '').trim(),
      };
    }

    return { hasAction: false, content };
  };

  // Parse action buttons from message content
  const parseActionButtons = (content: string): { buttons: ActionButton[]; cleanContent: string } => {
    const buttons: ActionButton[] = [];
    let cleanContent = content;

    const buttonPattern = /\[ACTION_BUTTON:([^:]+):([^:\]]+)(?::([^\]]+))?\]/g;
    let match;

    while ((match = buttonPattern.exec(content)) !== null) {
      buttons.push({
        label: match[1].trim(),
        message: match[2].trim(),
        variant: (match[3]?.trim() as ActionButton['variant']) || 'outline',
      });
    }

    cleanContent = content.replace(buttonPattern, '').trim();
    return { buttons, cleanContent };
  };

  // Simple inline markdown: **bold** and `code`
  const renderInlineMarkdown = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    // Match **bold** or `code` segments
    const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2]) {
        // **bold**
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3]) {
        // `code`
        parts.push(
          <code key={match.index} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
            {match[3]}
          </code>
        );
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  if (message.role === 'user') {
    return (
      <div className="flex w-full">
        <div className="flex gap-3 justify-end items-start w-full">
          <div className="flex flex-col items-end gap-1">
            <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[75%] shadow-sm">
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
      </div>
    );
  }

  // Assistant message
  const parsedContent = parseMessageContent(message.content);
  const { buttons, cleanContent } = parseActionButtons(
    parsedContent.hasAction ? parsedContent.remainingContent || '' : parsedContent.content
  );

  return (
    <div className="flex w-full">
      <div className="flex gap-3 items-start w-full">
        <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden p-1">
          <img src={stevePenguinIcon} alt={assistantName || 'Penguin'} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          {/* Thinking data */}
          {thinkingData && (
            <Collapsible className="mb-2">
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                <Clock className="h-3 w-3" />
                <span>Thought for {thinkingData.duration}s</span>
                <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 pl-4 space-y-1 text-xs text-muted-foreground border-l-2 border-muted">
                {thinkingData.steps.map((step, idx) => (
                  <p key={idx} className="leading-relaxed">{step}</p>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Text content */}
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
                    {renderInlineMarkdown(part)}
                  </p>
                ) : null;
              })}
            </div>
          )}

          {/* Action result */}
          {parsedContent.hasAction && (
            <ActionResultBox action={parsedContent.action} success={true} />
          )}

          {/* Action buttons - only show on last assistant message */}
          {buttons.length > 0 && isLastAssistant && onSendMessage && (
            <ActionButtons
              buttons={buttons}
              onButtonClick={(msg) => onSendMessage(msg)}
            />
          )}

          {/* Timestamp and feedback */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatTimestamp(message.created_at)}</span>
            {!feedbackGiven && (
              <div className="flex gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:text-primary"
                  onClick={() => handleFeedback('up')}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:text-destructive"
                  onClick={() => handleFeedback('down')}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
