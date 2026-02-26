import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Company {
  id: string;
  name: string;
  display_name: string;
  domain: string | null;
  short_code: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const useUserCompany = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-company', user?.id],
    queryFn: async (): Promise<Company | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          company_id,
          companies!inner (
            id,
            name,
            display_name,
            domain,
            short_code,
            created_at,
            updated_at,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      return data?.companies || null;
    },
    enabled: !!user,
  });
};

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<Company[]> => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      
      return data || [];
    }
  });
};