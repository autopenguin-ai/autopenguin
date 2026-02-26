import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, CheckSquare, Wrench, Clock } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useCreateTask, type CreateTaskData } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface WorkItemFormData {
  title: string;
  description: string;
  category: 'TASK' | 'TICKET';
  subtype: string;
  priority: string;
  due_date: Date | null;
  due_time: string;
  assignee_id: string;
  property_id?: string;
  client_id?: string;
  lead_id?: string;
  deal_id?: string;
}

const TASK_SUBTYPES = [
  "subtype-client-followups",
  "subtype-property-viewings", 
  "subtype-document-prep",
  "subtype-contract-reviews",
  "subtype-marketing",
  "subtype-lead-qualification"
];

const TICKET_SUBTYPES = [
  "subtype-maintenance-requests",
  "subtype-repair-issues",
  "subtype-property-inspections",
  "subtype-facility-problems",
  "subtype-emergency-maintenance",
  "subtype-service-coordination"
];

interface CreateWorkItemDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CreateWorkItemDialog = ({ open: controlledOpen, onOpenChange }: CreateWorkItemDialogProps = {}) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;
  const [dueDate, setDueDate] = React.useState<Date | null>(null);
  const [dueTime, setDueTime] = React.useState<string>("09:00");
  const { user } = useAuth();
  const createTask = useCreateTask();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<WorkItemFormData>();
  const selectedCategory = watch("category");

  // Reset subtype when category changes
  useEffect(() => {
    if (selectedCategory) {
      setValue("subtype", "");
    }
  }, [selectedCategory, setValue]);

  const onSubmit = (data: WorkItemFormData) => {
    // Combine date and time into single timestamp
    let finalDueDate = null;
    if (dueDate) {
      const [hours, minutes] = dueTime.split(':').map(Number);
      const combined = new Date(dueDate);
      combined.setHours(hours, minutes, 0, 0);
      finalDueDate = combined.toISOString();
    }
    
    const taskData: CreateTaskData = {
      title: data.title,
      description: data.description || null,
      type: data.category,
      subtype: data.subtype,
      status: 'OPEN',
      priority: data.priority,
      due_date: finalDueDate,
      creator_id: user?.id || null,
      assignee_id: data.assignee_id === 'unassigned' ? null : data.assignee_id,
      property_id: data.property_id || null,
      client_id: data.client_id || null,
      lead_id: data.lead_id || null,
      deal_id: data.deal_id || null,
      created_by_automation: false,
      automation_workflow_id: null,
      resolved_by_automation: false,
      automation_resolution_data: null,
      resolved_at: null,
      resolution_notes: null,
    };
    
    createTask.mutate(taskData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        setDueDate(null);
        setDueTime("09:00");
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    return category === 'TASK' ? <CheckSquare className="w-4 h-4" /> : <Wrench className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    return category === 'TASK' ? 'text-blue-600' : 'text-orange-600';
  };

  const getSubtypeOptions = () => {
    if (selectedCategory === 'TASK') return TASK_SUBTYPES;
    if (selectedCategory === 'TICKET') return TICKET_SUBTYPES;
    return [];
  };

  const getCategoryDescription = () => {
    if (selectedCategory === 'TASK') {
      return t('task-description');
    }
    if (selectedCategory === 'TICKET') {
      return t('ticket-description');
    }
    return t('select-category-to-see-types');
  };

  const getPriorityDescriptions = () => {
    if (selectedCategory === 'TASK') {
      return {
        LOW: t('priority-low-task'),
        MEDIUM: t('priority-medium-task'), 
        HIGH: t('priority-high-task'),
        URGENT: t('priority-urgent-task')
      };
    }
    return {
      LOW: t('priority-low-ticket'),
      MEDIUM: t('priority-medium-ticket'),
      HIGH: t('priority-high-ticket'), 
      URGENT: t('priority-urgent-ticket')
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('create-work-item')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t('create-new-work-item')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t('what-type-work-item')}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={cn(
                  "border-2 rounded-lg p-4 cursor-pointer transition-all",
                  selectedCategory === 'TASK' ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setValue("category", "TASK")}
              >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">{t('task')}</span>
              </div>
              </div>
              <div 
                className={cn(
                  "border-2 rounded-lg p-4 cursor-pointer transition-all",
                  selectedCategory === 'TICKET' ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setValue("category", "TICKET")}
              >
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-900">{t('ticket')}</span>
              </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{getCategoryDescription()}</p>
          </div>

          {selectedCategory && (
            <>
              {/* Specific Type Selection */}
              <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {getCategoryIcon(selectedCategory)}
                <span className={getCategoryColor(selectedCategory)}>{t('specific-type')}</span>
              </Label>
              <Select onValueChange={(value) => setValue("subtype", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedCategory === 'TASK' ? t('select-task-type') : t('select-ticket-type')} />
                </SelectTrigger>
                <SelectContent>
                  {getSubtypeOptions().map((subtype) => (
                    <SelectItem key={subtype} value={subtype}>
                      {t(subtype)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

              {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {selectedCategory === 'TASK' ? t('task-title') : t('issue-title')}
              </Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder={selectedCategory === 'TASK' 
                  ? t('task-title-placeholder')
                  : t('issue-title-placeholder')
                }
              />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {selectedCategory === 'TASK' ? t('task-details') : t('issue-description')}
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={selectedCategory === 'TASK' 
                  ? t('task-details-placeholder')
                  : t('issue-description-placeholder')
                }
                rows={3}
              />
              </div>

              {/* Priority */}
            <div className="space-y-2">
              <Label>{t('priority-level')}</Label>
              <Select onValueChange={(value) => setValue("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select-priority')} />
                </SelectTrigger>
                  <SelectContent>
                    {Object.entries(getPriorityDescriptions()).map(([value, description]) => (
                      <SelectItem key={value} value={value}>
                        {description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date & Time */}
            <div className="space-y-2">
              <Label>
                {selectedCategory === 'TASK' ? t('due-date') : t('target-resolution-date')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : t('pick-a-date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate || undefined}
                      onSelect={setDueDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="pl-10"
                    disabled={!dueDate}
                  />
                </div>
              </div>
              </div>

              {/* Assignee */}
            <div className="space-y-2">
              <Label>
                {selectedCategory === 'TASK' ? t('assign-to') : t('assign-to-technician')}
              </Label>
              <Select onValueChange={(value) => setValue("assignee_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedCategory === 'TASK' ? t('select-team-member') : t('select-assignee')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
                  <SelectItem value={user?.id || ""}>{t('myself')}</SelectItem>
                </SelectContent>
              </Select>
              </div>

              {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={createTask.isPending}
                className={cn(
                  selectedCategory === 'TASK' ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"
                )}
              >
                {createTask.isPending ? t('creating') : (selectedCategory === 'TASK' ? t('create-task-button') : t('create-ticket-button'))}
              </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};