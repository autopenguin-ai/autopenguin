import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { UserPlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  status: string | null;
  role: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const INVITE_ROLES = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE'] as const;

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500 text-white',
  ADMIN: 'bg-blue-500 text-white',
  MANAGER: 'bg-green-500 text-white',
  ACCOUNTANT: 'bg-yellow-500 text-white',
  EMPLOYEE: 'bg-gray-500 text-white',
  FREELANCER: 'bg-orange-500 text-white',
};

export function TeamManagement() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('EMPLOYEE');
  const [inviting, setInviting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchCompanyId = useCallback(async () => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching company ID:', error);
      return null;
    }

    return data?.company_id || null;
  }, [user?.id]);

  const fetchMembers = useCallback(async (cId: string) => {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email, first_name, last_name, is_active, status')
      .eq('company_id', cId);

    if (profileError) {
      console.error('Error fetching team members:', profileError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      setMembers([]);
      return;
    }

    const memberIds = profiles.map((p) => p.user_id);

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', memberIds);

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    const roleMap = new Map<string, string>();
    roles?.forEach((r) => roleMap.set(r.user_id, r.role));

    const combined: TeamMember[] = profiles.map((p) => ({
      user_id: p.user_id,
      email: p.email,
      first_name: p.first_name,
      last_name: p.last_name,
      is_active: p.is_active,
      status: p.status,
      role: roleMap.get(p.user_id) || null,
    }));

    setMembers(combined);
  }, []);

  const fetchInvitations = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('manage-invitations', {
      body: { action: 'list' },
    });

    if (error) {
      console.error('Error fetching invitations:', error);
      return;
    }

    setInvitations(data?.invitations || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const cId = await fetchCompanyId();
    setCompanyId(cId);

    if (cId) {
      await Promise.all([fetchMembers(cId), fetchInvitations()]);
    }

    setLoading(false);
  }, [fetchCompanyId, fetchMembers, fetchInvitations]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) return;

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-invitations', {
        body: {
          action: 'invite',
          email: inviteEmail,
          role: inviteRole,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Invitation failed',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${inviteEmail}. Code: ${data?.invitation_code}`,
      });

      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('EMPLOYEE');
      await fetchInvitations();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingId(invitationId);
    try {
      const { data, error } = await supabase.functions.invoke('manage-invitations', {
        body: {
          action: 'cancel',
          invitation_id: invitationId,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled.',
      });

      await fetchInvitations();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel invitation',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', memberId);

      if (error) throw error;

      toast({
        title: 'Role updated',
        description: `Member role has been changed to ${newRole}.`,
      });

      if (companyId) {
        await fetchMembers(companyId);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const getMemberDisplayName = (member: TeamMember) => {
    if (member.first_name || member.last_name) {
      return `${member.first_name || ''} ${member.last_name || ''}`.trim();
    }
    return member.email;
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team and invite new members</CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Members Table */}
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">
                      {getMemberDisplayName(member)}
                      {member.user_id === user?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {member.user_id === user?.id ? (
                        <Badge className={ROLE_COLORS[member.role || ''] || 'bg-gray-500 text-white'}>
                          {member.role || 'No role'}
                        </Badge>
                      ) : (
                        <Select
                          value={member.role || ''}
                          onValueChange={(value) => handleRoleChange(member.user_id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue>
                              <Badge className={ROLE_COLORS[member.role || ''] || 'bg-gray-500 text-white'}>
                                {member.role || 'No role'}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {INVITE_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Active' : (member.status || 'Inactive')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Pending Invitations</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[inv.role] || 'bg-gray-500 text-white'}>
                          {inv.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(inv.id)}
                          disabled={cancellingId === inv.id}
                        >
                          {cancellingId === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
              {inviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
