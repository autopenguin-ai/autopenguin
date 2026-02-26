import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useUserCompany } from './useCompany';

export interface TalentMember {
  id: string;
  company_id: string;
  name: string;
  stage_name?: string;
  category?: string;
  social_handles?: Record<string, string>;
  follower_count?: number;
  engagement_rate?: number;
  rate_card?: Record<string, number>;
  availability: string; // available, booked, on_hold, inactive
  contract_start?: string;
  contract_end?: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  company_id: string;
  talent_id: string;
  client_id?: string;
  project_id?: string;
  booking_type?: string; // photoshoot, video, social_post, event, appearance
  date?: string;
  duration?: string;
  fee?: number;
  payment_status: string; // pending, invoiced, paid
  status: string; // pending, confirmed, completed, cancelled
  notes?: string;
  created_at: string;
  updated_at: string;
  talent?: { name: string }; // from join
}

// ---------------------------------------------------------------------------
// Talent hooks
// ---------------------------------------------------------------------------

export function useTalent() {
  const { toast } = useToast();
  const { data: userCompany } = useUserCompany();

  const {
    data: talent = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['talent', userCompany?.id],
    queryFn: async () => {
      if (!userCompany?.id) return [];

      const { data, error } = await supabase
        .from('talent')
        .select('*')
        .eq('company_id', userCompany.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching talent:', error);
        throw error;
      }

      return (data || []) as TalentMember[];
    },
    enabled: !!userCompany?.id,
  });

  // Real-time subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('talent_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'talent'
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

    window.addEventListener('steve:refetch-talent', handleSteveUpdate);

    return () => {
      window.removeEventListener('steve:refetch-talent', handleSteveUpdate);
    };
  }, [refetch]);

  return {
    talent,
    isLoading,
    error,
    refetch
  };
}

export function useCreateTalent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userCompany } = useUserCompany();

  return useMutation({
    mutationFn: async (talentData: Partial<TalentMember>) => {
      if (!user || !userCompany) {
        throw new Error('User not authenticated or company not found');
      }

      if (!talentData.name) {
        throw new Error('Name is a required field');
      }

      const insertData = {
        name: talentData.name,
        stage_name: talentData.stage_name,
        category: talentData.category,
        social_handles: talentData.social_handles,
        follower_count: talentData.follower_count,
        engagement_rate: talentData.engagement_rate,
        rate_card: talentData.rate_card,
        availability: talentData.availability || 'available',
        contract_start: talentData.contract_start,
        contract_end: talentData.contract_end,
        email: talentData.email,
        phone: talentData.phone,
        notes: talentData.notes,
        tags: talentData.tags || [],
        company_id: userCompany.id,
      };

      const { data, error } = await supabase
        .from('talent')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as TalentMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      toast({
        title: "Success",
        description: "Talent member created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error creating talent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create talent member",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTalent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TalentMember> }) => {
      const { data, error } = await supabase
        .from('talent')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TalentMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      toast({
        title: "Success",
        description: "Talent member updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating talent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update talent member",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTalent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (talentId: string) => {
      const { error } = await supabase
        .from('talent')
        .delete()
        .eq('id', talentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      toast({
        title: "Success",
        description: "Talent member deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting talent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete talent member",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTalentBulk() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (talentIds: string[]) => {
      const { error } = await supabase
        .from('talent')
        .delete()
        .in('id', talentIds);

      if (error) throw error;
      return talentIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      toast({
        title: "Success",
        description: `${count} talent member(s) deleted successfully`,
      });
    },
    onError: (error: any) => {
      console.error('Error deleting talent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete talent members",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Booking hooks
// ---------------------------------------------------------------------------

export function useBookings() {
  const { toast } = useToast();
  const { data: userCompany } = useUserCompany();

  const {
    data: bookings = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['bookings', userCompany?.id],
    queryFn: async () => {
      if (!userCompany?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*, talent:talent_id(name)')
        .eq('company_id', userCompany.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }

      return (data || []) as Booking[];
    },
    enabled: !!userCompany?.id,
  });

  // Real-time subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
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

    window.addEventListener('steve:refetch-bookings', handleSteveUpdate);

    return () => {
      window.removeEventListener('steve:refetch-bookings', handleSteveUpdate);
    };
  }, [refetch]);

  return {
    bookings,
    isLoading,
    error,
    refetch
  };
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userCompany } = useUserCompany();

  return useMutation({
    mutationFn: async (bookingData: Partial<Booking>) => {
      if (!user || !userCompany) {
        throw new Error('User not authenticated or company not found');
      }

      if (!bookingData.talent_id) {
        throw new Error('Talent is a required field');
      }

      const insertData = {
        talent_id: bookingData.talent_id,
        client_id: bookingData.client_id,
        project_id: bookingData.project_id,
        booking_type: bookingData.booking_type,
        date: bookingData.date,
        duration: bookingData.duration,
        fee: bookingData.fee,
        payment_status: bookingData.payment_status || 'pending',
        status: bookingData.status || 'pending',
        notes: bookingData.notes,
        company_id: userCompany.id,
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Booking> }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Success",
        description: "Booking updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update booking",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    },
  });
}
