import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from 'lucide-react';
import { useUpdateTalent, TalentMember } from '@/hooks/useTalent';

interface EditTalentDialogProps {
  talent: TalentMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_OPTIONS = ['influencer', 'model', 'actor', 'musician', 'speaker', 'other'] as const;
const AVAILABILITY_OPTIONS = ['available', 'booked', 'on_hold', 'inactive'] as const;

const defaultFormData = {
  name: '',
  stage_name: '',
  category: '',
  email: '',
  phone: '',
  availability: 'available',
  notes: '',
};

export default function EditTalentDialog({ talent, open, onOpenChange }: EditTalentDialogProps) {
  const [formData, setFormData] = useState({ ...defaultFormData });

  const updateTalent = useUpdateTalent();

  // Sync form state when talent prop changes
  useEffect(() => {
    if (talent) {
      setFormData({
        name: talent.name || '',
        stage_name: talent.stage_name || '',
        category: talent.category || '',
        email: talent.email || '',
        phone: talent.phone || '',
        availability: talent.availability || 'available',
        notes: talent.notes || '',
      });
    } else {
      setFormData({ ...defaultFormData });
    }
  }, [talent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!talent) return;

    try {
      await updateTalent.mutateAsync({
        id: talent.id,
        updates: {
          name: formData.name,
          stage_name: formData.stage_name || undefined,
          category: formData.category || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          availability: formData.availability,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Talent Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Name + Stage Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stage_name">Stage Name</Label>
                <Input
                  id="edit-stage_name"
                  value={formData.stage_name}
                  onChange={(e) => handleInputChange('stage_name', e.target.value)}
                  placeholder="Stage / display name"
                />
              </div>
            </div>

            {/* Category + Availability */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select category</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-availability">Availability</Label>
                <select
                  id="edit-availability"
                  value={formData.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+44 ..."
                />
              </div>
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTalent.isPending}>
              {updateTalent.isPending ? (
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
