import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Mail, Phone, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { type Client } from '@/hooks/useClients';
import { useTranslation } from 'react-i18next';

interface MobileClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

export function MobileClientCard({ client, onEdit, onDelete }: MobileClientCardProps) {
  const { t } = useTranslation();
  
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">
            {client.first_name} {client.last_name}
          </h3>
          {client.company && (
            <p className="text-sm text-muted-foreground truncate">{client.company}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {t('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="space-y-2">
        {client.email && (
          <a 
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </a>
        )}
        {client.phone && (
          <a 
            href={`tel:${client.phone}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>{client.phone}</span>
          </a>
        )}
      </div>
    </Card>
  );
}
