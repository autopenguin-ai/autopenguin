import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar } from 'lucide-react';

interface BookingsWidgetProps {
  filters?: Record<string, any>;
}

function getBookingStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export function BookingsWidget({ filters }: BookingsWidgetProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // bookings table with talent join
      let query = supabase
        .from('bookings')
        .select('id, booking_type, date, fee, status, talent_id, talent:talent_id(name), created_at')
        .eq('company_id', profile.company_id)
        .order('date', { ascending: false })
        .limit(10);

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.booking_type) query = query.eq('booking_type', filters.booking_type);

      const { data } = await query;
      setBookings(data || []);
      setLoading(false);
    }

    if (user) fetchBookings();
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
          <Calendar className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">Bookings</CardTitle>
          <Badge variant="secondary" className="ml-auto">{bookings.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                // talent comes from the join - could be object or null
                const talentName =
                  typeof b.talent === 'object' && b.talent?.name
                    ? b.talent.name
                    : '-';

                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium text-sm">
                      {talentName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {b.booking_type || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.date
                        ? new Date(b.date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {b.fee ? `$${Number(b.fee).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getBookingStatusClass(b.status)}>
                        {b.status || 'unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
