import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, Loader, Trash2, ChevronDown, Filter, Calendar } from 'lucide-react';
import AddTalentDialog from '@/components/AddTalentDialog';
import EditTalentDialog from '@/components/EditTalentDialog';
import { useTalent, useUpdateTalent, useDeleteTalent, useDeleteTalentBulk, type TalentMember } from '@/hooks/useTalent';

const CATEGORY_OPTIONS = ['influencer', 'model', 'actor', 'musician', 'speaker', 'other'] as const;
const AVAILABILITY_OPTIONS = ['available', 'booked', 'on_hold', 'inactive'] as const;

function getAvailabilityColor(availability: string) {
  switch (availability?.toLowerCase()) {
    case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'booked': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function formatAvailability(availability: string) {
  return availability?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';
}

export default function Talent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editTalent, setEditTalent] = useState<TalentMember | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [filters, setFilters] = useState({ category: '', availability: '' });

  const { talent, isLoading, error } = useTalent();
  const updateTalent = useUpdateTalent();
  const deleteTalent = useDeleteTalent();
  const deleteTalentBulk = useDeleteTalentBulk();

  // Filter talent for a given tab
  const getTalentForTab = (tabType: string) => {
    let tabTalent = talent;

    // Filter by tab type first
    if (tabType !== 'all') {
      tabTalent = talent.filter(t => t.availability === tabType);
    }

    // Then apply search and filter logic
    return tabTalent.filter(t => {
      const matchesSearch =
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.stage_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filters.category || filters.category === ' ' || t.category === filters.category;
      const matchesAvailability = !filters.availability || filters.availability === ' ' || t.availability === filters.availability;

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  };

  const hasActiveFilters = (filters.category && filters.category !== ' ') || (filters.availability && filters.availability !== ' ');

  const clearFilters = () => {
    setFilters({ category: '', availability: '' });
  };

  const currentTabTalent = getTalentForTab(activeTab);

  // Pagination logic
  const totalPages = Math.ceil(currentTabTalent.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTalent = currentTabTalent.slice(startIndex, endIndex);

  // Reset page when changing tabs or search
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Get counts for each tab
  const getTabCount = (status: string) => {
    if (status === 'all') return talent.length;
    return talent.filter(t => t.availability === status).length;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentTabTalent.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectTalent = (talentId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, talentId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== talentId));
    }
  };

  const handleDeleteTalent = (talentId: string) => {
    deleteTalent.mutate(talentId);
  };

  const handleBulkDelete = () => {
    deleteTalentBulk.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
      }
    });
  };

  const handleAvailabilityChange = (talentId: string, newAvailability: string) => {
    updateTalent.mutate({ id: talentId, updates: { availability: newAvailability } });
  };

  const handleEditTalent = (member: TalentMember) => {
    setEditTalent(member);
    setEditOpen(true);
  };

  const isAllSelected = selectedIds.length === currentTabTalent.length && currentTabTalent.length > 0;

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
          Error loading talent: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-6 space-y-6 border-b bg-background">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Talent</h1>
            <p className="text-muted-foreground">Manage your talent roster</p>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedIds.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Talent</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedIds.length} talent member(s)? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AddTalentDialog />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search talent by name, stage name, category, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Talent</h4>

                {/* Category dropdown */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Categories</SelectItem>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability dropdown */}
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Select value={filters.availability} onValueChange={(value) => setFilters({ ...filters, availability: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Availabilities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Availabilities</SelectItem>
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {formatAvailability(opt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear filters button */}
                {hasActiveFilters && (
                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Star className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{talent.length}</p>
                <p className="text-sm text-muted-foreground">Total Talent</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-2xl font-bold">{getTabCount('available')}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-2xl font-bold">{getTabCount('booked')}</p>
                <p className="text-sm text-muted-foreground">Booked</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{getTabCount('on_hold')}</p>
                <p className="text-sm text-muted-foreground">On Hold</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scrollable Table Section */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({getTabCount('all')})</TabsTrigger>
              <TabsTrigger value="available">Available ({getTabCount('available')})</TabsTrigger>
              <TabsTrigger value="booked">Booked ({getTabCount('booked')})</TabsTrigger>
              <TabsTrigger value="on_hold">On Hold ({getTabCount('on_hold')})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({getTabCount('inactive')})</TabsTrigger>
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
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[150px]">Stage Name</TableHead>
                      <TableHead className="w-[130px]">Category</TableHead>
                      <TableHead className="w-[150px]">Availability</TableHead>
                      <TableHead className="w-[180px]">Email</TableHead>
                      <TableHead className="w-[130px]">Phone</TableHead>
                      <TableHead className="w-[130px]">Date Added</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableBody>
                    {paginatedTalent.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('[data-no-edit]')) {
                            handleEditTalent(member);
                          }
                        }}
                      >
                        <TableCell className="w-12" data-no-edit>
                          <Checkbox
                            checked={selectedIds.includes(member.id)}
                            onCheckedChange={(checked: boolean) => handleSelectTalent(member.id, checked)}
                          />
                        </TableCell>
                        <TableCell className="w-[200px]">
                          <div className="font-medium">{member.name}</div>
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <span className="text-sm">{member.stage_name || '-'}</span>
                        </TableCell>
                        <TableCell className="w-[130px]">
                          <Badge variant="outline">
                            {member.category ? member.category.charAt(0).toUpperCase() + member.category.slice(1) : 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[150px]" data-no-edit>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-auto p-0">
                                <Badge className={`${getAvailabilityColor(member.availability)} cursor-pointer hover:opacity-80`}>
                                  {formatAvailability(member.availability)} <ChevronDown className="ml-1 h-3 w-3" />
                                </Badge>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAvailabilityChange(member.id, 'available'); }}>
                                Available
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAvailabilityChange(member.id, 'booked'); }}>
                                Booked
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAvailabilityChange(member.id, 'on_hold'); }}>
                                On Hold
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAvailabilityChange(member.id, 'inactive'); }}>
                                Inactive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="w-[180px]">
                          <span className="text-sm">{member.email || '-'}</span>
                        </TableCell>
                        <TableCell className="w-[130px]">
                          <span className="text-sm">{member.phone || '-'}</span>
                        </TableCell>
                        <TableCell className="w-[130px]">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(member.created_at).toLocaleDateString()}
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
                                <AlertDialogTitle>Delete Talent</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{member.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTalent(member.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                    {currentTabTalent.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          {searchTerm ? 'No talent matches your search' : 'No talent found'}
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
                  Showing {startIndex + 1} to {Math.min(endIndex, currentTabTalent.length)} of {currentTabTalent.length} items
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

      <EditTalentDialog
        talent={editTalent}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
