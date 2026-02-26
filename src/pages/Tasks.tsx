import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Plus, 
  Wrench, 
  FileText, 
  Zap,
  User,
  Calendar,
  Bot,
  UserCheck,
  Loader2,
  Search,
  Trash2
} from "lucide-react";
import { useTasks, useUpdateTask, useDeleteTask, type TaskWithRelations } from "@/hooks/useTasks";
import { CreateWorkItemDialog } from "@/components/CreateWorkItemDialog";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { format } from "date-fns";
import { InlineInput } from "@/components/inline-edit/InlineInput";
import { InlineSelect } from "@/components/inline-edit/InlineSelect";
import { InlineDatePicker } from "@/components/inline-edit/InlineDatePicker";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTaskCard } from "@/components/MobileTaskCard";
import { useIndustry } from '@/contexts/IndustryContext';

const Tasks = () => {
  const { config: industryConfig } = useIndustry();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [activeTab, setActiveTab] = useState('all');
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: '',
  });
  const { data: tasks = [], isLoading, error } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // Client-side deduplication to prevent duplicate display
  const dedupedTasks = useMemo(() => {
    const normalizeTitle = (t: string) => (t || '').toLowerCase().trim();
    const seen = new Map<string, any>();
    tasks.forEach(task => {
      // For automated tasks, group by title only; for manual tasks, use unique id
      const key = task.created_by_automation
        ? `${task.company_id}|${task.automation_workflow_id || 'none'}|${normalizeTitle(task.title)}`
        : `manual:${task.id}`;
      
      if (!seen.has(key) || new Date(task.created_at) > new Date(seen.get(key)!.created_at)) {
        seen.set(key, task);
      }
    });
    return Array.from(seen.values());
  }, [tasks]);

  // Helper functions
  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'bg-green-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'OPEN': return 'bg-yellow-500';
      case 'SCHEDULED': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toUpperCase()) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      case 'URGENT': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string): JSX.Element => {
    switch (type.toUpperCase()) {
      case 'TICKET': return <Wrench className="w-4 h-4" />;
      case 'MAINTENANCE': return <Zap className="w-4 h-4" />;
      case 'TASK': return <CheckSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (created_by_automation: boolean): JSX.Element => {
    return created_by_automation ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getResolvedByIcon = (resolved_by_automation: boolean, resolved_at: string | null): JSX.Element | null => {
    if (!resolved_at) return null;
    return resolved_by_automation ? <Bot className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />;
  };

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    updateTask.mutate({
      id: taskId,
      updates: {
        status: newStatus,
        resolved_at: newStatus === 'COMPLETED' ? new Date().toISOString() : null,
        resolved_by_automation: false
      }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskId(taskId);
  };

  const confirmDeleteTask = () => {
    if (deleteTaskId) {
      deleteTask.mutate(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  // Inline editing handlers
  const handleFieldUpdate = (taskId: string, field: string, value: any) => {
    return new Promise((resolve, reject) => {
      updateTask.mutate(
        {
          id: taskId,
          updates: { [field]: value }
        },
        {
          onSuccess: () => resolve(value),
          onError: (error) => reject(error)
        }
      );
    });
  };

  // Options for dropdowns
  const statusOptions = [
    { value: 'OPEN', label: 'Open', color: 'bg-yellow-500' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-purple-500' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-green-500' }
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'bg-green-500' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'HIGH', label: 'High', color: 'bg-red-500' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-600' }
  ];

  const typeOptions = [
    { value: 'TASK', label: 'Task' },
    { value: 'TICKET', label: 'Ticket' },
    { value: 'MAINTENANCE', label: 'Maintenance' }
  ];

  // Filter and categorize data using deduped tasks
  const filteredTasks = dedupedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    const matchesType = !filters.type || task.type === filters.type;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const hasActiveFilters = filters.status || filters.priority || filters.type;

  const clearFilters = () => {
    setFilters({ status: '', priority: '', type: '' });
  };
  
  const allItems = filteredTasks;
  const taskItems = filteredTasks.filter(item => item.type === 'TASK');
  const ticketItems = filteredTasks.filter(item => item.type === 'TICKET' || item.type === 'MAINTENANCE');
  const openItems = filteredTasks.filter(item => item.status !== 'COMPLETED');
  const overdueItems = filteredTasks.filter(item => 
    item.status !== 'COMPLETED' && item.due_date && new Date(item.due_date) < new Date()
  );
  const highPriorityItems = filteredTasks.filter(item => 
    item.priority === 'HIGH' || item.priority === 'URGENT'
  );
  
  // Pagination logic - determine what data to paginate based on active tab
  const currentTabData = activeTab === 'all' ? allItems : activeTab === 'tasks' ? taskItems : ticketItems;
  const totalPages = Math.ceil(currentTabData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = currentTabData.slice(startIndex, endIndex);
  
  // Reset page when changing tabs or search
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error loading tasks: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('tasks')}</h1>
          <p className="text-muted-foreground">{t('manage-work-items')}</p>
        </div>
        <CreateWorkItemDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total-items')}</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('open-items')}</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overdue-items')}</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('high-priority-items')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityItems.length}</div>
          </CardContent>
        </Card>
      </div>

        <Tabs defaultValue="all" className="space-y-4" onValueChange={(val) => setActiveTab(val)}>
          <TabsList>
          <TabsTrigger value="all">{industryConfig.showMaintenanceTab ? t('all-tasks-tickets') : t('tasks')}</TabsTrigger>
          <TabsTrigger value="tasks">{t('tasks-tab')}</TabsTrigger>
          {industryConfig.showMaintenanceTab && (
            <TabsTrigger value="tickets">{t('tickets-tab')}</TabsTrigger>
          )}
        </TabsList>
        
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search-tasks-tickets')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                {t('filter')}
                {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">{t('filter-tasks')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('status')}</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('all-statuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t('all-statuses')}</SelectItem>
                      <SelectItem value="OPEN">{t('open')}</SelectItem>
                      <SelectItem value="IN_PROGRESS">{t('in-progress')}</SelectItem>
                      <SelectItem value="SCHEDULED">{t('scheduled')}</SelectItem>
                      <SelectItem value="COMPLETED">{t('completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('priority')}</Label>
                  <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('all-priorities')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t('all-priorities')}</SelectItem>
                      <SelectItem value="LOW">{t('low')}</SelectItem>
                      <SelectItem value="MEDIUM">{t('medium')}</SelectItem>
                      <SelectItem value="HIGH">{t('high')}</SelectItem>
                      <SelectItem value="URGENT">{t('urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('type')}</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('all-types')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t('all-types')}</SelectItem>
                      <SelectItem value="TASK">{t('task')}</SelectItem>
                      <SelectItem value="TICKET">{t('ticket')}</SelectItem>
                      {industryConfig.showMaintenanceTab && (
                        <SelectItem value="MAINTENANCE">{t('maintenance')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    {t('clear-filters')}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>{t('all-tasks-tickets')}</CardTitle>
              <CardDescription>{t('complete-overview')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-3">
                  {allItems.map((item) => (
                    <MobileTaskCard
                      key={item.id}
                      task={item}
                      onComplete={() => handleStatusUpdate(item.id, 'COMPLETED')}
                      onDelete={handleDeleteTask}
                      getStatusColor={getStatusColor}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('item')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('source')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('priority')}</TableHead>
                    <TableHead>{t('due-date')}</TableHead>
                    <TableHead>{t('assignee')}</TableHead>
                    <TableHead>{t('related-to')}</TableHead>
                    <TableHead>{t('resolved-by')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => (
                    <TableRow 
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('[data-no-edit]')) {
                          setEditingTask(item);
                          setEditTaskOpen(true);
                        }
                      }}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <InlineInput
                            value={item.title}
                            onSave={(value) => handleFieldUpdate(item.id, 'title', value)}
                            className="font-medium"
                            placeholder="Enter title"
                          />
                          {item.description && (
                            <InlineInput
                              value={item.description}
                              onSave={(value) => handleFieldUpdate(item.id, 'description', value)}
                              className="text-sm text-muted-foreground max-w-[200px]"
                              placeholder="Enter description"
                              multiline
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={item.type}
                          options={typeOptions}
                          onSave={(value) => handleFieldUpdate(item.id, 'type', value)}
                          renderValue={(value, option) => (
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(value)}
                              <Badge variant="outline">{option?.label || value}</Badge>
                            </div>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getSourceIcon(item.created_by_automation)}
                          <span className="text-sm">
                            {item.created_by_automation ? t('automation') : t('manual')}
                          </span>
                          {item.automation_workflow_id && (
                            <span className="text-xs text-muted-foreground">
                              ({item.automation_workflow_id})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={item.status}
                          options={statusOptions}
                          onSave={(value) => handleFieldUpdate(item.id, 'status', value)}
                          renderValue={(value, option) => (
                            <Badge className={`text-white ${option?.color || 'bg-gray-500'}`}>
                              {option?.label || value.replace('_', ' ')}
                            </Badge>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={item.priority}
                          options={priorityOptions}
                          onSave={(value) => handleFieldUpdate(item.id, 'priority', value)}
                          renderValue={(value, option) => (
                            <Badge className={`text-white ${option?.color || 'bg-gray-500'}`}>
                              {option?.label || value}
                            </Badge>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineDatePicker
                          value={item.due_date}
                          onSave={(value) => handleFieldUpdate(item.id, 'due_date', value)}
                          placeholder="No due date"
                        />
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-500" />
                            {item.assignee_id || t('unassigned')}
                          </div>
                      </TableCell>
                        <TableCell>
                          {item.property_id ? `${t('property')}: ${item.property_id}` : 
                           item.client_id ? `${t('clients-leads')}: ${item.client_id}` :
                           item.deal_id ? `Deal: ${item.deal_id}` :
                           item.lead_id ? `Lead: ${item.lead_id}` : t('none')}
                        </TableCell>
                      <TableCell>
                        {getResolvedByIcon(item.resolved_by_automation, item.resolved_at) && (
                          <div className="flex items-center space-x-1">
                            {getResolvedByIcon(item.resolved_by_automation, item.resolved_at)}
                            <span className="text-sm">
                              {item.resolved_by_automation ? t('automation') : t('manual')}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {item.status !== 'COMPLETED' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(item.id, 'COMPLETED')}
                              disabled={updateTask.isPending}
                            >
                              {t('mark-complete')}
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteTask(item.id)}
                            disabled={deleteTask.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
            
            {/* Pagination Controls for All Items */}
            {allItems.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <select 
                    className="border rounded px-2 py-1 text-sm"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-muted-foreground">per page</span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, currentTabData.length)} of {currentTabData.length} items
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>{t('tasks-tab')}</CardTitle>
              <CardDescription>{t('regular-business-tasks')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tasks-tab')}</TableHead>
                    <TableHead>{t('source')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('priority')}</TableHead>
                    <TableHead>{t('due-date')}</TableHead>
                    <TableHead>{t('assignee')}</TableHead>
                    <TableHead>{t('related-to')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <InlineInput
                            value={task.title}
                            onSave={(value) => handleFieldUpdate(task.id, 'title', value)}
                            className="font-medium"
                            placeholder="Enter title"
                          />
                          {task.description && (
                            <InlineInput
                              value={task.description}
                              onSave={(value) => handleFieldUpdate(task.id, 'description', value)}
                              className="text-sm text-muted-foreground max-w-[200px]"
                              placeholder="Enter description"
                              multiline
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getSourceIcon(task.created_by_automation)}
                          <span className="text-sm">
                            {task.created_by_automation ? 'Automation' : 'Manual'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={task.status}
                          options={statusOptions}
                          onSave={(value) => handleFieldUpdate(task.id, 'status', value)}
                          renderValue={(value, option) => (
                            <Badge className={`text-white ${option?.color || 'bg-gray-500'}`}>
                              {option?.label || value.replace('_', ' ')}
                            </Badge>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={task.priority}
                          options={priorityOptions}
                          onSave={(value) => handleFieldUpdate(task.id, 'priority', value)}
                          renderValue={(value, option) => (
                            <Badge className={`text-white ${option?.color || 'bg-gray-500'}`}>
                              {option?.label || value}
                            </Badge>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineDatePicker
                          value={task.due_date}
                          onSave={(value) => handleFieldUpdate(task.id, 'due_date', value)}
                          placeholder="No due date"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          {task.assignee_id || 'Unassigned'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.property_id ? `Property: ${task.property_id}` : 
                         task.client_id ? `Client: ${task.client_id}` :
                         task.deal_id ? `Deal: ${task.deal_id}` :
                         task.lead_id ? `Lead: ${task.lead_id}` : 'None'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {task.status !== 'COMPLETED' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(task.id, 'COMPLETED')}
                              disabled={updateTask.isPending}
                            >
                              Mark Complete
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={deleteTask.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination Controls for Tasks */}
              {taskItems.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <select 
                    className="border rounded px-2 py-1 text-sm"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-muted-foreground">per page</span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, taskItems.length)} of {taskItems.length} items
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {industryConfig.showMaintenanceTab && (
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance-tickets')}</CardTitle>
              <CardDescription>{t('property-maintenance-tickets')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tickets-tab')}</TableHead>
                    <TableHead>{t('source')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('priority')}</TableHead>
                    <TableHead>{t('due-date')}</TableHead>
                    <TableHead>{t('assignee')}</TableHead>
                    <TableHead>{t('related-to')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <InlineInput
                            value={ticket.title}
                            onSave={(value) => handleFieldUpdate(ticket.id, 'title', value)}
                            className="font-medium"
                            placeholder="Enter title"
                          />
                          {ticket.description && (
                            <InlineInput
                              value={ticket.description}
                              onSave={(value) => handleFieldUpdate(ticket.id, 'description', value)}
                              className="text-sm text-muted-foreground max-w-[200px]"
                              placeholder="Enter description"
                              multiline
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getSourceIcon(ticket.created_by_automation)}
                          <span className="text-sm">
                            {ticket.created_by_automation ? 'Automation' : 'Manual'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={ticket.status}
                          options={statusOptions}
                          onSave={(value) => handleFieldUpdate(ticket.id, 'status', value)}
                          renderValue={(value, option) => (
                            <Badge className={`text-white ${option?.color || 'bg-gray-500'}`}>
                              {option?.label || value.replace('_', ' ')}
                            </Badge>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={ticket.priority}
                          options={priorityOptions}
                          onSave={(value) => handleFieldUpdate(ticket.id, 'priority', value)}
                          renderValue={(value, option) => (
                            <Badge className={`text-white ${option?.color || 'bg-gray-500'}`}>
                              {option?.label || value}
                            </Badge>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineDatePicker
                          value={ticket.due_date}
                          onSave={(value) => handleFieldUpdate(ticket.id, 'due_date', value)}
                          placeholder="No due date"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          {ticket.assignee_id || 'Unassigned'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.property_id ? `Property: ${ticket.property_id}` : 
                         ticket.client_id ? `Client: ${ticket.client_id}` : 'None'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {ticket.status !== 'COMPLETED' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(ticket.id, 'COMPLETED')}
                              disabled={updateTask.isPending}
                            >
                              Mark Complete
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteTask(ticket.id)}
                            disabled={deleteTask.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            
            {/* Pagination Controls for Tickets */}
            {ticketItems.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <select 
                    className="border rounded px-2 py-1 text-sm"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-muted-foreground">per page</span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, ticketItems.length)} of {ticketItems.length} items
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        )}
      </Tabs>

      <EditTaskDialog
        task={editingTask}
        open={editTaskOpen}
        onOpenChange={setEditTaskOpen}
      />

      <AlertDialog open={deleteTaskId !== null} onOpenChange={(open) => { if (!open) setDeleteTaskId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete-task-confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete-task-description', 'This action cannot be undone. The task will be permanently deleted.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-red-600 hover:bg-red-700">
              {t('delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tasks;
