import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIndustry } from '@/contexts/IndustryContext';

const DEFAULT_OPTIONS: Record<string, string[]> = {
  'client_types': ['INDIVIDUAL', 'CORPORATE', 'INVESTOR'],
  'client_statuses': ['ACTIVE', 'INACTIVE', 'PROSPECT'],
  'contact_methods': ['EMAIL', 'PHONE', 'SMS', 'WHATSAPP'],
  'project_types': ['SOFTWARE', 'MARKETING', 'DESIGN', 'CONSULTING', 'OPERATIONS'],
  'project_statuses': ['AVAILABLE', 'PENDING', 'NEGOTIATING', 'WON', 'LOST', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
  'property_types': ['APARTMENT', 'VILLA', 'HOUSE', 'CONDO', 'LAND'],
  'property_statuses': ['AVAILABLE', 'RENTED', 'SOLD', 'PENDING'],
  'lead_stages': ['NONE', 'NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST'],
  'lead_sources': ['WEBSITE', 'SOCIAL_MEDIA', 'REFERRAL', 'COLD_CALL', 'EMAIL', 'EVENT', 'OTHER'],
  'lead_priorities': ['LOW', 'MEDIUM', 'HIGH'],
};

const INDUSTRY_KEY_MAP: Record<string, 'projectTypes' | 'projectStatuses'> = {
  'project_types': 'projectTypes',
  'property_types': 'projectTypes',
  'project_statuses': 'projectStatuses',
  'property_statuses': 'projectStatuses',
};

export const useSystemOptions = (optionKey: string) => {
  const queryClient = useQueryClient();
  const { config } = useIndustry();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ['system-options', optionKey, config],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', optionKey)
        .maybeSingle();

      if (error) throw error;

      const dbOptions = (data?.value as string[]) || [];

      // Use industry config for project/property types and statuses
      const industryField = INDUSTRY_KEY_MAP[optionKey];
      const defaults = industryField
        ? config[industryField]
        : (DEFAULT_OPTIONS[optionKey] || []);

      // Merge defaults with database options, removing duplicates
      const merged = [...new Set([...defaults, ...dbOptions])];
      return merged;
    },
  });

  const addOption = useMutation({
    mutationFn: async (newOption: string) => {
      const normalizedOption = newOption.trim().toUpperCase();
      
      // Check if option already exists (case-insensitive)
      if (options.some(opt => opt.toUpperCase() === normalizedOption)) {
        return options;
      }
      
      const updatedOptions = [...options, normalizedOption];
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: optionKey, 
          value: updatedOptions 
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
      return updatedOptions;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-options', optionKey] });
      toast.success('Option added successfully');
    },
    onError: () => {
      toast.error('Failed to add option');
    },
  });

  return {
    options,
    isLoading,
    addOption: (option: string) => addOption.mutate(option),
  };
};
