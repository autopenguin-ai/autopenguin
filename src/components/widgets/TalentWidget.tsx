import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star } from 'lucide-react';

interface TalentWidgetProps {
  filters?: Record<string, any>;
}

function getAvailabilityBadgeClass(availability: string): string {
  switch (availability?.toLowerCase()) {
    case 'available':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'booked':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'on_hold':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export function TalentWidget({ filters }: TalentWidgetProps) {
  const { user } = useAuth();
  const [talent, setTalent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTalent() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // talent table was added via migration - not yet in generated types
      let query = supabase
        .from('talent' as any)
        .select('id, name, stage_name, category, availability, created_at')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (filters?.availability) query = query.eq('availability', filters.availability);
      if (filters?.category) query = query.eq('category', filters.category);

      const { data } = await query;
      setTalent((data as any[]) || []);
      setLoading(false);
    }

    if (user) fetchTalent();
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
          <Star className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">Talent</CardTitle>
          <Badge variant="secondary" className="ml-auto">{talent.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {talent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No talent found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Stage Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talent.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-sm">{t.name}</TableCell>
                  <TableCell className="text-sm">{t.stage_name || '-'}</TableCell>
                  <TableCell className="text-sm">{t.category || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getAvailabilityBadgeClass(t.availability)}>
                      {t.availability || 'unknown'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
