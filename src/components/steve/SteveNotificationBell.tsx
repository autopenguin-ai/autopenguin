import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SteveNotificationPanel } from './SteveNotificationPanel';
import { useSteveNotifications } from '@/hooks/useSteveNotifications';

export function SteveNotificationBell() {
  const { pendingCount, refetchNotifications } = useSteveNotifications();

  return (
    <Popover onOpenChange={(open) => { if (open) refetchNotifications?.(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <SteveNotificationPanel />
      </PopoverContent>
    </Popover>
  );
}
