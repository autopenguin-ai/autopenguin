import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  MessageSquare,
  TrendingUp,
  FileText,
  Clock,
  Target,
  DollarSign,
  ArrowUpRight,
  Zap,
  Building2,
  UserPlus,
  Calendar,
  Activity,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AddProjectDialog from '@/components/AddProjectDialog';
import AddClientDialog from '@/components/AddClientDialog';
import { CreateWorkItemDialog } from '@/components/CreateWorkItemDialog';
import { RequestAutomationDialog } from '@/components/RequestAutomationDialog';
import { useHasN8nIntegration } from '@/hooks/useHasN8nIntegration';
import { useActiveWorkflows } from '@/hooks/useN8nData';
import { RevenueChart } from '@/components/RevenueChart';
import { useSeparatedMetrics } from '@/hooks/useRevenueData';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { WelcomeBanner } from '@/components/WelcomeBanner';
import { useIndustry } from '@/contexts/IndustryContext';

export default function Dashboard() {
  const { userRole, userProfile } = useAuth();
  const { config: industryConfig } = useIndustry();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { data: company } = useUserCompany();
  
  // Dialog states
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  
  // Fetch separated metrics data
  const { data: separatedMetrics, isLoading: metricsLoading } = useSeparatedMetrics();
  const { data: hasN8nIntegration, isLoading: integrationLoading } = useHasN8nIntegration();
  
  // Only fetch workflows if integration exists
  const { data: activeWorkflows, isLoading: runsLoading } = useActiveWorkflows({
    enabled: hasN8nIntegration === true
  });

  // Silent one-time backfill of notification messages
  useEffect(() => {
    if (!company?.id) return;
    
    const flagKey = `ap_steve_backfill_v2_${company.id}`;
    const hasRun = localStorage.getItem(flagKey);
    
    if (hasRun) return;
    
    const runBackfill = async () => {
      try {
        const language = i18n.language.startsWith('zh') ? 'zh' : 'en';
        await supabase.functions.invoke('backfill-steve-notification-messages', {
          body: { language }
        });
        
        localStorage.setItem(flagKey, 'true');
        queryClient.invalidateQueries({ queryKey: ['steve-notifications', company.id] });
      } catch (error) {
        console.error('Backfill error:', error);
      }
    };
    
    runBackfill();
  }, [company?.id, i18n.language, queryClient]);

  // Use separated data for manual vs automated metrics
  const isRealEstate = industryConfig.kpis.includes('viewings_booked');
  const kpiData = {
    newLeads: { value: separatedMetrics?.newLeads ?? 0, change: '+0%', period: 'manual leads' },
    viewingsBooked: { value: separatedMetrics?.viewingsBooked ?? 0, change: '+0%', period: 'manual bookings' },
    automationLeads: { value: separatedMetrics?.automationLeads ?? 0, change: '+0%', period: 'automated leads' },
    automationViewings: { value: separatedMetrics?.automationViewings ?? 0, change: '+0%', period: 'automated bookings' },
    dealsWon: { value: separatedMetrics?.dealsWon ?? 0, change: '+0%', period: 'last 30 days' },
    ticketsOpen: { value: separatedMetrics?.ticketsOpen ?? 0, change: '+0%', period: 'vs last week' },
    avgResponseTime: { value: separatedMetrics?.avgResponseTime ?? '0h', change: '+0%', period: 'average' },
    ticketsAutoClosed: { value: separatedMetrics?.ticketsAutoClosed ?? 0, change: '+0%', period: 'this week' },
    activeProjects: { value: separatedMetrics?.activeProjects ?? 0, change: '+0%', period: 'active now' },
    tasksDue: { value: separatedMetrics?.tasksDue ?? 0, change: '+0%', period: 'this week' },
  };

  // Transform active workflows for display
  const recentAutomationRuns = activeWorkflows?.slice(0, 3).map((workflow, index) => ({
    id: workflow.id || index,
    workflow: workflow.name || `Workflow ${index + 1}`,
    status: workflow.is_active ? 'ACTIVE' : 'INACTIVE',
    time: workflow.last_synced_at ? formatTimeAgo(workflow.last_synced_at) : 'Unknown time',
    outcome: workflow.is_active ? 'Running and ready' : 'Inactive'
  })) || [
    { id: 1, workflow: 'Lead Qualification Bot', status: 'ACTIVE', time: '5 mins ago', outcome: 'Running and ready' },
    { id: 2, workflow: 'Property Alert Sender', status: 'ACTIVE', time: '12 mins ago', outcome: 'Running and ready' },
    { id: 3, workflow: 'Follow-up Scheduler', status: 'INACTIVE', time: '15 mins ago', outcome: 'Inactive' },
  ];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'INACTIVE': return 'bg-gray-500';
      case 'SUCCESS': return 'bg-green-500';
      case 'RUNNING': return 'bg-blue-500';
      case 'ERROR': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-${isMobile ? '4' : '6'}`}>
      {/* Welcome Banner for first-time users */}
      <WelcomeBanner />
      
      {/* Header */}
      <div className={`flex items-center ${isMobile ? 'flex-col gap-4' : 'justify-between'}`}>
        <div className={isMobile ? 'text-center' : ''}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight`}>{t('dashboard')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('welcome-back')}{userProfile?.first_name ? `, ${userProfile.first_name}` : ''}! {t('dashboard-welcome-message')}
          </p>
        </div>
        
        {/* Quick Actions */}
        <TooltipProvider>
          <div className="flex gap-2 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" onClick={() => setPropertyOpen(true)} variant="outline">
                  <Building2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('add-property')}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" onClick={() => setClientOpen(true)} variant="outline">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('add-client')}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" onClick={() => setTaskOpen(true)} variant="outline">
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('create-task')}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" onClick={() => setAutomationOpen(true)} variant="outline">
                  <Zap className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('request-automation')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* N8N Integration Warning */}
      {!hasN8nIntegration && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">{t('n8n-integration-required')}</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            {t('connect-n8n-to-view-metrics')}
            <Button variant="link" className="ml-2 p-0 h-auto text-amber-900 dark:text-amber-100 underline" onClick={() => navigate('/settings?tab=integrations')}>
              {t('configure-integration')} →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Top Row KPI Cards */}
      <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('new-leads')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.newLeads.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{kpiData.newLeads.change}</span> {t('manual-leads')}
            </p>
          </CardContent>
        </Card>

        {isRealEstate ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('viewings-booked')}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.viewingsBooked.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{kpiData.viewingsBooked.change}</span> {t('manual-bookings')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('active-projects')}</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.activeProjects.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{kpiData.activeProjects.change}</span> {t('active-now')}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('automation-leads')}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.automationLeads.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{kpiData.automationLeads.change}</span> {t('automated-leads')}
            </p>
          </CardContent>
        </Card>

        {isRealEstate ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('automation-viewings')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.automationViewings.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{kpiData.automationViewings.change}</span> {t('automated-bookings')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('tasks-due')}</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.tasksDue.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{kpiData.tasksDue.change}</span> {t('this-week')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Secondary KPI Cards */}
      <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('deals-won')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.dealsWon.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{kpiData.dealsWon.change}</span> {t('last-30-days')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('open-tickets')}</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.ticketsOpen.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{kpiData.ticketsOpen.change}</span> {t('vs-last-week')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('avg-response-time')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.avgResponseTime.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{kpiData.avgResponseTime.change}</span> {t('average')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('auto-closed-tickets')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.ticketsAutoClosed.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{kpiData.ticketsAutoClosed.change}</span> {t('this-week')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Automation Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('latest-automation-runs')}</CardTitle>
            <CardDescription>{t('automation-description')}</CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate('/automations')}>
            {t('view-all')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAutomationRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(run.status)}`} />
                  <div>
                    <p className="font-medium">{run.workflow}</p>
                    <p className="text-sm text-muted-foreground">{run.outcome}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={run.status === 'ACTIVE' ? 'default' : run.status === 'SUCCESS' ? 'default' : run.status === 'RUNNING' ? 'secondary' : 'destructive'}>
                    {run.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{run.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AddProjectDialog
        open={propertyOpen}
        onOpenChange={setPropertyOpen}
      />
      
      <AddClientDialog
        open={clientOpen}
        onOpenChange={setClientOpen}
      />
      
      <CreateWorkItemDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
      />
      
      <RequestAutomationDialog
        open={automationOpen}
        onOpenChange={setAutomationOpen}
      />
    </div>
  );
}