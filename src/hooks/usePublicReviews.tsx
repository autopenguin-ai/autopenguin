import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicReview {
  id: string;
  rating: number;
  review_text: string;
  display_name: string;
  created_at: string;
}

export const usePublicReviews = () => {
  return useQuery({
    queryKey: ['public-reviews'],
    queryFn: async (): Promise<PublicReview[]> => {
      const { data, error } = await supabase
        .from('public_reviews')
        .select('id, rating, review_text, display_name, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    }
  });
};