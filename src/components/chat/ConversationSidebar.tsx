import { useState } from 'react';
import { Plus, MessageSquare, PanelLeftClose, PanelLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import type { ConversationSummary } from '@/hooks/useSteve';

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  assistantName?: string;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapse,
  assistantName,
}: ConversationSidebarProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  // Group conversations by date
  const grouped = conversations.reduce<Record<string, ConversationSummary[]>>((acc, conv) => {
    const key = formatDate(conv.updated_at || conv.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(conv);
    return acc;
  }, {});

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteConversation(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-border bg-muted/30 flex flex-col items-center py-3 gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleCollapse}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onNewConversation}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Conversations
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onNewConversation}
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleCollapse}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {Object.entries(grouped).map(([dateLabel, convos]) => (
            <div key={dateLabel}>
              <p className="text-xs font-medium text-muted-foreground px-2 mb-1">
                {dateLabel}
              </p>
              <div className="space-y-0.5">
                {convos.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'grid grid-cols-[16px_1fr_24px] items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors',
                      activeConversationId === conv.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50 text-foreground'
                    )}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{conv.title || 'New Chat'}</span>
                    <button
                      type="button"
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(conv.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No conversations yet
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? It will be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
