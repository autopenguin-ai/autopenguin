import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useUserCompany } from './useCompany';

export interface Project {
  id: string;
  title: string;
  property_code?: string;
  address: string;
  price?: number;
  property_type: string;
  status: string;
  revenue_type?: 'RECURRING' | 'ONE_TIME';
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  district?: string;
  owner_id?: string;
  assignee_ids?: string[];
  is_featured?: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  description?: string;
  photos?: string[];
  facilities?: any;
  features?: any;
  payment_date?: string;
}

export function useProjects() {
  const { toast } = useToast();
  const { data: userCompany } = useUserCompany();

  const {
    data: properties = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['properties', userCompany?.id],
    queryFn: async () => {
      if (!userCompany?.id) return [];

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('company_id', userCompany.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userCompany?.id,
  });

  // Real-time subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('properties_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties'
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
    
    window.addEventListener('steve:refetch-projects', handleSteveUpdate);
    
    return () => {
      window.removeEventListener('steve:refetch-projects', handleSteveUpdate);
    };
  }, [refetch]);

  return {
    properties,
    isLoading,
    error,
    refetch
  };
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userCompany } = useUserCompany();

  return useMutation({
    mutationFn: async (propertyData: Partial<Project>) => {
      if (!user || !userCompany) {
        throw new Error('User not authenticated or company not found');
      }
      
      // Ensure required fields are present
      if (!propertyData.title || !propertyData.address) {
        throw new Error('Title and address are required fields');
      }
      
      const insertData = {
        title: propertyData.title,
        address: propertyData.address,
        price: propertyData.price,
        property_type: propertyData.property_type || 'OTHER',
        status: propertyData.status || 'AVAILABLE',
        revenue_type: propertyData.revenue_type || 'ONE_TIME',
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        square_feet: propertyData.square_feet,
        district: propertyData.district,
        description: propertyData.description,
        payment_date: propertyData.payment_date,
        owner_id: user.id,
        company_id: userCompany.id,
        assignee_ids: [],
        photos: [],
        features: {},
        facilities: {}
      };

      const { data, error } = await supabase
        .from('properties')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: "Success",
        description: "Property created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error creating property:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: "Success",
        description: "Property deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting property:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete property",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: "Success",
        description: "Property updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating property:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update property",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (propertyIds: string[]) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .in('id', propertyIds);

      if (error) throw error;
    },
    onSuccess: (_, propertyIds) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: "Success",
        description: `${propertyIds.length} properties deleted successfully`,
      });
    },
    onError: (error: any) => {
      console.error('Error deleting properties:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete properties",
        variant: "destructive",
      });
    },
  });
}