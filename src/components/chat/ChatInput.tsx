import { useState, useRef } from 'react';
import { Send, Loader2, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SlashCommandBar, SLASH_COMMANDS, type SlashCommand } from './SlashCommandBar';

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  onSlashCommand: (command: SlashCommand) => void;
  isStreaming: boolean;
  assistantName?: string;
}

export function ChatInput({ onSendMessage, onSlashCommand, isStreaming, assistantName = 'Penguin' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    // Intercept typed slash commands (e.g. user types "/dashboard" and hits enter)
    const trimmed = input.trim().toLowerCase();
    const matchedCommand = SLASH_COMMANDS.find((cmd) => cmd.command === trimmed);
    if (matchedCommand) {
      handleSlashSelect(matchedCommand);
      return;
    }

    setShowSlashMenu(false);
    onSendMessage(input, files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSlashSelect = (command: SlashCommand) => {
    setShowSlashMenu(false);
    setInput('');
    onSlashCommand(command);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Show slash command menu when typing / at the start
    if (value.startsWith('/')) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape' && showSlashMenu) {
      setShowSlashMenu(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)] max-w-4xl mx-auto">
        {/* File attachments */}
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

        <form onSubmit={handleSubmit} className="relative flex gap-2">
          {/* Slash command menu */}
          {showSlashMenu && (
            <SlashCommandBar filter={input} onSelect={handleSlashSelect} />
          )}

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
              placeholder={`Message ${assistantName}... (type / for commands)`}
              className="min-h-[44px] max-h-[200px] resize-none pr-16"
              disabled={isStreaming}
              rows={1}
              maxLength={500}
            />
            <div
              className={cn(
                'absolute bottom-2 right-2 text-xs tabular-nums pointer-events-none',
                input.length > 480
                  ? 'text-destructive font-medium'
                  : input.length > 400
                  ? 'text-warning'
                  : 'text-muted-foreground'
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

        <p className="text-xs text-muted-foreground text-center mt-2">
          Type / to see available commands
        </p>
      </div>
    </div>
  );
}
