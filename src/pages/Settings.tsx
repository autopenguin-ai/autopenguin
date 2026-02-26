import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings as SettingsIcon, Monitor, ExternalLink, MessageSquare, Instagram, Twitter, Linkedin, Trash2, CheckCircle } from 'lucide-react';
import { OpenAIIcon, AnthropicIcon, OpenRouterIcon, MakeIcon, N8nIcon } from '@/components/icons/AIServiceIcons';
import { SupportDialog } from '@/components/SupportDialog';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { IntegrationManager } from '@/components/IntegrationManager';
import { TelegramIntegration } from '@/components/settings/TelegramIntegration';
import { LLMConnection } from '@/components/settings/LLMConnection';
import { TeamManagement } from '@/components/settings/TeamManagement';

export default function Settings() {
  const { t } = useTranslation();
  const { user, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [usageData, setUsageData] = useState({
    subscriptionPlan: 'free',
    userEmail: '',
    loading: true
  });
  const { settings: companySettings, updateSettings: updateCompanySettings } = useCompanySettings();
  
  // AI Integration states
  const [aiServices, setAiServices] = useState({
    openai: { apiKey: '', connected: false, testing: false },
    anthropic: { apiKey: '', connected: false, testing: false },
    openrouter: { apiKey: '', connected: false, testing: false },
    localLLM: { 
      apiKey: '', 
      chatAddress: 'http://localhost:1234/v1/chat/completions',
      modelsAddress: '',
      connected: false, 
      testing: false 
    },
    make: { apiKey: '', connected: false, testing: false },
    n8n: { apiKey: '', connected: false, testing: false }
  });

  const { toast: useToastHook } = useToast();

  // Personalization state
  const [assistantName, setAssistantName] = useState('Penguin');
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [memories, setMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [savingPersonalization, setSavingPersonalization] = useState(false);

  const [systemSettings, setSystemSettings] = useState({
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    autoBackup: true,
    defaultEmailNotifications: true,
    defaultSmsNotifications: false,
    defaultPushNotifications: true,
    defaultWeeklyReports: true
  });

  // Load system settings from database
  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value');
      
      if (error) throw error;
      
      const settings: any = {};
      data?.forEach(setting => {
        const key = setting.key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        settings[key] = setting.value === 'true' ? true : setting.value === 'false' ? false : setting.value;
      });
      
      setSystemSettings(prev => ({ ...prev, ...settings }));
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  useEffect(() => {
    loadSystemSettings();
    loadUsageData();
    loadPersonalization();

    // Check for payment success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      useToastHook({
        title: t('payment_success_message'),
      });
      // Clean up URL
      window.history.replaceState({}, '', '/settings?tab=plan');
      // Reload usage data to get updated subscription
      loadUsageData();
    }
  }, []);

  const loadUsageData = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, email')
        .eq('user_id', user?.id)
        .single();

      const userEmail = profile?.email || '';
      const plan = profile?.subscription_plan || 'free';

      setUsageData({
        subscriptionPlan: plan,
        userEmail,
        loading: false
      });
    } catch (error) {
      console.error('Error loading usage data:', error);
      setUsageData({ subscriptionPlan: 'free', userEmail: '', loading: false });
    }
  };

  const handleSystemSettingsChange = (key: string) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSystemSettings = async () => {
    setIsLoading(true);
    try {
      // Convert camelCase to snake_case for database keys
      const settingsToSave = [
        { key: 'email_notifications_enabled', value: systemSettings.emailNotificationsEnabled },
        { key: 'sms_notifications_enabled', value: systemSettings.smsNotificationsEnabled },
        { key: 'auto_backup', value: systemSettings.autoBackup },
        { key: 'default_email_notifications', value: systemSettings.defaultEmailNotifications },
        { key: 'default_sms_notifications', value: systemSettings.defaultSmsNotifications },
        { key: 'default_push_notifications', value: systemSettings.defaultPushNotifications },
        { key: 'default_weekly_reports', value: systemSettings.defaultWeeklyReports }
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({ 
            key: setting.key, 
            value: JSON.stringify(setting.value) 
          }, { onConflict: 'key' });
        
        if (error) throw error;
      }

      useToastHook({
        title: "Settings saved",
        description: "System settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving system settings:', error);
      useToastHook({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // AI Service functions - now with real API key storage
  const handleApiKeyChange = (service: string, field: string, value: string) => {
    setAiServices(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value
      }
    }));
  };

  const loadPersonalization = async () => {
    if (!user) return;
    const { data } = await (supabase
      .from('profiles') as any)
      .select('assistant_name, learning_enabled')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setAssistantName(data.assistant_name || 'Penguin');
      setLearningEnabled(data.learning_enabled !== false);
    }
  };

  const savePersonalization = async () => {
    if (!user) return;
    setSavingPersonalization(true);
    const { error } = await (supabase
      .from('profiles') as any)
      .update({ assistant_name: assistantName || 'Penguin', learning_enabled: learningEnabled })
      .eq('user_id', user.id);

    setSavingPersonalization(false);
    if (error) {
      useToastHook({ title: 'Error', description: 'Failed to save personalization.', variant: 'destructive' });
    } else {
      useToastHook({ title: 'Saved', description: 'Personalization updated.' });
    }
  };

  const loadMemories = async () => {
    if (!user) return;
    setLoadingMemories(true);
    const { data } = await (supabase
      .from('steve_knowledge_base') as any)
      .select('id, title, content, category, created_at, updated_at')
      .eq('user_id', user.id)
      .in('category', ['user_preference', 'user_fact', 'user_pattern', 'user_person', 'company_fact'])
      .order('updated_at', { ascending: false });

    setMemories(data || []);
    setLoadingMemories(false);
  };

  const deleteMemory = async (memoryId: string) => {
    const { error } = await supabase
      .from('steve_knowledge_base')
      .delete()
      .eq('id', memoryId);

    if (error) {
      useToastHook({ title: 'Error', description: 'Failed to delete memory.', variant: 'destructive' });
    } else {
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      useToastHook({ title: 'Deleted', description: 'Memory removed.' });
    }
  };

  const testConnection = async (service: string) => {
    setAiServices(prev => ({
      ...prev,
      [service]: { ...prev[service], testing: true }
    }));

    try {
      const apiKey = aiServices[service].apiKey;
      if (!apiKey) {
        throw new Error('API key is required');
      }

      // Test the actual API connection based on service
      let testUrl = '';
      let testPayload = {};
      let headers: Record<string, string> = {};

      switch (service) {
        case 'openai':
          testUrl = 'https://api.openai.com/v1/models';
          headers = { 'Authorization': `Bearer ${apiKey}` };
          break;
        case 'anthropic':
          testUrl = 'https://api.anthropic.com/v1/models';
          headers = { 
            'Authorization': `Bearer ${apiKey}`,
            'anthropic-version': '2023-06-01'
          };
          break;
        case 'openrouter':
          testUrl = 'https://openrouter.ai/api/v1/models';
          headers = { 'Authorization': `Bearer ${apiKey}` };
          break;
        case 'localLLM':
          testUrl = aiServices.localLLM.chatAddress.replace('/chat/completions', '/models');
          if (apiKey) headers = { 'Authorization': `Bearer ${apiKey}` };
          break;
        case 'make':
        case 'n8n':
          // For Make and N8N, we'll just validate the API key format
          // since they don't have a simple test endpoint
          if (!apiKey || apiKey.length < 10) {
            throw new Error('API key appears to be invalid');
          }
          // Skip actual test, mark as successful if key is provided
          setAiServices(prev => ({
            ...prev,
            [service]: { ...prev[service], connected: true, testing: false }
          }));
          
          useToastHook({
            title: "API Key validated",
            description: `${service.toUpperCase()} API key format is valid.`,
          });
          return;
        default:
          throw new Error('Unknown service');
      }

      const response = await fetch(testUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      setAiServices(prev => ({
        ...prev,
        [service]: { ...prev[service], connected: true, testing: false }
      }));
      
      useToastHook({
        title: "Connection successful",
        description: `${service.toUpperCase()} API connection established.`,
      });
    } catch (error) {
      setAiServices(prev => ({
        ...prev,
        [service]: { ...prev[service], connected: false, testing: false }
      }));
      
      useToastHook({
        title: "Connection failed",
        description: `Failed to connect to ${service.toUpperCase()} API: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const saveApiKey = async (service: string) => {
    try {
      const apiKey = aiServices[service].apiKey;
      if (!apiKey) {
        throw new Error('API key is required');
      }

      // Save to Supabase edge function that handles secrets
      const { data, error } = await supabase.functions.invoke('save-api-key', {
        body: { 
          service: service.toUpperCase(),
          apiKey,
          ...(service === 'localLLM' && {
            chatAddress: aiServices.localLLM.chatAddress,
            modelsAddress: aiServices.localLLM.modelsAddress
          })
        }
      });

      if (error) throw error;

      useToastHook({
        title: "API Key saved",
        description: `${service.toUpperCase()} API key has been saved securely.`,
      });
    } catch (error) {
      useToastHook({
        title: "Error",
        description: `Failed to save ${service.toUpperCase()} API key: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings')}</h1>
        <p className="text-muted-foreground">{t('manage-application-settings')}</p>
      </div>

        <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">{t('system-settings')}</TabsTrigger>
          <TabsTrigger value="plan">{t('plan_usage')}</TabsTrigger>
          <TabsTrigger value="integrations">{t('ai-integrations')}</TabsTrigger>
          {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
            <TabsTrigger value="team">Team</TabsTrigger>
          )}
          {userRole === 'SUPER_ADMIN' && (
            <TabsTrigger value="steve">Steve AI</TabsTrigger>
          )}
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="danger" className="text-destructive data-[state=active]:text-destructive">
            {t('dangerZone')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('system-configuration')}</CardTitle>
              <CardDescription>{t('configure-global-settings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timezone and Currency Settings */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">{t('timezone')}</Label>
                    <Select
                      value={companySettings.timezone}
                      onValueChange={(value) => updateCompanySettings({ timezone: value })}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Hong_Kong">Hong Kong (GMT+8)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                        <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                        <SelectItem value="Asia/Shanghai">Shanghai (GMT+8)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Los Angeles (GMT-8)</SelectItem>
                        <SelectItem value="America/Chicago">Chicago (GMT-6)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                        <SelectItem value="Europe/Berlin">Berlin (GMT+1)</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney (GMT+11)</SelectItem>
                        <SelectItem value="Pacific/Auckland">Auckland (GMT+13)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">{t('timezone-desc')}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('currency')}</Label>
                    <Select
                      value={companySettings.currency}
                      onValueChange={(value) => updateCompanySettings({ currency: value })}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HKD">HKD (HK$) - Hong Kong Dollar</SelectItem>
                        <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                        <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                        <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">{t('currency-desc')}</p>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('system-features')}</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{t('enable-email-notifications')}</Label>
                    <div className="text-sm text-muted-foreground">
                      {t('email-notifications-desc')}
                    </div>
                  </div>
                  <Switch
                    checked={systemSettings.emailNotificationsEnabled}
                    onCheckedChange={() => handleSystemSettingsChange('emailNotificationsEnabled')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{t('enable-sms-notifications')}</Label>
                    <div className="text-sm text-muted-foreground">
                      {t('sms-notifications-desc')}
                    </div>
                  </div>
                  <Switch
                    checked={systemSettings.smsNotificationsEnabled}
                    onCheckedChange={() => handleSystemSettingsChange('smsNotificationsEnabled')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{t('auto-backup')}</Label>
                    <div className="text-sm text-muted-foreground">
                      {t('auto-backup-desc')}
                    </div>
                  </div>
                  <Switch
                    checked={systemSettings.autoBackup}
                    onCheckedChange={() => handleSystemSettingsChange('autoBackup')}
                  />
                </div>
                
                <h3 className="text-lg font-medium mt-6">{t('default-settings-new-users')}</h3>
                <p className="text-sm text-muted-foreground">{t('default-settings-desc')}</p>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{t('default-email-notifications')}</Label>
                    <div className="text-sm text-muted-foreground">
                      {t('default-email-desc')}
                    </div>
                  </div>
                  <Switch
                    checked={systemSettings.defaultEmailNotifications}
                    onCheckedChange={() => handleSystemSettingsChange('defaultEmailNotifications')}
                    disabled={!systemSettings.emailNotificationsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{t('default-sms-notifications')}</Label>
                    <div className="text-sm text-muted-foreground">
                      {t('default-sms-desc')}
                    </div>
                  </div>
                  <Switch
                    checked={systemSettings.defaultSmsNotifications}
                    onCheckedChange={() => handleSystemSettingsChange('defaultSmsNotifications')}
                    disabled={!systemSettings.smsNotificationsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{t('default-push-notifications')}</Label>
                    <div className="text-sm text-muted-foreground">
                      {t('default-push-desc')}
                    </div>
                  </div>
                  <Switch
                    checked={systemSettings.defaultPushNotifications}
                    onCheckedChange={() => handleSystemSettingsChange('defaultPushNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{t('default-weekly-reports')}</Label>
                    <div className="text-sm text-muted-foreground">
                      {t('default-weekly-desc')}
                    </div>
                  </div>
                  <Switch
                    checked={systemSettings.defaultWeeklyReports}
                    onCheckedChange={() => handleSystemSettingsChange('defaultWeeklyReports')}
                  />
                </div>
              </div>
              
              <Button onClick={handleSaveSystemSettings} disabled={isLoading}>
                {isLoading ? t('saving') : t('save-settings')}
              </Button>
            </CardContent>
          </Card>

          {/* Links & Support */}
          <Card>
            <CardHeader>
              <CardTitle>{t('links-support')}</CardTitle>
              <CardDescription>{t('helpful-resources')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://autopenguin.app', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('services')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowSupportDialog(true)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('support')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://instagram.com/autopenguin.ai', '_blank')}
                >
                  <Instagram className="mr-2 h-4 w-4" />
                  {t('follow-instagram')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://x.com/autopenguin_ai', '_blank')}
                >
                  <Twitter className="mr-2 h-4 w-4" />
                  {t('follow-x')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://linkedin.com/company/autopenguin', '_blank')}
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  {t('follow-linkedin')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <SupportDialog 
            open={showSupportDialog} 
            onOpenChange={setShowSupportDialog} 
          />
        </TabsContent>

        {/* Plan & Usage Tab */}
        <TabsContent value="plan" className="space-y-6">
          {/* Plan Cards - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Starter Plan Card */}
            <div className={`p-6 border rounded-xl ${usageData.subscriptionPlan !== 'supporter' ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10' : 'bg-card'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{t('starter_plan')}</h3>
                  <p className="text-xl font-semibold text-muted-foreground">{t('free_plan')}</p>
                </div>
                {usageData.subscriptionPlan !== 'supporter' && (
                  <Badge variant="default" className="shrink-0">
                    {t('your_current_plan')}
                  </Badge>
                )}
              </div>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm">{t('plan_starter_features_1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm">{t('plan_starter_features_2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm">{t('plan_starter_features_3')}</span>
                </li>
              </ul>
            </div>

            {/* Supporter Plan Card */}
            <div className={`p-6 border-2 rounded-xl ${usageData.subscriptionPlan === 'supporter' ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10' : 'border-primary/50 bg-card'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{t('supporter_plan')} ❤️</h3>
                  <p className="text-xl font-semibold text-primary">$29{t('per_month')}</p>
                </div>
                {usageData.subscriptionPlan === 'supporter' && (
                  <Badge variant="default" className="shrink-0">
                    {t('your_current_plan')}
                  </Badge>
                )}
              </div>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm">{t('plan_supporter_features_1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm">{t('plan_supporter_features_3')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm">{t('plan_supporter_features_4')}</span>
                </li>
              </ul>
              
              {usageData.subscriptionPlan === 'supporter' ? (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const response = await supabase.functions.invoke('stripe-portal', {
                        headers: { Authorization: `Bearer ${session?.access_token}` }
                      });
                      if (response.error) throw response.error;
                      if (response.data?.url) {
                        window.location.href = response.data.url;
                      }
                    } catch (error) {
                      console.error('Portal error:', error);
                      useToastHook({
                        title: t('error'),
                        description: t('subscription_error'),
                        variant: 'destructive'
                      });
                    }
                  }}
                >
                  {t('manage_subscription')}
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => {
                    const paymentLink = 'https://buy.stripe.com/aFacN50HG4lt57HfHIcAo08';
                    const url = usageData.userEmail 
                      ? `${paymentLink}?prefilled_email=${encodeURIComponent(usageData.userEmail)}`
                      : paymentLink;
                    window.open(url, '_blank');
                  }}
                >
                  {t('become_supporter')} - $29/{t('month')}
                </Button>
              )}
            </div>
          </div>

        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <LLMConnection />
          <IntegrationManager />
          <TelegramIntegration />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamManagement />
        </TabsContent>

        {/* Steve AI Assistant */}
        <TabsContent value="steve" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Steve AI Knowledge Base</CardTitle>
              <CardDescription>
                Steve's knowledge base is automatically initialized with AutoPenguin product information and workflow examples.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The knowledge base is pre-populated and ready to help with AutoPenguin-related questions and workflow recommendations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Personalization Tab */}
        <TabsContent value="personalization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>Customize your AI assistant's name and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="assistant-name">Assistant Name</Label>
                <Input
                  id="assistant-name"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="Penguin"
                  maxLength={20}
                />
                <p className="text-sm text-muted-foreground">
                  Give your AI penguin a custom name. Default is "Penguin".
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Learn from conversations</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow your assistant to remember preferences and patterns from your conversations.
                  </div>
                </div>
                <Switch
                  checked={learningEnabled}
                  onCheckedChange={setLearningEnabled}
                />
              </div>

              <Button onClick={savePersonalization} disabled={savingPersonalization}>
                {savingPersonalization ? 'Saving...' : 'Save'}
              </Button>
            </CardContent>
          </Card>

          {/* Memories Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Memories</CardTitle>
                  <CardDescription>
                    Things your assistant has learned about you and your business
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadMemories} disabled={loadingMemories}>
                  {loadingMemories ? 'Loading...' : memories.length > 0 ? 'Refresh' : 'Load Memories'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {memories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {loadingMemories ? 'Loading...' : 'No memories yet. Your assistant will learn from your conversations over time.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {memories.map((memory) => (
                    <div key={memory.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{memory.title}</p>
                        <p className="text-sm text-muted-foreground">{memory.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {memory.category.replace('user_', '').replace('company_', '')} &middot; {new Date(memory.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMemory(memory.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
              </div>
              <CardDescription>
                {t('dangerZoneDescription') || 'Irreversible and destructive actions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteAccountDialog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}