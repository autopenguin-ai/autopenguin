import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useUserCompany } from './useCompany';

export interface Invoice {
  id: string;
  company_id: string;
  invoice_number: string;
  client_id?: string;
  talent_id?: string;
  booking_id?: string;
  items: { description: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  tax_rate: number;
  tax: number;
  total: number;
  status: string; // draft, sent, paid, overdue, cancelled
  issue_date: string;
  due_date?: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: { first_name: string; last_name: string }; // from join
}

export interface Expense {
  id: string;
  company_id: string;
  description: string;
  category?: string; // travel, equipment, marketing, office, talent_fee
  amount: number;
  date: string;
  receipt_url?: string;
  project_id?: string;
  talent_id?: string;
  submitted_by?: string;
  approved_by?: string;
  status: string; // pending, approved, rejected
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Invoice hooks
// ---------------------------------------------------------------------------

export function useInvoices() {
  const { toast } = useToast();
  const { data: userCompany } = useUserCompany();

  const {
    data: invoices = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoices', userCompany?.id],
    queryFn: async () => {
      if (!userCompany?.id) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('*, client:client_id(first_name, last_name)')
        .eq('company_id', userCompany.id)
        .order('issue_date', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      return (data || []) as Invoice[];
    },
    enabled: !!userCompany?.id,
  });

  // Real-time subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('invoices_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Listen for Steve updates
  React.useEffect(() => {
    const handleSteveUpdate = () => {
      refetch();
    };

    window.addEventListener('steve:refetch-invoices', handleSteveUpdate);

    return () => {
      window.removeEventListener('steve:refetch-invoices', handleSteveUpdate);
    };
  }, [refetch]);

  return {
    invoices,
    isLoading,
    error,
    refetch
  };
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userCompany } = useUserCompany();

  return useMutation({
    mutationFn: async (invoiceData: Partial<Invoice>) => {
      if (!user || !userCompany) {
        throw new Error('User not authenticated or company not found');
      }

      if (!invoiceData.client_id) {
        throw new Error('Client is a required field');
      }

      // Generate invoice number via RPC
      const { data: invoiceNumber, error: rpcError } = await supabase
        .rpc('generate_invoice_number', { p_company_id: userCompany.id });

      if (rpcError) {
        console.error('Error generating invoice number:', rpcError);
        throw rpcError;
      }

      const insertData = {
        invoice_number: invoiceNumber,
        client_id: invoiceData.client_id,
        talent_id: invoiceData.talent_id,
        booking_id: invoiceData.booking_id,
        items: invoiceData.items || [],
        subtotal: invoiceData.subtotal || 0,
        tax_rate: invoiceData.tax_rate || 0,
        tax: invoiceData.tax || 0,
        total: invoiceData.total || 0,
        status: invoiceData.status || 'draft',
        issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
        due_date: invoiceData.due_date,
        paid_date: invoiceData.paid_date,
        notes: invoiceData.notes,
        company_id: userCompany.id,
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Expense hooks
// ---------------------------------------------------------------------------

export function useExpenses() {
  const { toast } = useToast();
  const { data: userCompany } = useUserCompany();

  const {
    data: expenses = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['expenses', userCompany?.id],
    queryFn: async () => {
      if (!userCompany?.id) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', userCompany.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      return (data || []) as Expense[];
    },
    enabled: !!userCompany?.id,
  });

  // Real-time subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('expenses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Listen for Steve updates
  React.useEffect(() => {
    const handleSteveUpdate = () => {
      refetch();
    };

    window.addEventListener('steve:refetch-expenses', handleSteveUpdate);

    return () => {
      window.removeEventListener('steve:refetch-expenses', handleSteveUpdate);
    };
  }, [refetch]);

  return {
    expenses,
    isLoading,
    error,
    refetch
  };
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userCompany } = useUserCompany();

  return useMutation({
    mutationFn: async (expenseData: Partial<Expense>) => {
      if (!user || !userCompany) {
        throw new Error('User not authenticated or company not found');
      }

      if (!expenseData.description) {
        throw new Error('Description is a required field');
      }

      if (expenseData.amount === undefined || expenseData.amount === null) {
        throw new Error('Amount is a required field');
      }

      const insertData = {
        description: expenseData.description,
        category: expenseData.category,
        amount: expenseData.amount,
        date: expenseData.date || new Date().toISOString().split('T')[0],
        receipt_url: expenseData.receipt_url,
        project_id: expenseData.project_id,
        talent_id: expenseData.talent_id,
        submitted_by: user.id,
        approved_by: expenseData.approved_by,
        status: expenseData.status || 'pending',
        notes: expenseData.notes,
        company_id: userCompany.id,
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create expense",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Finance stats (computed client-side)
// ---------------------------------------------------------------------------

export function useFinanceStats() {
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { expenses, isLoading: expensesLoading } = useExpenses();

  const stats = React.useMemo(() => {
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const outstanding = invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const totalExpenses = expenses
      .filter((exp) => exp.status === 'approved')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const netProfit = totalRevenue - totalExpenses;

    return { totalRevenue, outstanding, totalExpenses, netProfit };
  }, [invoices, expenses]);

  return {
    ...stats,
    isLoading: invoicesLoading || expensesLoading,
  };
}
