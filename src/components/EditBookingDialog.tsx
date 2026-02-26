import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from 'lucide-react';
import { useUpdateBooking, useTalent } from '@/hooks/useTalent';
import type { Booking } from '@/hooks/useTalent';

interface EditBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BOOKING_TYPE_OPTIONS = ['photoshoot', 'video', 'social_post', 'event', 'appearance'] as const;
const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
const PAYMENT_STATUS_OPTIONS = ['pending', 'invoiced', 'paid'] as const;

const defaultFormData = {
  talent_id: '',
  booking_type: '',
  date: '',
  fee: '',
  duration: '',
  status: 'pending',
  payment_status: 'pending',
  notes: '',
};

export default function EditBookingDialog({ booking, open, onOpenChange }: EditBookingDialogProps) {
  const [formData, setFormData] = useState({ ...defaultFormData });

  const updateBooking = useUpdateBooking();
  const { talent } = useTalent();

  // Pre-populate from booking prop
  useEffect(() => {
    if (booking) {
      setFormData({
        talent_id: booking.talent_id || '',
        booking_type: booking.booking_type || '',
        date: booking.date || '',
        fee: booking.fee != null ? String(booking.fee) : '',
        duration: booking.duration || '',
        status: booking.status || 'pending',
        payment_status: booking.payment_status || 'pending',
        notes: booking.notes || '',
      });
    } else {
      setFormData({ ...defaultFormData });
    }
  }, [booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    try {
      await updateBooking.mutateAsync({
        id: booking.id,
        updates: {
          talent_id: formData.talent_id,
          booking_type: formData.booking_type || undefined,
          date: formData.date || undefined,
          fee: formData.fee ? Number(formData.fee) : undefined,
          duration: formData.duration || undefined,
          status: formData.status,
          payment_status: formData.payment_status,
          notes: formData.notes || undefined,
        },
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Talent — full width */}
            <div className="space-y-2">
              <Label htmlFor="edit-talent_id">Talent *</Label>
              <select
                id="edit-talent_id"
                value={formData.talent_id}
                onChange={(e) => handleInputChange('talent_id', e.target.value)}
                className={selectClassName}
                required
              >
                <option value="">Select talent</option>
                {talent.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.stage_name ? ` (${t.stage_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Booking Type + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-booking_type">Booking Type</Label>
                <select
                  id="edit-booking_type"
                  value={formData.booking_type}
                  onChange={(e) => handleInputChange('booking_type', e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Select type</option>
                  {BOOKING_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
            </div>

            {/* Fee + Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fee">Fee</Label>
                <Input
                  id="edit-fee"
                  type="number"
                  value={formData.fee}
                  onChange={(e) => handleInputChange('fee', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="e.g. 2 hours, Full day"
                />
              </div>
            </div>

            {/* Status + Payment Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={selectClassName}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-payment_status">Payment Status</Label>
                <select
                  id="edit-payment_status"
                  value={formData.payment_status}
                  onChange={(e) => handleInputChange('payment_status', e.target.value)}
                  className={selectClassName}
                >
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes — full width */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes..."
                className="min-h-20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBooking.isPending}>
              {updateBooking.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
