import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserCompany } from '@/hooks/useCompany';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, Trash2 } from 'lucide-react';

export function DeleteAccountDialog() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { data: userCompany } = useUserCompany();
  const navigate = useNavigate();
  
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const checkAdminCount = async () => {
    if (!userCompany?.id) return;
    
    // Get all user IDs in this company
    const { data: companyProfiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('company_id', userCompany.id);
    
    if (!companyProfiles) return;
    
    const userIds = companyProfiles.map(p => p.user_id);
    
    // Count admins in those user IDs
    const { count, error } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN')
      .in('user_id', userIds);
    
    if (!error && count !== null) {
      setAdminCount(count);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: t('error'),
        description: t('pleaseTypeDelete'),
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      if (adminCount === 1) {
        // Single admin - delete account immediately via Edge Function
        const { error } = await supabase.functions.invoke('delete-user-account');
        
        if (error) throw error;
        
        toast({
          title: t('accountDeleted'),
          description: t('accountDeletedSuccessfully'),
        });
        
        await signOut();
        navigate('/');
      } else if (adminCount && adminCount > 1) {
        // Multiple admins - create deletion request
        const { error } = await supabase
          .from('deletion_requests')
          .insert({
            user_id: user!.id,
            company_id: userCompany!.id,
            status: 'PENDING',
          });
        
        if (error) throw error;
        
        toast({
          title: t('deletionRequestCreated'),
          description: t('deletionRequestCreatedDescription'),
        });
        
        setIsOpen(false);
      }
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setConfirmText('');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) {
        checkAdminCount();
        setConfirmText('');
      }
    }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="h-4 w-4 mr-2" />
          {t('deleteAccount')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>{t('dangerZone')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            {adminCount === 1 ? (
              <>
                <p className="font-semibold text-destructive">{t('singleAdminWarning')}</p>
                <p>{t('deleteAccountWarning1')}</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>{t('deleteAccountWarning2')}</li>
                  <li>{t('deleteAccountWarning3')}</li>
                  <li>{t('deleteAccountWarning4')}</li>
                </ul>
                <p className="font-semibold">{t('deleteAccountWarning5')}</p>
              </>
            ) : (
              <>
                <p>{t('multipleAdminsWarning')}</p>
                <p className="text-muted-foreground">{t('multipleAdminsWarningDescription')}</p>
              </>
            )}
            
            <div className="pt-2">
              <Label htmlFor="confirm-delete" className="text-foreground">
                {t('typeDeleteToConfirm')}
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-2 font-mono"
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={confirmText !== 'DELETE' || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? t('deleting') : t('deleteAccount')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
