import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, MapPin, Calendar, Upload, Loader, Trash2, ChevronDown, Filter } from 'lucide-react';
import ProjectImport from '@/components/ProjectImport';
import AddProjectDialog from '@/components/AddProjectDialog';
import EditProjectDialog from '@/components/EditProjectDialog';
import { useProjects, useDeleteProject, useDeleteProjects, useUpdateProject, type Project } from '@/hooks/useProjects';
import { useUserCompany } from '@/hooks/useCompany';
import { useTranslation } from 'react-i18next';
import { useSystemOptions } from '@/hooks/useSystemOptions';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { formatCurrency } from '@/lib/utils';

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [editProperty, setEditProperty] = useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [filters, setFilters] = useState({
    status: '',
    projectType: '',
  });
  
  const { properties, isLoading, error } = useProjects();
  const { data: userCompany } = useUserCompany();
  const deleteProperty = useDeleteProject();
  const deleteProperties = useDeleteProjects();
  const updateProperty = useUpdateProject();
  const { t } = useTranslation();
  const { options: projectTypes } = useSystemOptions('project_types');
  const { settings } = useCompanySettings();
  
  
  
  // Create filtered arrays for each tab
  const getPropertiesForTab = (tabType: string) => {
    let tabProperties = properties;
    
    // Filter by tab type first
    if (tabType !== 'all') {
      tabProperties = properties.filter(property => property.status === tabType.toUpperCase());
    }
    
    // Then apply search and filter logic
    return tabProperties.filter(property => {
      const matchesSearch = property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.property_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || filters.status === ' ' || property.status === filters.status;
      const matchesType = !filters.projectType || filters.projectType === ' ' || property.property_type === filters.projectType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  };
  
  const hasActiveFilters = filters.status && filters.status !== ' ' || filters.projectType && filters.projectType !== ' ';
  
  const clearFilters = () => {
    setFilters({ status: '', projectType: '' });
  };
  
  const currentTabProperties = getPropertiesForTab(activeTab);
  
  // Pagination logic
  const totalPages = Math.ceil(currentTabProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = currentTabProperties.slice(startIndex, endIndex);
  
  // Reset page when changing tabs or search
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);
  
  // Get counts for each tab
  const getTabCount = (status: string) => {
    if (status === 'all') return properties.length;
    return properties.filter(p => p.status === status.toUpperCase()).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'WON': return 'bg-blue-100 text-blue-800';
      case 'SOLD': return 'bg-blue-100 text-blue-800';
      case 'RENTED': return 'bg-purple-100 text-purple-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'NEGOTIATING': return 'bg-orange-100 text-orange-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(currentTabProperties.map(p => p.id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    }
  };

  const handleDeleteProperty = (propertyId: string) => {
    deleteProperty.mutate(propertyId);
  };

  const handleBulkDelete = () => {
    deleteProperties.mutate(selectedProperties, {
      onSuccess: () => {
        setSelectedProperties([]);
      }
    });
  };

  const handleStatusChange = (propertyId: string, newStatus: string) => {
    updateProperty.mutate({ id: propertyId, updates: { status: newStatus } });
  };


  const handleEditProperty = (property: any) => {
    // Cast revenue_type to the correct union type
    const typedProperty: Project = {
      ...property,
      revenue_type: property.revenue_type as 'RECURRING' | 'ONE_TIME' | undefined
    };
    setEditProperty(typedProperty);
    setEditDialogOpen(true);
  };

  const isAllSelected = selectedProperties.length === currentTabProperties.length && currentTabProperties.length > 0;
  const isIndeterminate = selectedProperties.length > 0 && selectedProperties.length < currentTabProperties.length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center text-red-600">
          Error loading properties: {error.message}
        </div>
      </div>
    );
  }

  if (showImport) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('import-properties')}</h1>
          <p className="text-muted-foreground">{t('import-properties-csv')}</p>
        </div>
        <Button variant="outline" onClick={() => setShowImport(false)}>
          {t('back-to-properties')}
        </Button>
      </div>
      <ProjectImport />
    </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-6 space-y-6 border-b bg-background">
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('projects')}</h1>
          <p className="text-muted-foreground">{t('manage-property-portfolio')}</p>
        </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t('import-csv')}
            </Button>
            {selectedProperties.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('delete-selected')} ({selectedProperties.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('delete-properties')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('delete-properties-confirm', { count: selectedProperties.length })}
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
            <AddProjectDialog />
            </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search-properties')}
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
                <h4 className="font-medium">{t('filter-projects')}</h4>
                
                {/* Status dropdown */}
                <div className="space-y-2">
                  <Label>{t('status')}</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('all-statuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t('all-statuses')}</SelectItem>
                      <SelectItem value="AVAILABLE">{t('available')}</SelectItem>
                      <SelectItem value="PENDING">{t('pending')}</SelectItem>
                      <SelectItem value="NEGOTIATING">{t('negotiating')}</SelectItem>
                      <SelectItem value="WON">{t('won')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Type dropdown */}
                <div className="space-y-2">
                  <Label>{t('project-type')}</Label>
                  <Select value={filters.projectType} onValueChange={(value) => setFilters({ ...filters, projectType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('all-types')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t('all-types')}</SelectItem>
                      {projectTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear filters button */}
                {hasActiveFilters && (
                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    {t('clear-filters')}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

      </div>

      {/* Scrollable Table Section */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">{t('all-properties')} ({getTabCount('all')})</TabsTrigger>
              <TabsTrigger value="available">{t('available')} ({getTabCount('available')})</TabsTrigger>
              <TabsTrigger value="won">{t('won')} ({getTabCount('won')})</TabsTrigger>
              <TabsTrigger value="pending">{t('pending')} ({getTabCount('pending')})</TabsTrigger>
              <TabsTrigger value="negotiating">{t('negotiating')} ({getTabCount('negotiating')})</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab Contents */}
          <TabsContent value={activeTab} className="flex-1 overflow-hidden m-6 mt-0">
            <div className="h-full border rounded-lg bg-card flex flex-col">
              {/* Fixed Header */}
              <div className="flex-shrink-0">
                <Table>
                  <TableHeader className="bg-card border-b">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[250px]">{t('project')}</TableHead>
                      <TableHead className="w-[150px]">{t('project-type')}</TableHead>
                      <TableHead className="w-[150px]">{t('price')}</TableHead>
                      <TableHead className="w-[150px]">{t('status')}</TableHead>
                      <TableHead className="w-[150px]">{t('status-last-updated')}</TableHead>
                      <TableHead className="w-[150px]">{t('date-added')}</TableHead>
                      <TableHead className="w-[100px]">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              
              {/* Scrollable Body */}
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableBody>
                    {paginatedProperties.map((property) => (
                      <TableRow 
                        key={property.id} 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={(e) => {
                          // Don't trigger edit if clicking on checkbox or action buttons
                          if (!(e.target as HTMLElement).closest('[data-no-edit]')) {
                            handleEditProperty(property);
                          }
                        }}
                      >
                        <TableCell className="w-12" data-no-edit>
                          <Checkbox
                            checked={selectedProperties.includes(property.id)}
                            onCheckedChange={(checked: boolean) => handleSelectProperty(property.id, checked)}
                          />
                        </TableCell>
                        <TableCell className="w-[250px]">
                          <div>
                            <div className="font-medium">{property.title}</div>
                            <div className="text-sm text-muted-foreground">{property.address}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <Badge variant="outline">{property.property_type || 'Unknown'}</Badge>
                        </TableCell>
                        <TableCell className="w-[150px]">
                          {property.price ? formatCurrency(property.price, settings.currency) : 'POA'}
                        </TableCell>
                        <TableCell className="w-[150px]" data-no-edit>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-auto p-0">
                                <Badge className={`${getStatusColor(property.status)} cursor-pointer hover:opacity-80`}>
                                  {property.status} <ChevronDown className="ml-1 h-3 w-3" />
                                </Badge>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(property.id, 'AVAILABLE'); }}>
                                {t('available')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(property.id, 'PENDING'); }}>
                                {t('pending')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(property.id, 'NEGOTIATING'); }}>
                                {t('negotiating')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(property.id, 'WON'); }}>
                                {t('won')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(property.updated_at).toLocaleDateString()}
                            <span className="ml-1 text-xs">
                              {new Date(property.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(property.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="w-[100px]" data-no-edit>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('delete-property')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('delete-property-confirm', { title: property.title })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteProperty(property.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t('delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                    {currentTabProperties.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          {searchTerm ? t('no-properties-search') : t('no-properties-add')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
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
                  Showing {startIndex + 1} to {Math.min(endIndex, currentTabProperties.length)} of {currentTabProperties.length} items
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
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EditProjectDialog
        property={editProperty}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}