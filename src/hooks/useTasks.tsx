import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from './useAuth';
import { useUserCompany } from './useCompany';
import { useTranslation } from "react-i18next";

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  type: string;
  subtype: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  creator_id: string | null;
  assignee_id: string | null;
  property_id: string | null;
  client_id: string | null;
  lead_id: string | null;
  deal_id: string | null;
  created_by_automation: boolean;
  automation_workflow_id: string | null;
  resolved_by_automation: boolean;
  automation_resolution_data: any;
  creator: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  assignee: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  property: {
    title: string;
    address: string;
  } | null;
  client: {
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  lead: {
    source: string;
    stage: string;
  } | null;
  deal: {
    title: string;
    status: string;
  } | null;
}

export interface CreateTaskData {
  title: string;
  description: string | null;
  type: string;
  subtype?: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  creator_id: string | null;
  assignee_id: string | null;
  property_id: string | null;
  client_id: string | null;
  lead_id: string | null;
  deal_id: string | null;
  company_id?: string;
  created_by_automation: boolean;
  automation_workflow_id: string | null;
  resolved_by_automation: boolean;
  automation_resolution_data: any;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export const useTasks = () => {
  const { toast } = useToast();
  const { data: userCompany } = useUserCompany();

  const query = useQuery({
    queryKey: ['tasks', userCompany?.id],
    queryFn: async () => {
      if (!userCompany?.id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('company_id', userCompany.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      return data;
    },
    enabled: !!userCompany?.id,
  });

  // Real-time subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  // Listen for Steve's auto-refresh events
  React.useEffect(() => {
    const handleRefetch = () => query.refetch();
    window.addEventListener('steve:refetch-tasks', handleRefetch);
    return () => window.removeEventListener('steve:refetch-tasks', handleRefetch);
  }, [query]);

  return query;
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskWithRelations> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userCompany } = useUserCompany();

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      if (!user || !userCompany) {
        throw new Error('User not authenticated or company not found');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          creator_id: user.id,
          assignee_id: taskData.assignee_id || user.id,
          company_id: taskData.company_id || userCompany.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast({
        title: "Error", 
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });
};