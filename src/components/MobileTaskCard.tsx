import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Trash2, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
import type { TaskWithRelations } from "@/hooks/useTasks";

interface MobileTaskCardProps {
  task: TaskWithRelations;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export function MobileTaskCard({ 
  task, 
  onComplete, 
  onDelete, 
  getStatusColor, 
  getPriorityColor 
}: MobileTaskCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm flex-1">{task.title}</h3>
          <div className="flex gap-2 flex-shrink-0">
            <Badge className={`text-white text-xs ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge className={`text-white text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
          </div>
        </div>
        
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
            </div>
          )}
          {task.assignee_id && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="text-xs">{task.assignee_id}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          {task.status !== 'COMPLETED' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onComplete(task.id)}
              className="flex-1 h-9"
            >
              <Check className="w-4 h-4 mr-1" />
              {t('mark-complete')}
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-700 h-9"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}