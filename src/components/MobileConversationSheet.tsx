import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Menu, Search } from 'lucide-react';
import { type ConversationData } from '@/hooks/useN8nData';
import { useTranslation } from 'react-i18next';

interface MobileConversationSheetProps {
  conversations: ConversationData[];
  selectedConversation: ConversationData | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (conversation: ConversationData) => void;
}

export function MobileConversationSheet({
  conversations,
  selectedConversation,
  searchTerm,
  onSearchChange,
  onSelectConversation
}: MobileConversationSheetProps) {
  const { t } = useTranslation();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{t('conversations')}</SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search-conversations')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`w-full p-4 border-b text-left hover:bg-accent transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {conversation.contactName}
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {conversation.lastMessage}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {conversation.unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] text-xs px-1.5">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
