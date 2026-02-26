import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useUserCompany } from './useCompany';

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  client_type?: string;
  status?: string;
  preferred_contact_method?: string;
  address?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  notes?: string;
  owner_id?: string;
  company_id: string;
  // Lead fields
  lead_stage?: string;
  lead_source?: string;
  lead_priority?: string;
  value_estimate?: number;
  property_id?: string;
  created_by_automation?: boolean;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  const { toast } = useToast();

  const { data: userCompany } = useUserCompany();

  const {
    data: clients = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients', userCompany?.id],
    queryFn: async () => {
      if (!userCompany?.id) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', userCompany.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userCompany?.id,
  });

  // Real-time subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('clients_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Listen for Steve updates
  React.useEffect(() => {
    const handleSteveUpdate = () => {
      refetch();
    };
    
    window.addEventListener('steve:refetch-clients', handleSteveUpdate);
    
    return () => {
      window.removeEventListener('steve:refetch-clients', handleSteveUpdate);
    };
  }, [refetch]);

  return {
    clients,
    isLoading,
    error,
    refetch
  };
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userCompany } = useUserCompany();

  return useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      if (!user || !userCompany) {
        throw new Error('User not authenticated or company not found');
      }
      
      // Ensure required fields are present
      if (!clientData.first_name || !clientData.last_name) {
        throw new Error('First name and last name are required fields');
      }
      
      const insertData = {
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company,
        notes: clientData.notes,
        client_type: clientData.client_type,
        status: clientData.status,
        preferred_contact_method: clientData.preferred_contact_method,
        address: clientData.address,
        city: clientData.city,
        district: clientData.district,
        postal_code: clientData.postal_code,
        // Lead fields
        lead_stage: clientData.lead_stage || 'NONE',
        lead_source: clientData.lead_source,
        lead_priority: clientData.lead_priority || 'MEDIUM',
        value_estimate: clientData.value_estimate,
        property_id: clientData.property_id,
        owner_id: user.id,
        company_id: userCompany.id,
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteClients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientIds: string[]) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .in('id', clientIds);

      if (error) throw error;
      return clientIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: `${count} contact(s) deleted successfully`,
      });
    },
    onError: (error: any) => {
      console.error('Error deleting clients:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete contacts",
        variant: "destructive",
      });
    },
  });
}
