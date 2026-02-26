import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Check, CalendarIcon } from 'lucide-react';
import { useUpdateProject, type Project } from '@/hooks/useProjects';
import { useTranslation } from 'react-i18next';
import { useSystemOptions } from '@/hooks/useSystemOptions';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EditProjectDialogProps {
  property: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProjectDialog({ property, open, onOpenChange }: EditProjectDialogProps) {
  const { t } = useTranslation();
  
  const { options: projectTypes, addOption: addProjectType } = useSystemOptions('project_types');
  const { options: statuses, addOption: addStatus } = useSystemOptions('project_statuses');
  
  const [openTypeCombo, setOpenTypeCombo] = useState(false);
  const [openStatusCombo, setOpenStatusCombo] = useState(false);
  const [newType, setNewType] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    price: '',
    property_type: '',
    status: 'AVAILABLE',
    revenue_type: 'ONE_TIME' as 'RECURRING' | 'ONE_TIME',
    description: '',
    payment_date: undefined as Date | undefined,
  });

  const updateProperty = useUpdateProject();

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        address: property.address || '',
        price: property.price?.toString() || '',
        property_type: property.property_type || '',
        status: property.status || 'AVAILABLE',
        revenue_type: (property.revenue_type || 'ONE_TIME') as 'RECURRING' | 'ONE_TIME',
        description: property.description || '',
        payment_date: property.payment_date ? new Date(property.payment_date) : undefined,
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!property) return;

    const updates = {
      title: formData.title,
      address: formData.address,
      price: formData.price ? parseFloat(formData.price) : undefined,
      property_type: formData.property_type,
      status: formData.status,
      revenue_type: formData.revenue_type,
      description: formData.description,
      payment_date: formData.payment_date ? format(formData.payment_date, 'yyyy-MM-dd') : undefined,
    };

    try {
      await updateProperty.mutateAsync({ id: property.id, updates });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Project Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-property_type">{t('project-type')} *</Label>
                <Popover open={openTypeCombo} onOpenChange={setOpenTypeCombo}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      type="button"
                    >
                      {formData.property_type || "Select type..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search or create type..." 
                    onValueChange={setNewType}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {newType.trim() && (
                        <Button
                          variant="ghost"
                          className="w-full"
                          type="button"
                          onClick={() => {
                            addProjectType(newType.trim().toUpperCase());
                            handleInputChange('property_type', newType.trim().toUpperCase());
                            setNewType('');
                            setOpenTypeCombo(false);
                          }}
                        >
                          Create "{newType}"
                        </Button>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {projectTypes.map((type) => (
                        <CommandItem
                          key={type}
                          value={type}
                          onSelect={() => {
                            handleInputChange('property_type', type);
                            setNewType('');
                            setOpenTypeCombo(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.property_type === type ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {type}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address *</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="Enter price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-revenue_type">{t('revenue-type')}</Label>
                <select
                  id="edit-revenue_type"
                  value={formData.revenue_type}
                  onChange={(e) => handleInputChange('revenue_type', e.target.value as 'RECURRING' | 'ONE_TIME')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="ONE_TIME">{t('one-time')}</option>
                  <option value="RECURRING">{t('recurring')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Popover open={openStatusCombo} onOpenChange={setOpenStatusCombo}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      type="button"
                    >
                      {formData.status || "Select status..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search or create status..." 
                    onValueChange={setNewStatus}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {newStatus.trim() && (
                        <Button
                          variant="ghost"
                          className="w-full"
                          type="button"
                          onClick={() => {
                            addStatus(newStatus.trim().toUpperCase());
                            handleInputChange('status', newStatus.trim().toUpperCase());
                            setNewStatus('');
                            setOpenStatusCombo(false);
                          }}
                        >
                          Create "{newStatus}"
                        </Button>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {statuses.map((status) => (
                        <CommandItem
                          key={status}
                          value={status}
                          onSelect={() => {
                            handleInputChange('status', status);
                            setNewStatus('');
                            setOpenStatusCombo(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.status === status ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {status}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-payment_date">{t('payment-date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.payment_date && "text-muted-foreground"
                      )}
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.payment_date ? format(formData.payment_date, "PPP") : t('payment-date-placeholder')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.payment_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, payment_date: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    {formData.payment_date && (
                      <div className="p-3 border-t">
                        <Button
                          variant="ghost"
                          className="w-full"
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, payment_date: undefined }))}
                        >
                          {t('clear-date')}
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter description"
              className="min-h-20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProperty.isPending}>
              {updateProperty.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
