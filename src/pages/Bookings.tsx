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
import { Search, Calendar, DollarSign, Loader, Trash2, ChevronDown, Filter } from 'lucide-react';
import AddBookingDialog from '@/components/AddBookingDialog';
import EditBookingDialog from '@/components/EditBookingDialog';
import { useBookings, useUpdateBooking, useDeleteBooking, type Booking } from '@/hooks/useTalent';

const BOOKING_TYPE_OPTIONS = ['photoshoot', 'video', 'social_post', 'event', 'appearance'] as const;
const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function getPaymentStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'invoiced': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function formatLabel(value: string) {
  return value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';
}

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [filters, setFilters] = useState({ booking_type: '', status: '' });

  const { bookings, isLoading, error } = useBookings();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  // Filter bookings for a given tab
  const getBookingsForTab = (tabType: string) => {
    let tabBookings = bookings;

    // Filter by tab type first
    if (tabType !== 'all') {
      tabBookings = bookings.filter(b => b.status === tabType);
    }

    // Then apply search and filter logic
    return tabBookings.filter(b => {
      const matchesSearch =
        b.talent?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.booking_type?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !filters.booking_type || filters.booking_type === ' ' || b.booking_type === filters.booking_type;
      const matchesStatus = !filters.status || filters.status === ' ' || b.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });
  };

  const hasActiveFilters = (filters.booking_type && filters.booking_type !== ' ') || (filters.status && filters.status !== ' ');

  const clearFilters = () => {
    setFilters({ booking_type: '', status: '' });
  };

  const currentTabBookings = getBookingsForTab(activeTab);

  // Pagination logic
  const totalPages = Math.ceil(currentTabBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = currentTabBookings.slice(startIndex, endIndex);

  // Reset page when changing tabs or search
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Get counts for each tab
  const getTabCount = (status: string) => {
    if (status === 'all') return bookings.length;
    return bookings.filter(b => b.status === status).length;
  };

  // Revenue from completed bookings
  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.fee || 0), 0);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentTabBookings.map(b => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, bookingId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== bookingId));
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    deleteBooking.mutate(bookingId);
  };

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    updateBooking.mutate({ id: bookingId, updates: { status: newStatus } });
  };

  const handleEditBooking = (booking: Booking) => {
    setEditBooking(booking);
    setEditOpen(true);
  };

  const isAllSelected = selectedIds.length === currentTabBookings.length && currentTabBookings.length > 0;

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
          Error loading bookings: {error.message}
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
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage talent bookings</p>
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
                    <AlertDialogTitle>Delete Bookings</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedIds.length} booking(s)? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        selectedIds.forEach(id => deleteBooking.mutate(id));
                        setSelectedIds([]);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AddBookingDialog />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings by talent name or type..."
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
                <h4 className="font-medium">Filter Bookings</h4>

                {/* Booking Type dropdown */}
                <div className="space-y-2">
                  <Label>Booking Type</Label>
                  <Select value={filters.booking_type} onValueChange={(value) => setFilters({ ...filters, booking_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Types</SelectItem>
                      {BOOKING_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {formatLabel(opt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status dropdown */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Statuses</SelectItem>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {formatLabel(opt)}
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
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{getTabCount('pending')}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-2xl font-bold">{getTabCount('confirmed')}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
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
              <TabsTrigger value="pending">Pending ({getTabCount('pending')})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({getTabCount('confirmed')})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({getTabCount('completed')})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({getTabCount('cancelled')})</TabsTrigger>
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
                      <TableHead className="w-[180px]">Talent</TableHead>
                      <TableHead className="w-[130px]">Type</TableHead>
                      <TableHead className="w-[130px]">Date</TableHead>
                      <TableHead className="w-[110px]">Fee</TableHead>
                      <TableHead className="w-[130px]">Payment Status</TableHead>
                      <TableHead className="w-[150px]">Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableBody>
                    {paginatedBookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('[data-no-edit]')) {
                            handleEditBooking(booking);
                          }
                        }}
                      >
                        <TableCell className="w-12" data-no-edit>
                          <Checkbox
                            checked={selectedIds.includes(booking.id)}
                            onCheckedChange={(checked: boolean) => handleSelectBooking(booking.id, checked)}
                          />
                        </TableCell>
                        <TableCell className="w-[180px]">
                          <div className="font-medium">{booking.talent?.name || '-'}</div>
                        </TableCell>
                        <TableCell className="w-[130px]">
                          <Badge variant="outline">
                            {booking.booking_type ? formatLabel(booking.booking_type) : '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[130px]">
                          <span className="text-sm">
                            {booking.date ? new Date(booking.date).toLocaleDateString() : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="w-[110px]">
                          <span className="text-sm">
                            {booking.fee != null ? `$${Number(booking.fee).toLocaleString()}` : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="w-[130px]">
                          <Badge className={getPaymentStatusColor(booking.payment_status)}>
                            {formatLabel(booking.payment_status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[150px]" data-no-edit>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-auto p-0">
                                <Badge className={`${getStatusColor(booking.status)} cursor-pointer hover:opacity-80`}>
                                  {formatLabel(booking.status)} <ChevronDown className="ml-1 h-3 w-3" />
                                </Badge>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, 'pending'); }}>
                                Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, 'confirmed'); }}>
                                Confirmed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, 'completed'); }}>
                                Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, 'cancelled'); }}>
                                Cancelled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                                <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this booking for "{booking.talent?.name || 'Unknown'}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteBooking(booking.id)}
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
                    {currentTabBookings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          {searchTerm ? 'No bookings match your search' : 'No bookings found'}
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
                  Showing {startIndex + 1} to {Math.min(endIndex, currentTabBookings.length)} of {currentTabBookings.length} items
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

      <EditBookingDialog
        booking={editBooking}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
