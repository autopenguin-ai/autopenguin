import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = input.length;
  const maxChars = 500;
  const isNearLimit = charCount > 400;
  const isAtLimit = charCount > 480;

  return (
    <div className="space-y-1">
      <div className="flex gap-2 items-end">
        <div className="relative flex-1">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about AutoPenguin..."
            disabled={disabled}
            className="min-h-[44px] max-h-32 resize-none pr-16"
            rows={1}
            maxLength={500}
          />
          <div
            className={cn(
              "absolute bottom-2 right-2 text-xs tabular-nums pointer-events-none",
              isAtLimit
                ? "text-destructive font-medium"
                : isNearLimit
                ? "text-warning"
                : "text-muted-foreground"
            )}
          >
            {charCount}/{maxChars}
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          size="icon"
          className="h-[44px] w-[44px] flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
