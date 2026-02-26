import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign } from 'lucide-react';

interface FinanceWidgetProps {
  filters?: Record<string, any>;
}

function getInvoiceStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function getExpenseStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export function FinanceWidget({ filters }: FinanceWidgetProps) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinance() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      const companyId = profile.company_id;

      // Both tables added via migration - not yet in generated types
      let invoiceQuery = supabase
        .from('invoices' as any)
        .select('id, invoice_number, total, status, issue_date, client_id')
        .eq('company_id', companyId)
        .order('issue_date', { ascending: false })
        .limit(5);

      if (filters?.invoice_status) {
        invoiceQuery = invoiceQuery.eq('status', filters.invoice_status);
      }

      let expenseQuery = supabase
        .from('expenses' as any)
        .select('id, description, category, amount, status, date')
        .eq('company_id', companyId)
        .order('date', { ascending: false })
        .limit(5);

      if (filters?.expense_status) {
        expenseQuery = expenseQuery.eq('status', filters.expense_status);
      }

      const [invoicesRes, expensesRes] = await Promise.all([
        invoiceQuery,
        expenseQuery,
      ]);

      setInvoices((invoicesRes.data as any[]) || []);
      setExpenses((expensesRes.data as any[]) || []);
      setLoading(false);
    }

    if (user) fetchFinance();
  }, [user, filters]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">Finance</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoices Section */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Recent Invoices
          </h4>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-sm">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="text-sm">
                      ${Number(inv.total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getInvoiceStatusClass(inv.status)}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Expenses Section */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Recent Expenses
          </h4>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium text-sm max-w-[150px] truncate">
                      {exp.description}
                    </TableCell>
                    <TableCell className="text-sm">{exp.category || '-'}</TableCell>
                    <TableCell className="text-sm">
                      ${Number(exp.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getExpenseStatusClass(exp.status)}>
                        {exp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
