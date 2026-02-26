import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, Shield, Key, Bell, Calendar, Building2 } from 'lucide-react';
import { TwoFactorDialog } from '@/components/TwoFactorDialog';
import { useTranslation } from 'react-i18next';
import { useUserCompany } from '@/hooks/useCompany';

export default function Profile() {
  const { user, userRole, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: userCompany } = useUserCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [companyName, setCompanyName] = useState('');
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userCompany) {
      setCompanyName(userCompany.display_name || userCompany.name);
    }
  }, [userCompany]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      
      setUserProfile(data);
      setProfileData(prev => ({
        ...prev,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || user?.email || '',
        phone: data.phone || ''
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    weeklyReports: true
  });

  const [pushPermissionGranted, setPushPermissionGranted] = useState(false);

  // Load notification preferences from database
  useEffect(() => {
    if (userProfile) {
      setNotifications(prev => ({
        ...prev,
        pushNotifications: userProfile.notify_push !== false, // default true
      }));
    }
  }, [userProfile]);

  // Check push notification permission status
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { hasNotificationPermission } = await import('@/lib/browserNotifications');
        const granted = hasNotificationPermission();
        setPushPermissionGranted(granted);
      } catch (error) {
        console.error('Error checking push permission:', error);
      }
    };
    checkPermission();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: "Your profile information has been saved successfully.",
      });
      await fetchUserProfile();
      await refreshProfile();
    } catch (error) {
      toast({
        title: t('error'),
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (profileData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: profileData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveNotificationSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          notify_push: notifications.pushNotifications,
        })
        .eq('user_id', user?.id);
      
      if (error) throw error;

      toast({
        title: t('success'),
        description: t('notification-preferences-updated'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: "Failed to save notification settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyNameUpdate = async () => {
    if (!userCompany?.id || !companyName.trim()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ display_name: companyName.trim() })
        .eq('id', userCompany.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('company-name-updated'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed-to-update-company'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'EMPLOYEE': return 'bg-blue-100 text-blue-800';
      case 'FREELANCER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handle2FAClick = () => {
    setShow2FADialog(true);
  };

  const handle2FASuccess = async () => {
    await fetchUserProfile();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{profileData.firstName} {profileData.lastName}</h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className={getRoleColor(userRole || 'EMPLOYEE')}>
              {userRole}
            </Badge>
            <div className="flex items-center text-muted-foreground">
              <Mail className="h-4 w-4 mr-1" />
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('personal-information')}</CardTitle>
            <CardDescription>{t('profile-settings')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('first-name')}</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('last-name')}</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('loading') : t('update-profile')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('change-password')}</CardTitle>
            <CardDescription>{t('security-settings')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('current-password')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('new-password')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirm-password')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('loading') : t('update-password')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('notification-preferences')}</CardTitle>
            <CardDescription>{t('notification-preferences-desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{t('email-alerts')}</Label>
                  <div className="text-sm text-muted-foreground">
                    {t('email-alerts-desc')}
                  </div>
                </div>
                <Switch
                  checked={notifications.emailAlerts}
                  onCheckedChange={() => handleNotificationChange('emailAlerts')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{t('sms-alerts')}</Label>
                  <div className="text-sm text-muted-foreground">
                    {t('sms-alerts-desc')}
                  </div>
                </div>
                <Switch
                  checked={notifications.smsAlerts}
                  onCheckedChange={() => handleNotificationChange('smsAlerts')}
                />
              </div>
              
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Push Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Master toggle for all push notifications
                      {!pushPermissionGranted && (
                        <span className="block mt-1 text-xs text-orange-600">
                          {t('push-permission-required')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={() => handleNotificationChange('pushNotifications')}
                  />
                </div>
                
                {notifications.pushNotifications && (
                  <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
                    <div className="text-sm text-muted-foreground">
                      Get notified when:
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Chat replies from assistant</Label>
                      <span className="text-xs text-muted-foreground">Always on</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Workflow suggestions need review</Label>
                      <span className="text-xs text-muted-foreground">Always on</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{t('weekly-reports')}</Label>
                  <div className="text-sm text-muted-foreground">
                    {t('weekly-reports-desc')}
                  </div>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={() => handleNotificationChange('weeklyReports')}
                />
              </div>
            </div>
            
            <Button onClick={saveNotificationSettings} disabled={isLoading}>
              {isLoading ? t('loading') : t('save-preferences')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('account-information')}</CardTitle>
            <CardDescription>{t('account-details')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('account-role')}</span>
              </div>
              <Badge className={getRoleColor(userRole || 'EMPLOYEE')}>
                {userRole}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('member-since')}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('company')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-8 text-sm max-w-[200px]"
                  placeholder={t('company-name')}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCompanyNameUpdate}
                  disabled={isLoading || !companyName.trim() || companyName === (userCompany?.display_name || userCompany?.name)}
                >
                  {t('save')}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('two-factor-auth')}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handle2FAClick}>
                {userProfile?.two_factor_enabled ? t('disable-2fa') : t('enable-2fa')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <TwoFactorDialog
        open={show2FADialog}
        onOpenChange={setShow2FADialog}
        isEnabled={userProfile?.two_factor_enabled || false}
        onSuccess={handle2FASuccess}
      />
    </div>
  );
}