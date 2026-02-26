import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useUserCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Input validation schema
const reviewSchema = z.object({
  review: z.string().trim().min(1, 'Review is required').max(1000, 'Review must be less than 1000 characters'),
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5')
});

export function ReviewDialog({ open, onOpenChange }: ReviewDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: userCompany } = useUserCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t('validation-error'),
        description: 'You must be logged in to submit a review',
        variant: "destructive"
      });
      return;
    }

    // Validate input using Zod schema
    try {
      reviewSchema.parse({
        review: review,
        rating: rating
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const firstError = validationError.issues[0];
        toast({
          title: t('validation-error'),
          description: firstError.message,
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      if (!userCompany) {
        throw new Error('Company information not found');
      }

      const userName = user.user_metadata?.first_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
        : user.email?.split('@')[0] || 'User';
      
      const { data: reviewData, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          name: userName,
          email: user.email,
          review_text: review.trim(),
          rating: rating,
          company_id: userCompany.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send email notification via edge function
      try {
        const { error: emailError } = await supabase.functions.invoke('send-review-notification', {
          body: {
            user_email: user.email,
            user_name: userName,
            rating: rating,
            review_text: review.trim(),
          }
        });

        if (emailError) {
          console.error('Error sending review notification:', emailError);
        }
      } catch (emailError) {
        console.error('Error sending review notification:', emailError);
      }

      toast({
        title: t('review-submit-success-title'),
        description: t('review-submit-success-desc'),
      });

      setReview('');
      setRating(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: t('review-submit-error-title'),
        description: t('review-submit-error-desc'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('leave-review')}</DialogTitle>
          <DialogDescription>
            {t('review-description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <Label>{t('rating')} *</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 && `${rating} ${t('out-of-5-stars')}`}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review">{t('your-review')} *</Label>
            <Textarea
              id="review"
              placeholder={t('review-placeholder')}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              required
              rows={4}
              maxLength={1000}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  {t('submitting')}...
                </>
              ) : (
                t('submit-review')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}