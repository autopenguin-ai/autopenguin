import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateTask, type TaskWithRelations } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface EditTaskDialogProps {
  task: TaskWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const updateTask = useUpdateTask();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'TASK',
    status: 'OPEN',
    priority: 'MEDIUM',
    due_date: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        type: task.type || 'TASK',
        status: task.status || 'OPEN',
        priority: task.priority || 'MEDIUM',
        due_date: task.due_date || '',
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          ...formData,
          due_date: formData.due_date || null,
        }
      });
      
      toast({
        title: t('task-updated'),
        description: t('task-updated-description'),
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed-to-update-task'),
        variant: 'destructive',
      });
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('edit-task')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('title')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('type')}</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TASK">{t('task')}</SelectItem>
                  <SelectItem value="TICKET">{t('ticket')}</SelectItem>
                  <SelectItem value="MAINTENANCE">{t('maintenance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('status')}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">{t('open')}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{t('in-progress')}</SelectItem>
                  <SelectItem value="SCHEDULED">{t('scheduled')}</SelectItem>
                  <SelectItem value="COMPLETED">{t('completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">{t('priority')}</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">{t('low')}</SelectItem>
                  <SelectItem value="MEDIUM">{t('medium')}</SelectItem>
                  <SelectItem value="HIGH">{t('high')}</SelectItem>
                  <SelectItem value="URGENT">{t('urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">{t('due-date')}</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={updateTask.isPending}>
              {updateTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
