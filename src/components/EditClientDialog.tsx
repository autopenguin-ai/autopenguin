import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateClient, type Client } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { Check } from 'lucide-react';
import { useSystemOptions } from '@/hooks/useSystemOptions';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface EditClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
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

  const updateClient = useUpdateClient();

  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        client_type: client.client_type || 'INDIVIDUAL',
        status: client.status || 'ACTIVE',
        preferred_contact_method: client.preferred_contact_method || 'EMAIL',
        address: client.address || '',
        city: client.city || '',
        district: client.district || '',
        postal_code: client.postal_code || '',
        notes: client.notes || '',
        lead_stage: client.lead_stage || 'NONE',
        lead_source: client.lead_source || '',
        lead_priority: client.lead_priority || 'MEDIUM',
        value_estimate: client.value_estimate?.toString() || '',
        property_id: client.property_id || '',
      });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client || !formData.first_name.trim() || !formData.last_name.trim()) {
      return;
    }

    const submitData: any = {
      ...formData,
      value_estimate: formData.value_estimate ? parseFloat(formData.value_estimate) : null,
      property_id: formData.property_id || null,
    };

    updateClient.mutate({
      id: client.id,
      updates: submitData
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Contact Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john.doe@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
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

          {/* Lead Status */}
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
              <Label htmlFor="property_id">Project</Label>
              <Select value={formData.property_id || 'NONE'} onValueChange={(value) => handleInputChange('property_id', value === 'NONE' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
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

          {/* Additional Info */}
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
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="ABC Holdings"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Hong Kong"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="Central"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="000000"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the client..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateClient.isPending || !formData.first_name.trim() || !formData.last_name.trim()}
            >
              {updateClient.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}