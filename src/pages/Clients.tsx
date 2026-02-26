import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader, Search, Users, UserPlus, TrendingUp, Calendar, Trash2, Edit, Filter, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { InlineInput, InlineSelect } from '@/components/inline-edit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AddClientDialog from '@/components/AddClientDialog';
import EditClientDialog from '@/components/EditClientDialog';
import ContactImport from '@/components/ContactImport';
import { MobileClientCard } from '@/components/MobileClientCard';
import { useClients, useUpdateClient, useDeleteClient, useDeleteClients, type Client } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientEditOpen, setClientEditOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [filters, setFilters] = useState({
    leadStage: '',
    leadPriority: '',
    leadSource: '',
  });
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { settings } = useCompanySettings();
  
  // Fetch data from Supabase
  const { clients, isLoading: clientsLoading, error: clientsError } = useClients();
  const { properties } = useProjects();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const deleteClients = useDeleteClients();

  // Filter function
  const filteredClients = clients.filter(client => {
    const matchesSearch = `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lead_source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = !filters.leadStage || client.lead_stage === filters.leadStage;
    const matchesPriority = !filters.leadPriority || client.lead_priority === filters.leadPriority;
    const matchesSource = !filters.leadSource || client.lead_source === filters.leadSource;

    return matchesSearch && matchesStage && matchesPriority && matchesSource;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);
  
  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate stats
  const activeLeads = clients.filter(c => c.lead_stage && c.lead_stage !== 'NONE').length;
  const highPriorityLeads = clients.filter(c => c.lead_priority === 'HIGH' && c.lead_stage && c.lead_stage !== 'NONE').length;
  const pipelineValue = clients
    .filter(c => c.lead_stage && c.lead_stage !== 'NONE')
    .reduce((sum, c) => sum + (c.value_estimate || 0), 0);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'NEW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'QUALIFIED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PROPOSAL': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'NEGOTIATION': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'CLOSED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'NONE': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleClientUpdate = async (clientId: string, field: string, value: string | number | null) => {
    try {
      const updates: any = { [field]: value };
      
      // Handle numeric fields
      if (field === 'value_estimate') {
        updates[field] = value ? parseFloat(value as string) : null;
      }
      
      await updateClient.mutateAsync({ 
        id: clientId, 
        updates 
      });
    } catch (error) {
      console.error('Failed to update client:', error);
      throw error;
    }
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClient.mutate(clientId);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientEditOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedContacts.length > 0) {
      deleteClients.mutate(selectedContacts);
      setSelectedContacts([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === paginatedClients.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(paginatedClients.map(c => c.id));
    }
  };

  const toggleSelectContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const hasActiveFilters = filters.leadStage || filters.leadPriority || filters.leadSource;

  const clearFilters = () => {
    setFilters({ leadStage: '', leadPriority: '', leadSource: '' });
  };

  const stageOptions = [
    { value: 'NONE', label: t('none') },
    { value: 'NEW', label: t('new') },
    { value: 'QUALIFIED', label: t('qualified') },
    { value: 'PROPOSAL', label: t('proposal') },
    { value: 'NEGOTIATION', label: t('negotiation') },
    { value: 'CLOSED', label: t('closed') }
  ];

  const priorityOptions = [
    { value: 'LOW', label: t('low'), color: 'bg-green-100 text-green-800' },
    { value: 'MEDIUM', label: t('medium'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'HIGH', label: t('high'), color: 'bg-red-100 text-red-800' }
  ];

  if (clientsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center text-destructive">
          Error loading data: {clientsError?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {showImport ? (
        <div>
          <Button variant="outline" onClick={() => setShowImport(false)} className="mb-4">
            ← {t('back-to-contacts')}
          </Button>
          <ContactImport />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{t('contacts')}</h1>
              <p className="text-muted-foreground">{t('manage-contact-relationships')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImport(true)}>
                <Upload className="mr-2 h-4 w-4" />
                {t('import-csv')}
              </Button>
              {selectedContacts.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('delete-selected')} ({selectedContacts.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('delete-contacts')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('delete-contacts-confirm', { count: selectedContacts.length })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <AddClientDialog />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total-contacts')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('active-leads')}</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('high-priority')}</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pipeline-value')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pipelineValue, settings.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search-contacts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                {t('filter')}
                {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">{t('filter-contacts')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('lead-stage')}</Label>
                  <Select value={filters.leadStage} onValueChange={(value) => setFilters({ ...filters, leadStage: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('all-stages')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t('all-stages')}</SelectItem>
                      <SelectItem value="NEW">{t('new')}</SelectItem>
                      <SelectItem value="QUALIFIED">{t('qualified')}</SelectItem>
                      <SelectItem value="PROPOSAL">{t('proposal')}</SelectItem>
                      <SelectItem value="NEGOTIATION">{t('negotiation')}</SelectItem>
                      <SelectItem value="CLOSED">{t('closed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('lead-priority')}</Label>
                  <Select value={filters.leadPriority} onValueChange={(value) => setFilters({ ...filters, leadPriority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('all-priorities')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t('all-priorities')}</SelectItem>
                      <SelectItem value="LOW">{t('low')}</SelectItem>
                      <SelectItem value="MEDIUM">{t('medium')}</SelectItem>
                      <SelectItem value="HIGH">{t('high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    {t('clear-filters')}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('contact-list')}</CardTitle>
            <CardDescription>{t('contacts-inline-editing')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <MobileClientCard
                    key={client.id}
                    client={client}
                    onEdit={() => handleEditClient(client)}
                    onDelete={() => handleDeleteClient(client.id)}
                  />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContacts.length === paginatedClients.length && paginatedClients.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('contact')}</TableHead>
                    <TableHead>{t('company')}</TableHead>
                    <TableHead>{t('lead-stage')}</TableHead>
                    <TableHead>{t('lead-source')}</TableHead>
                    <TableHead>{t('lead-priority')}</TableHead>
                    <TableHead>{t('value-estimate')}</TableHead>
                    <TableHead>{t('notes')}</TableHead>
                    <TableHead>{t('date-added')}</TableHead>
                    <TableHead className="w-20">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow 
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('[data-no-edit]')) {
                          handleEditClient(client);
                        }
                      }}
                    >
                      <TableCell data-no-edit onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedContacts.includes(client.id)}
                          onCheckedChange={() => toggleSelectContact(client.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <InlineInput
                              value={client.first_name}
                              onSave={(value) => handleClientUpdate(client.id, 'first_name', value)}
                              placeholder="First name"
                              className="font-medium"
                            />
                            <InlineInput
                              value={client.last_name}
                              onSave={(value) => handleClientUpdate(client.id, 'last_name', value)}
                              placeholder="Last name"
                              className="font-medium"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <InlineInput
                            value={client.email || ''}
                            onSave={(value) => handleClientUpdate(client.id, 'email', value)}
                            placeholder="Email"
                            className="text-sm"
                          />
                          <InlineInput
                            value={client.phone || ''}
                            onSave={(value) => handleClientUpdate(client.id, 'phone', value)}
                            placeholder="Phone"
                            className="text-sm text-muted-foreground"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlineInput
                          value={client.company || ''}
                          onSave={(value) => handleClientUpdate(client.id, 'company', value)}
                          placeholder="Company"
                        />
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={client.lead_stage || 'NONE'}
                          options={stageOptions}
                          onSave={(value) => handleClientUpdate(client.id, 'lead_stage', value)}
                          renderValue={(value) => (
                            <Badge className={getStageColor(value)}>
                              {stageOptions.find(o => o.value === value)?.label || value}
                            </Badge>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineInput
                          value={client.lead_source || ''}
                          onSave={(value) => handleClientUpdate(client.id, 'lead_source', value)}
                          placeholder={t('source-placeholder')}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={client.lead_priority || 'MEDIUM'}
                          options={priorityOptions}
                          onSave={(value) => handleClientUpdate(client.id, 'lead_priority', value)}
                          renderValue={(value) => (
                            <Badge className={getPriorityColor(value)}>
                              {priorityOptions.find(o => o.value === value)?.label || value}
                            </Badge>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineInput
                          value={client.value_estimate?.toString() || ''}
                          onSave={(value) => handleClientUpdate(client.id, 'value_estimate', value ? parseFloat(value) : null)}
                          placeholder={`${getCurrencySymbol(settings.currency)}0`}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <InlineInput
                          value={client.notes || ''}
                          onSave={(value) => handleClientUpdate(client.id, 'notes', value)}
                          placeholder="Notes..."
                          multiline
                          className="text-sm text-muted-foreground max-w-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(client.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell data-no-edit>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClient(client);
                            }}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{client.first_name} {client.last_name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          
          {/* Pagination Controls */}
          {!isMobile && filteredClients.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <select 
                  className="border rounded px-2 py-1 text-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} items
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

          <EditClientDialog
            client={editingClient}
            open={clientEditOpen}
            onOpenChange={setClientEditOpen}
          />
        </>
      )}
    </div>
  );
}

