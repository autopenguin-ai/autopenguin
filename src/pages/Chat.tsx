import { useSteve } from '@/hooks/useSteve';
import { ChatLayout } from '@/components/chat/ChatLayout';
import type { ChatMessageData } from '@/components/chat/ChatMessage';
import type { SlashCommand } from '@/components/chat/SlashCommandBar';

const HELP_MESSAGE = `Here's what I can do:

**Quick Commands**
- \`/dashboard\` - View your dashboard overview
- \`/contacts\` - View and manage contacts
- \`/tasks\` - View and manage tasks
- \`/projects\` - View projects
- \`/talent\` - View talent roster
- \`/finance\` - View invoices and expenses
- \`/bookings\` - View bookings
- \`/help\` - Show this help message

**Just Ask Me**
- Create, update, or search contacts, tasks, and projects
- Manage talent profiles and bookings
- Create invoices and log expenses
- Get dashboard summaries and insights

Just type naturally - I understand what you need!`;

export default function Chat() {
  const {
    conversationId,
    messages,
    conversations,
    isLoading,
    isStreaming,
    isExecuting,
    thinkingData,
    sendMessage,
    switchConversation,
    createConversation,
    deleteConversation,
    addLocalAssistantMessage,
    addLocalUserMessage,
  } = useSteve();

  const chatMessages: ChatMessageData[] = messages;

  const handleSlashCommand = (command: SlashCommand) => {
    // Show the command as a user message in the chat
    addLocalUserMessage(command.command);

    if (command.command === '/help') {
      addLocalAssistantMessage(HELP_MESSAGE);
    }
  };

  return (
    <ChatLayout
      messages={chatMessages}
      conversations={conversations}
      activeConversationId={conversationId}
      isLoading={isLoading}
      isStreaming={isStreaming}
      isExecuting={isExecuting}
      thinkingData={thinkingData}
      onSendMessage={sendMessage}
      onSlashCommand={handleSlashCommand}
      onSelectConversation={switchConversation}
      onNewConversation={createConversation}
      onDeleteConversation={deleteConversation}
    />
  );
}
