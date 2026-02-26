import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check } from 'lucide-react';
import { useCreateClient } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSystemOptions } from '@/hooks/useSystemOptions';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const clientSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  last_name: z.string().trim().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal('')),
  phone: z.string().trim().max(20, "Phone number must be less than 20 characters").optional().or(z.literal('')),
  company: z.string().trim().max(200, "Company name must be less than 200 characters").optional().or(z.literal('')),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional().or(z.literal('')),
  address: z.string().max(500, "Address must be less than 500 characters").optional().or(z.literal('')),
  city: z.string().max(100, "City must be less than 100 characters").optional().or(z.literal('')),
  district: z.string().max(100, "District must be less than 100 characters").optional().or(z.literal('')),
  postal_code: z.string().max(20, "Postal code must be less than 20 characters").optional().or(z.literal('')),
  client_type: z.string(),
  status: z.string(),
  preferred_contact_method: z.string(),
  lead_stage: z.string(),
  lead_source: z.string().optional().or(z.literal('')),
  lead_priority: z.string(),
  value_estimate: z.string().optional().or(z.literal('')),
  property_id: z.string().optional().or(z.literal('')),
});

interface AddClientDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AddClientDialog({ trigger, open: controlledOpen, onOpenChange }: AddClientDialogProps = {}) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;
  
  const { options: clientTypes, addOption: addClientType } = useSystemOptions('client_types');
  const { options: clientStatuses, addOption: addClientStatus } = useSystemOptions('client_statuses');
  const { options: contactMethods, addOption: addContactMethod } = useSystemOptions('contact_methods');
  const { options: leadStages } = useSystemOptions('lead_stages');
  const { options: leadSources, addOption: addLeadSource } = useSystemOptions('lead_sources');
  const { options: leadPriorities } = useSystemOptions('lead_priorities');
  const { properties } = useProjects();
  
  const [openTypeCombo, setOpenTypeCombo] = useState(false);
  const [openStatusCombo, setOpenStatusCombo] = useState(false);
  const [openMethodCombo, setOpenMethodCombo] = useState(false);
  const [openSourceCombo, setOpenSourceCombo] = useState(false);
  const [newType, setNewType] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newMethod, setNewMethod] = useState('');
  const [newSource, setNewSource] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    client_type: 'INDIVIDUAL',
    status: 'ACTIVE',
    preferred_contact_method: 'EMAIL',
    address: '',
    city: '',
    district: '',
    postal_code: '',
    notes: '',
    lead_stage: 'NONE',
    lead_source: '',
    lead_priority: 'MEDIUM',
    value_estimate: '',
    property_id: '',
  });

  const createClient = useCreateClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const result = clientSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    const submitData: any = {
      ...result.data,
      value_estimate: result.data.value_estimate ? parseFloat(result.data.value_estimate) : null,
      property_id: result.data.property_id || null,
    };

    createClient.mutate(submitData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          company: '',
          client_type: 'INDIVIDUAL',
          status: 'ACTIVE',
          preferred_contact_method: 'EMAIL',
          address: '',
          city: '',
          district: '',
          postal_code: '',
          notes: '',
          lead_stage: 'NONE',
          lead_source: '',
          lead_priority: 'MEDIUM',
          value_estimate: '',
          property_id: '',
        });
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('add-contact')}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('add-new-contact')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Info Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Contact Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('first-name')} *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">{t('last-name')} *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john.doe@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+852 9123 4567"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Lead Status Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Lead Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lead_stage">Lead Stage</Label>
                <Select value={formData.lead_stage} onValueChange={(value) => handleInputChange('lead_stage', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lead_priority">Priority</Label>
                <Select value={formData.lead_priority} onValueChange={(value) => handleInputChange('lead_priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadPriorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lead_source">Source</Label>
                <Popover open={openSourceCombo} onOpenChange={setOpenSourceCombo}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      type="button"
                    >
                      {formData.lead_source || "Select source..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search or create source..." 
                        onValueChange={setNewSource}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {newSource.trim() && (
                            <Button
                              variant="ghost"
                              className="w-full"
                              type="button"
                              onClick={() => {
                                addLeadSource(newSource.trim().toUpperCase());
                                handleInputChange('lead_source', newSource.trim().toUpperCase());
                                setNewSource('');
                                setOpenSourceCombo(false);
                              }}
                            >
                              Create "{newSource}"
                            </Button>
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {leadSources.map((source) => (
                            <CommandItem
                              key={source}
                              value={source}
                              onSelect={() => {
                                handleInputChange('lead_source', source);
                                setNewSource('');
                                setOpenSourceCombo(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.lead_source === source ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {source}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value_estimate">Est. Value ($)</Label>
                <Input
                  id="value_estimate"
                  type="number"
                  value={formData.value_estimate}
                  onChange={(e) => handleInputChange('value_estimate', e.target.value)}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">{t('project')}</Label>
              <Select value={formData.property_id || 'NONE'} onValueChange={(value) => handleInputChange('property_id', value === 'NONE' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select-project')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Additional Info Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Additional Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="client_type">Client Type</Label>
                <Popover open={openTypeCombo} onOpenChange={setOpenTypeCombo}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      type="button"
                    >
                      {formData.client_type || "Select type..."}
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
                                addClientType(newType.trim().toUpperCase());
                                handleInputChange('client_type', newType.trim().toUpperCase());
                                setNewType('');
                                setOpenTypeCombo(false);
                              }}
                            >
                              Create "{newType}"
                            </Button>
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {clientTypes.map((type) => (
                            <CommandItem
                              key={type}
                              value={type}
                              onSelect={() => {
                                handleInputChange('client_type', type);
                                setNewType('');
                                setOpenTypeCombo(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.client_type === type ? "opacity-100" : "opacity-0"
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
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
                                addClientStatus(newStatus.trim().toUpperCase());
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
                          {clientStatuses.map((status) => (
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">{t('company')}</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="ABC Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_contact_method">Preferred Contact</Label>
              <Popover open={openMethodCombo} onOpenChange={setOpenMethodCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    type="button"
                  >
                    {formData.preferred_contact_method || "Select method..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search or create method..." 
                      onValueChange={setNewMethod}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {newMethod.trim() && (
                          <Button
                            variant="ghost"
                            className="w-full"
                            type="button"
                            onClick={() => {
                              addContactMethod(newMethod.trim().toUpperCase());
                              handleInputChange('preferred_contact_method', newMethod.trim().toUpperCase());
                              setNewMethod('');
                              setOpenMethodCombo(false);
                            }}
                          >
                            Create "{newMethod}"
                          </Button>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {contactMethods.map((method) => (
                          <CommandItem
                            key={method}
                            value={method}
                            onSelect={() => {
                              handleInputChange('preferred_contact_method', method);
                              setNewMethod('');
                              setOpenMethodCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.preferred_contact_method === method ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {method}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">{t('city')}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Hong Kong"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">{t('district')}</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="Central"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('add-notes')}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={createClient.isPending || !formData.first_name || !formData.last_name}
            >
              {createClient.isPending ? t('adding') : t('add-contact')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}