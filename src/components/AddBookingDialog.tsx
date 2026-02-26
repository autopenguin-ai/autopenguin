import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader } from 'lucide-react';
import { useCreateBooking, useTalent } from '@/hooks/useTalent';

interface AddBookingDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const BOOKING_TYPE_OPTIONS = ['photoshoot', 'video', 'social_post', 'event', 'appearance'] as const;

const defaultFormData = {
  talent_id: '',
  booking_type: '',
  date: '',
  fee: '',
  duration: '',
  notes: '',
};

export default function AddBookingDialog({ trigger, open: controlledOpen, onOpenChange }: AddBookingDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const [formData, setFormData] = useState({ ...defaultFormData });

  const createBooking = useCreateBooking();
  const { talent } = useTalent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createBooking.mutateAsync({
        talent_id: formData.talent_id,
        booking_type: formData.booking_type || undefined,
        date: formData.date || undefined,
        fee: formData.fee ? Number(formData.fee) : undefined,
        duration: formData.duration || undefined,
        notes: formData.notes || undefined,
      });
      setFormData({ ...defaultFormData });
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Booking
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Talent — full width */}
            <div className="space-y-2">
              <Label htmlFor="talent_id">Talent *</Label>
              <select
                id="talent_id"
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
                <Label htmlFor="booking_type">Booking Type</Label>
                <select
                  id="booking_type"
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
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
            </div>

            {/* Fee + Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fee">Fee</Label>
                <Input
                  id="fee"
                  type="number"
                  value={formData.fee}
                  onChange={(e) => handleInputChange('fee', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="e.g. 2 hours, Full day"
                />
              </div>
            </div>

            {/* Notes — full width */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes..."
                className="min-h-20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBooking.isPending}>
              {createBooking.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Booking'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
