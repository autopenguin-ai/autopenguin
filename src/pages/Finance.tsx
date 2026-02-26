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
import { Search, DollarSign, Clock, Receipt, TrendingUp, Loader, Trash2, ChevronDown, Filter, Calendar } from 'lucide-react';
import AddInvoiceDialog from '@/components/AddInvoiceDialog';
import EditInvoiceDialog from '@/components/EditInvoiceDialog';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import EditExpenseDialog from '@/components/EditExpenseDialog';
import {
  useInvoices, useUpdateInvoice, useDeleteInvoice,
  useExpenses, useUpdateExpense, useDeleteExpense,
  useFinanceStats,
  type Invoice, type Expense,
} from '@/hooks/useFinance';

const INVOICE_STATUS_OPTIONS = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
const EXPENSE_STATUS_OPTIONS = ['pending', 'approved', 'rejected'] as const;
const EXPENSE_CATEGORY_OPTIONS = ['travel', 'equipment', 'marketing', 'office', 'talent_fee', 'other'] as const;

function getInvoiceStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function getExpenseStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function formatStatus(status: string) {
  return status?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';
}

function formatCurrency(amount: number) {
  return `$${Number(amount).toLocaleString()}`;
}

export default function Finance() {
  const [mainTab, setMainTab] = useState('invoices');
  const [invoiceSubTab, setInvoiceSubTab] = useState('all');
  const [expenseSubTab, setExpenseSubTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Separate pagination per tab
  const [invoicePage, setInvoicePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Edit state
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({ status: '', category: '' });

  // Hooks
  const { invoices, isLoading: invoicesLoading, error: invoicesError } = useInvoices();
  const { expenses, isLoading: expensesLoading, error: expensesError } = useExpenses();
  const { totalRevenue, outstanding, totalExpenses, netProfit } = useFinanceStats();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const isLoading = invoicesLoading || expensesLoading;
  const error = invoicesError || expensesError;

  // Reset selections when switching main tabs
  useEffect(() => {
    setSelectedIds([]);
  }, [mainTab]);

  // Reset pagination on search/sub-tab change
  useEffect(() => {
    setInvoicePage(1);
  }, [invoiceSubTab, searchTerm]);

  useEffect(() => {
    setExpensePage(1);
  }, [expenseSubTab, searchTerm]);

  // --- Invoice filtering ---
  const getInvoicesForTab = (subTab: string) => {
    let filtered = invoices;

    if (subTab !== 'all') {
      filtered = filtered.filter(inv => inv.status === subTab);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(term) ||
        inv.client?.first_name?.toLowerCase().includes(term) ||
        inv.client?.last_name?.toLowerCase().includes(term)
      );
    }

    // Apply filter popover status
    if (filters.status && filters.status !== ' ') {
      filtered = filtered.filter(inv => inv.status === filters.status);
    }

    return filtered;
  };

  const getInvoiceTabCount = (status: string) => {
    if (status === 'all') return invoices.length;
    return invoices.filter(inv => inv.status === status).length;
  };

  // --- Expense filtering ---
  const getExpensesForTab = (subTab: string) => {
    let filtered = expenses;

    if (subTab !== 'all') {
      filtered = filtered.filter(exp => exp.status === subTab);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(exp =>
        exp.description?.toLowerCase().includes(term) ||
        exp.category?.toLowerCase().includes(term)
      );
    }

    // Apply filter popover
    if (filters.status && filters.status !== ' ') {
      filtered = filtered.filter(exp => exp.status === filters.status);
    }
    if (filters.category && filters.category !== ' ') {
      filtered = filtered.filter(exp => exp.category === filters.category);
    }

    return filtered;
  };

  const getExpenseTabCount = (status: string) => {
    if (status === 'all') return expenses.length;
    return expenses.filter(exp => exp.status === status).length;
  };

  // Current filtered lists
  const currentInvoices = getInvoicesForTab(invoiceSubTab);
  const currentExpenses = getExpensesForTab(expenseSubTab);

  // Pagination - invoices
  const invoiceTotalPages = Math.ceil(currentInvoices.length / itemsPerPage);
  const invoiceStartIndex = (invoicePage - 1) * itemsPerPage;
  const invoiceEndIndex = invoiceStartIndex + itemsPerPage;
  const paginatedInvoices = currentInvoices.slice(invoiceStartIndex, invoiceEndIndex);

  // Pagination - expenses
  const expenseTotalPages = Math.ceil(currentExpenses.length / itemsPerPage);
  const expenseStartIndex = (expensePage - 1) * itemsPerPage;
  const expenseEndIndex = expenseStartIndex + itemsPerPage;
  const paginatedExpenses = currentExpenses.slice(expenseStartIndex, expenseEndIndex);

  // Current list for selection purposes
  const currentList = mainTab === 'invoices' ? currentInvoices : currentExpenses;
  const isAllSelected = selectedIds.length === currentList.length && currentList.length > 0;

  const hasActiveFilters = (filters.status && filters.status !== ' ') || (filters.category && filters.category !== ' ');

  const clearFilters = () => {
    setFilters({ status: '', category: '' });
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentList.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  // Invoice actions
  const handleInvoiceStatusChange = (invoiceId: string, newStatus: string) => {
    updateInvoice.mutate({ id: invoiceId, updates: { status: newStatus } });
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    deleteInvoice.mutate(invoiceId);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditInvoice(invoice);
    setEditInvoiceOpen(true);
  };

  // Expense actions
  const handleExpenseStatusChange = (expenseId: string, newStatus: string) => {
    updateExpense.mutate({ id: expenseId, updates: { status: newStatus } });
  };

  const handleDeleteExpense = (expenseId: string) => {
    deleteExpense.mutate(expenseId);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditExpense(expense);
    setEditExpenseOpen(true);
  };

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
          Error loading finance data: {error.message}
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
            <h1 className="text-3xl font-bold">Finance</h1>
            <p className="text-muted-foreground">Manage invoices and expenses</p>
          </div>
          <div className="flex gap-2">
            <AddInvoiceDialog
              trigger={<Button variant="outline">New Invoice</Button>}
            />
            <AddExpenseDialog
              trigger={<Button variant="outline">Log Expense</Button>}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                mainTab === 'invoices'
                  ? 'Search invoices by number or client name...'
                  : 'Search expenses by description or category...'
              }
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
                <h4 className="font-medium">
                  Filter {mainTab === 'invoices' ? 'Invoices' : 'Expenses'}
                </h4>

                {/* Status filter - shown for both */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Statuses</SelectItem>
                      {(mainTab === 'invoices' ? INVOICE_STATUS_OPTIONS : EXPENSE_STATUS_OPTIONS).map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {formatStatus(opt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category filter - expenses only */}
                {mainTab === 'expenses' && (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters({ ...filters, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">All Categories</SelectItem>
                        {EXPENSE_CATEGORY_OPTIONS.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(outstanding)}</p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </p>
                <p className="text-sm text-muted-foreground">Net Profit</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Tabs Section */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={mainTab} onValueChange={(val) => { setMainTab(val); clearFilters(); setSearchTerm(''); }} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="flex-1 overflow-hidden m-6 mt-0">
            <div className="h-full flex flex-col">
              {/* Invoice Sub-tabs */}
              <div className="flex-shrink-0 mb-4">
                <Tabs value={invoiceSubTab} onValueChange={setInvoiceSubTab}>
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">All ({getInvoiceTabCount('all')})</TabsTrigger>
                    <TabsTrigger value="draft">Draft ({getInvoiceTabCount('draft')})</TabsTrigger>
                    <TabsTrigger value="sent">Sent ({getInvoiceTabCount('sent')})</TabsTrigger>
                    <TabsTrigger value="paid">Paid ({getInvoiceTabCount('paid')})</TabsTrigger>
                    <TabsTrigger value="overdue">Overdue ({getInvoiceTabCount('overdue')})</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled ({getInvoiceTabCount('cancelled')})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Invoice Table */}
              <div className="flex-1 border rounded-lg bg-card flex flex-col overflow-hidden">
                {/* Fixed Header */}
                <div className="flex-shrink-0">
                  <Table>
                    <TableHeader className="bg-card border-b">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected && mainTab === 'invoices'}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-[130px]">Invoice #</TableHead>
                        <TableHead className="w-[180px]">Client</TableHead>
                        <TableHead className="w-[120px]">Total</TableHead>
                        <TableHead className="w-[140px]">Status</TableHead>
                        <TableHead className="w-[130px]">Issue Date</TableHead>
                        <TableHead className="w-[130px]">Due Date</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableBody>
                      {paginatedInvoices.map((invoice) => (
                        <TableRow
                          key={invoice.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={(e) => {
                            if (!(e.target as HTMLElement).closest('[data-no-edit]')) {
                              handleEditInvoice(invoice);
                            }
                          }}
                        >
                          <TableCell className="w-12" data-no-edit>
                            <Checkbox
                              checked={selectedIds.includes(invoice.id)}
                              onCheckedChange={(checked: boolean) => handleSelectItem(invoice.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="w-[130px]">
                            <span className="font-medium">{invoice.invoice_number}</span>
                          </TableCell>
                          <TableCell className="w-[180px]">
                            <span className="text-sm">
                              {invoice.client
                                ? `${invoice.client.first_name} ${invoice.client.last_name}`
                                : '-'}
                            </span>
                          </TableCell>
                          <TableCell className="w-[120px]">
                            <span className="font-medium">{formatCurrency(invoice.total)}</span>
                          </TableCell>
                          <TableCell className="w-[140px]" data-no-edit>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-auto p-0">
                                  <Badge className={`${getInvoiceStatusColor(invoice.status)} cursor-pointer hover:opacity-80`}>
                                    {formatStatus(invoice.status)} <ChevronDown className="ml-1 h-3 w-3" />
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                                {INVOICE_STATUS_OPTIONS.map((opt) => (
                                  <DropdownMenuItem
                                    key={opt}
                                    onClick={(e) => { e.stopPropagation(); handleInvoiceStatusChange(invoice.id, opt); }}
                                  >
                                    {formatStatus(opt)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell className="w-[130px]">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(invoice.issue_date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="w-[130px]">
                            <span className="text-sm text-muted-foreground">
                              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                            </span>
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
                                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete invoice "{invoice.invoice_number}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteInvoice(invoice.id)}
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
                      {currentInvoices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            {searchTerm ? 'No invoices match your search' : 'No invoices found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setInvoicePage(1);
                      }}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Showing {currentInvoices.length > 0 ? invoiceStartIndex + 1 : 0} to {Math.min(invoiceEndIndex, currentInvoices.length)} of {currentInvoices.length} items
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                      disabled={invoicePage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {invoicePage} of {invoiceTotalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoicePage(p => Math.min(invoiceTotalPages, p + 1))}
                      disabled={invoicePage === invoiceTotalPages || invoiceTotalPages === 0}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="flex-1 overflow-hidden m-6 mt-0">
            <div className="h-full flex flex-col">
              {/* Expense Sub-tabs */}
              <div className="flex-shrink-0 mb-4">
                <Tabs value={expenseSubTab} onValueChange={setExpenseSubTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All ({getExpenseTabCount('all')})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({getExpenseTabCount('pending')})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({getExpenseTabCount('approved')})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({getExpenseTabCount('rejected')})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Expense Table */}
              <div className="flex-1 border rounded-lg bg-card flex flex-col overflow-hidden">
                {/* Fixed Header */}
                <div className="flex-shrink-0">
                  <Table>
                    <TableHeader className="bg-card border-b">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected && mainTab === 'expenses'}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-[200px]">Description</TableHead>
                        <TableHead className="w-[130px]">Category</TableHead>
                        <TableHead className="w-[120px]">Amount</TableHead>
                        <TableHead className="w-[140px]">Status</TableHead>
                        <TableHead className="w-[130px]">Date</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableBody>
                      {paginatedExpenses.map((expense) => (
                        <TableRow
                          key={expense.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={(e) => {
                            if (!(e.target as HTMLElement).closest('[data-no-edit]')) {
                              handleEditExpense(expense);
                            }
                          }}
                        >
                          <TableCell className="w-12" data-no-edit>
                            <Checkbox
                              checked={selectedIds.includes(expense.id)}
                              onCheckedChange={(checked: boolean) => handleSelectItem(expense.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="w-[200px]">
                            <span className="font-medium max-w-[200px] truncate block">
                              {expense.description}
                            </span>
                          </TableCell>
                          <TableCell className="w-[130px]">
                            {expense.category ? (
                              <Badge variant="outline">
                                {expense.category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="w-[120px]">
                            <span className="font-medium">{formatCurrency(expense.amount)}</span>
                          </TableCell>
                          <TableCell className="w-[140px]" data-no-edit>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-auto p-0">
                                  <Badge className={`${getExpenseStatusColor(expense.status)} cursor-pointer hover:opacity-80`}>
                                    {formatStatus(expense.status)} <ChevronDown className="ml-1 h-3 w-3" />
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                                {EXPENSE_STATUS_OPTIONS.map((opt) => (
                                  <DropdownMenuItem
                                    key={opt}
                                    onClick={(e) => { e.stopPropagation(); handleExpenseStatusChange(expense.id, opt); }}
                                  >
                                    {formatStatus(opt)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell className="w-[130px]">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(expense.date).toLocaleDateString()}
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
                                  <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this expense? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteExpense(expense.id)}
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
                      {currentExpenses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            {searchTerm ? 'No expenses match your search' : 'No expenses found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setExpensePage(1);
                      }}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Showing {currentExpenses.length > 0 ? expenseStartIndex + 1 : 0} to {Math.min(expenseEndIndex, currentExpenses.length)} of {currentExpenses.length} items
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpensePage(p => Math.max(1, p - 1))}
                      disabled={expensePage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {expensePage} of {expenseTotalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpensePage(p => Math.min(expenseTotalPages, p + 1))}
                      disabled={expensePage === expenseTotalPages || expenseTotalPages === 0}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EditInvoiceDialog
        invoice={editInvoice}
        open={editInvoiceOpen}
        onOpenChange={setEditInvoiceOpen}
      />

      <EditExpenseDialog
        expense={editExpense}
        open={editExpenseOpen}
        onOpenChange={setEditExpenseOpen}
      />
    </div>
  );
}
