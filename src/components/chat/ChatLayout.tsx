import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConversationSidebar } from './ConversationSidebar';
import { PageOverlay } from './PageOverlay';
import type { ConversationSummary } from '@/hooks/useSteve';
import type { SlashCommand } from './SlashCommandBar';
import penguinLogoDark from '@/assets/autopenguin-logo-dark.png';
import penguinLogoLight from '@/assets/autopenguin-logo-light.png';
import stevePenguinIcon from '@/assets/steve-penguin-icon.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatLayoutProps {
  messages: ChatMessageData[];
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  isExecuting: boolean;
  thinkingData: Map<string, { duration: number; steps: string[] }>;
  onSendMessage: (message: string, files?: File[]) => void;
  onSlashCommand: (command: SlashCommand) => void;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatLayout({
  messages,
  conversations,
  activeConversationId,
  isLoading,
  isStreaming,
  isExecuting,
  thinkingData,
  onSendMessage,
  onSlashCommand,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ChatLayoutProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user, userRole, userProfile, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const userName = userProfile?.first_name || user?.email?.split('@')[0] || 'there';
  const assistantName = userProfile?.assistant_name || 'Penguin';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isStreaming]);

  // Filter out empty/dot-only messages
  const visibleMessages = messages.filter(
    (m) => m.content.trim() && m.content.trim() !== '.'
  );

  // Find the last assistant message index for button rendering
  const lastAssistantIdx = visibleMessages.reduce<number>(
    (acc, m, idx) => (m.role === 'assistant' ? idx : acc),
    -1
  );

  const handleSlashCommand = (command: SlashCommand) => {
    if (command.overlayPage) {
      setActiveOverlay(command.overlayPage);
    }
    // Delegate to parent for any message/help handling
    onSlashCommand(command);
  };

  const handleQuickCommand = (page: string, message: string) => {
    setActiveOverlay(page);
    onSlashCommand({
      command: `/${page}`,
      label: page.charAt(0).toUpperCase() + page.slice(1),
      description: '',
      icon: User, // not rendered, just satisfying the type
      overlayPage: page,
      message,
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Conversation sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onDeleteConversation={onDeleteConversation}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        assistantName={assistantName}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <img
                src={theme === 'dark' ? penguinLogoLight : penguinLogoDark}
                alt="AutoPenguin"
                className="h-7 w-7 cursor-pointer"
                onClick={() => navigate('/chat')}
              />
              <span className="text-sm font-semibold hidden sm:block">AutoPenguin</span>
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <LanguageToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 px-0">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userProfile?.first_name || user?.email}</p>
                    <p className="text-xs text-muted-foreground">{userRole}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    {t('profile', 'Profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Classic View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings', 'Settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('sign-out', 'Sign out')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
          <div className="px-4 sm:px-6 py-4 space-y-6 max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="text-center py-20">
                <img
                  src={stevePenguinIcon}
                  alt={assistantName}
                  className="h-16 w-16 mx-auto mb-4 opacity-80"
                />
                <p className="text-lg mb-2">
                  {`Hi ${userName}, I'm ${assistantName}!`}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Your AI assistant. Ask me anything or use / commands.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                  {[
                    { label: '/dashboard', page: 'dashboard', msg: 'Show me the dashboard' },
                    { label: '/contacts', page: 'contacts', msg: 'Show contacts' },
                    { label: '/tasks', page: 'tasks', msg: 'Show tasks' },
                    { label: '/projects', page: 'projects', msg: 'Show projects' },
                  ].map((cmd) => (
                    <Button
                      key={cmd.label}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleQuickCommand(cmd.page, cmd.msg)}
                    >
                      {cmd.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              visibleMessages.map((message, idx) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  conversationId={activeConversationId}
                  thinkingData={thinkingData.get(message.id)}
                  isLastAssistant={idx === lastAssistantIdx}
                  onSendMessage={(msg) => onSendMessage(msg)}
                  assistantName={assistantName}
                />
              ))
            )}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {isExecuting ? `${assistantName} is working...` : `${assistantName} is typing...`}
                  </span>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <ChatInput
          onSendMessage={onSendMessage}
          onSlashCommand={handleSlashCommand}
          isStreaming={isStreaming}
          assistantName={assistantName}
        />

        {/* Full-size page overlay */}
        {activeOverlay && (
          <PageOverlay
            page={activeOverlay}
            onClose={() => setActiveOverlay(null)}
          />
        )}
      </div>
    </div>
  );
}
