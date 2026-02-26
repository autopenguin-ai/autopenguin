import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader, X } from 'lucide-react';
import { useCreateInvoice } from '@/hooks/useFinance';
import { useClients } from '@/hooks/useClients';

interface AddInvoiceDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const emptyLineItem = (): LineItem => ({
  description: '',
  quantity: 1,
  unit_price: 0,
  total: 0,
});

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function AddInvoiceDialog({ trigger, open: controlledOpen, onOpenChange }: AddInvoiceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<LineItem[]>([emptyLineItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const { clients = [] } = useClients();
  const createInvoice = useCreateInvoice();

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const tax = useMemo(() => subtotal * taxRate / 100, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      item.total = item.quantity * item.unit_price;
      updated[index] = item;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems(prev => [...prev, emptyLineItem()]);
  };

  const resetForm = () => {
    setClientId('');
    setItems([emptyLineItem()]);
    setTaxRate(0);
    setDueDate('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createInvoice.mutateAsync({
        client_id: clientId,
        items,
        subtotal,
        tax_rate: taxRate,
        tax,
        total,
        due_date: dueDate || undefined,
        notes: notes || undefined,
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Invoice
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <select
                id="client_id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={SELECT_CLASS}
                required
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <Label>Line Items</Label>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-end">
                    <div className="space-y-1">
                      {idx === 0 && <span className="text-xs text-muted-foreground">Description</span>}
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <span className="text-xs text-muted-foreground">Qty</span>}
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <span className="text-xs text-muted-foreground">Unit Price</span>}
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <span className="text-xs text-muted-foreground">Total</span>}
                      <Input value={item.total.toFixed(2)} readOnly className="bg-muted" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-8"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-3 w-3" />
                Add Line Item
              </Button>
            </div>

            {/* Summary */}
            <div className="rounded-md border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min={0}
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1 text-right text-sm">
                  <p>Subtotal: <span className="font-medium">{subtotal.toFixed(2)}</span></p>
                  <p>Tax: <span className="font-medium">{tax.toFixed(2)}</span></p>
                  <p className="text-base font-semibold">Total: {total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, notes..."
                className="min-h-20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Invoice'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
