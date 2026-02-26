import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['review_webhook_url']);
      
      if (error) throw error;
      
      const settings: Record<string, any> = {};
      data.forEach(setting => {
        settings[setting.key] = typeof setting.value === 'string' 
          ? JSON.parse(setting.value) 
          : setting.value;
      });
      
      return settings;
    }
  });
};