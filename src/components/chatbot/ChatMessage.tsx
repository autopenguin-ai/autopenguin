import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { Link } from "react-router-dom";
import assistantIcon from "@/assets/assistant-penguin-icon.png";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const parseMarkdownLinks = (text: string) => {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: Array<string | { type: 'link'; text: string; url: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the link
    parts.push({
      type: 'link',
      text: match[1],
      url: match[2]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts;
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {isUser ? (
          <>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src={assistantIcon} alt="AutoPenguin" />
            <AvatarFallback className="bg-accent">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`inline-block px-4 py-2.5 rounded-2xl max-w-[85%] ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {parseMarkdownLinks(message.content).map((part, idx) => {
              if (typeof part === 'string') {
                return <span key={idx}>{part}</span>;
              }
              return (
                <Link
                  key={idx}
                  to={part.url}
                  className="text-primary underline hover:text-primary/80 font-medium"
                >
                  {part.text}
                </Link>
              );
            })}
          </p>
        </div>
        <p className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};
