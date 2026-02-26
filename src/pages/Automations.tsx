import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader, Plus, Activity, Clock, CheckCircle, XCircle, AlertCircle, Zap, Bot, Boxes } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveWorkflows, useWorkflowMetrics } from '@/hooks/useN8nData';
import { useWorkflowToggle } from '@/hooks/useWorkflowToggle';
import { useHasN8nIntegration } from '@/hooks/useHasN8nIntegration';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';


export default function Automations() {
  const { data: hasN8nIntegration, isLoading: integrationLoading } = useHasN8nIntegration();
  const [timeRange, setTimeRange] = useState<number | null>(7);
  
  // Only fetch workflows and metrics if integration exists
  const { data: activeWorkflows, isLoading, error, isRefetching } = useActiveWorkflows({
    enabled: hasN8nIntegration === true
  });
  const { data: metrics, isLoading: metricsLoading } = useWorkflowMetrics({
    enabled: hasN8nIntegration === true,
    windowDays: timeRange
  });
  
  const { data: company } = useUserCompany();
  const { user, userProfile } = useAuth();
  const toggleWorkflowMutation = useWorkflowToggle();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    automationType: '',
    description: '',
    priority: 'Medium'
  });

  const getTimeRangeLabel = () => {
    if (timeRange === null) return t('all-time');
    if (timeRange === 7) return t('past-7-days');
    if (timeRange === 30) return t('past-30-days');
    if (timeRange === 365) return t('past-year');
    return `${timeRange} days`;
  };

  const handleWorkflowToggle = (workflowId: string, currentStatus: boolean) => {
    toggleWorkflowMutation.mutate({
      workflowId,
      currentStatus
    });
  };

  function formatTimeAgo(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return t('just-now');
    if (minutes < 60) return `${minutes} ${t('mins-ago')}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t('hours-ago')}`;
    
    const days = Math.floor(hours / 24);
    return `${days} ${t('days-ago')}`;
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!company?.id || !user?.email) {
        toast({
          title: t('error-sending-request'),
          description: t('try-again-contact-support'),
          variant: 'destructive',
        });
        return;
      }

      const userName = `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'User';

      // Use the Supabase edge function for automation requests
      const { error } = await supabase.functions.invoke('send-automation-request', {
        body: {
          user_email: user.email,
          name: userName,
          automationType: formData.automationType,
          description: formData.description,
          priority: formData.priority,
          company_id: company.id,
        },
      });

      if (error) throw error;

      toast({
        title: t('request-submitted-successfully'),
        description: t('request-sent-description'),
      });

      setFormData({
        automationType: '',
        description: '',
        priority: 'Medium'
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: t('error-sending-request'),
        description: t('try-again-contact-support'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="automations" className="w-full">
        <TabsList>
          <TabsTrigger value="automations"><Zap className="h-4 w-4 mr-2" />Automations</TabsTrigger>
          <TabsTrigger value="subagents" disabled><Bot className="h-4 w-4 mr-2" />Sub-Agents</TabsTrigger>
          <TabsTrigger value="swarms" disabled><Boxes className="h-4 w-4 mr-2" />Swarms</TabsTrigger>
        </TabsList>
        <TabsContent value="automations" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">MyAgents</h1>
              {isRefetching && <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />}
            </div>
            <p className="text-muted-foreground">
              {t('monitor-active-workflows')}
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('request-new-automation')}
          </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Input
            placeholder={t('search-workflows')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* N8N Integration Warning */}
      {!integrationLoading && hasN8nIntegration === false && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">{t('n8n-integration-required')}</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            {t('connect-n8n-to-manage-workflows')}
            <Button variant="link" className="ml-2 p-0 h-auto text-amber-900 dark:text-amber-100 underline" onClick={() => navigate('/settings?tab=integrations')}>
              {t('configure-integration')} →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Time Range Filter */}
      <div className="flex justify-end mb-4">
        <Select 
          value={timeRange?.toString() ?? 'null'} 
          onValueChange={(value) => setTimeRange(value === 'null' ? null : parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t('past-7-days')}</SelectItem>
            <SelectItem value="30">{t('past-30-days')}</SelectItem>
            <SelectItem value="365">{t('past-year')}</SelectItem>
            <SelectItem value="null">{t('all-time')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('active-workflows')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? (
                <span className="text-muted-foreground">...</span>
              ) : metrics?.activeWorkflows !== undefined ? (
                metrics.activeWorkflows
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('currently-running-workflows')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('successful-executions')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metricsLoading ? (
                <span className="text-muted-foreground">...</span>
              ) : metrics?.successfulExecutions !== undefined ? (
                metrics.successfulExecutions
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {getTimeRangeLabel()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('failed-executions')}</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metricsLoading ? (
                <span className="text-muted-foreground">...</span>
              ) : metrics?.failedExecutions !== undefined ? (
                metrics.failedExecutions
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {getTimeRangeLabel()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dialog for Creating New Automation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('request-new-automation')}</DialogTitle>
            <DialogDescription>
              {t('tell-us-about-automation')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="automationType">{t('automation-type')}</Label>
              <Input
                id="automationType"
                placeholder={t('automation-type-placeholder')}
                value={formData.automationType}
                onChange={(e) => setFormData({...formData, automationType: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                placeholder={t('description-placeholder')}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    {t('sending')}
                  </>
                ) : (
                  t('send-request')
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Active Workflows Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('active-workflows')}
            {isRefetching && <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />}
          </CardTitle>
          <CardDescription>
            {t('monitor-status-workflows')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('error-loading-workflows')}</p>
              <p className="text-sm text-red-500 mt-2">{error?.message}</p>
            </div>
          ) : activeWorkflows?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('no-active-workflows')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('workflows-will-appear')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeWorkflows
                ?.filter((workflow) =>
                  workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((workflow) => (
                <div key={workflow.id} className={`flex items-start space-x-4 p-4 border rounded-lg ${workflow.is_active ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {workflow.name}
                      </p>
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={() => handleWorkflowToggle(workflow.n8n_workflow_id, workflow.is_active)}
                        disabled={toggleWorkflowMutation.isPending}
                      />
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {workflow.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-muted-foreground space-x-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t('last-synced')}: {formatTimeAgo(workflow.last_synced_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        <TabsContent value="subagents">
          <div className="text-center py-20 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Sub-Agents</p>
            <p className="text-sm">Create custom AI agents with specific instructions and tools. Coming soon.</p>
          </div>
        </TabsContent>
        <TabsContent value="swarms">
          <div className="text-center py-20 text-muted-foreground">
            <Boxes className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Agent Swarms</p>
            <p className="text-sm">Coordinate groups of agents to complete complex tasks. Coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}