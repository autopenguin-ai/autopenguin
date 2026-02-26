import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIndustry } from '@/contexts/IndustryContext';
import { useAutomationPush } from '@/hooks/useAutomationPush';
import { Button } from '@/components/ui/button';
import { ReviewDialog } from '@/components/ReviewDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { AIAssistantSidebar, AIAssistantToggle } from '@/components/AIAssistantSidebar';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import penguinLogoDark from '@/assets/autopenguin-logo-dark.png';
import penguinLogoLight from '@/assets/autopenguin-logo-light.png';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  CheckSquare,
  Settings,
  Workflow,
  LogOut,
  User,
  Zap,
  Star,
  Store,
  Bug,
  MessageSquare,
  Briefcase,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SteveNotificationBell } from '@/components/steve/SteveNotificationBell';
import { ReportBugDialog } from '@/components/ReportBugDialog';

// Helper function to read sidebar state from cookie
function getSidebarCookie(): boolean {
  if (typeof document === 'undefined') return true;
  const cookies = document.cookie.split(';');
  const sidebarCookie = cookies.find(c => c.trim().startsWith('sidebar:state='));
  if (sidebarCookie) {
    return sidebarCookie.split('=')[1] === 'true';
  }
  return true; // default to expanded
}

// Helper function to check admin-level access
function hasAdminAccess(userRole: string | null): boolean {
  return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
}

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, userRole, signOut } = useAuth();
  useAutomationPush(); // Enable client-side OS push for automations
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(isMobile);
  const [defaultSidebarOpen] = useState(() => getSidebarCookie());
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { config } = useIndustry();

  const allNavItems = [
    { icon: MessageSquare, label: 'Chat', path: '/chat', pageKey: 'chat' },
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard', pageKey: 'dashboard' },
    { icon: Home, label: config.projectLabel + 's', path: '/projects', pageKey: 'projects' },
    { icon: Users, label: t('contacts'), path: '/clients', pageKey: 'contacts' },
    { icon: CheckSquare, label: t('tasks'), path: '/tasks', pageKey: 'tasks' },
    { icon: DollarSign, label: 'Finance', path: '/finance', pageKey: 'finance' },
    { icon: Calendar, label: 'Bookings', path: '/bookings', pageKey: 'bookings' },
    { icon: Briefcase, label: 'Talent', path: '/talent', pageKey: 'talent' },
    { icon: Zap, label: 'MyAgents', path: '/automations', pageKey: 'automations' },
  ];

  const navigationItems = allNavItems.filter(item =>
    item.pageKey === 'chat' || userRole === 'SUPER_ADMIN' || config.visiblePages.includes(item.pageKey)
  );

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center px-4 py-2">
              <div className="flex items-center space-x-3">
                <img 
                  src={theme === 'dark' ? penguinLogoLight : penguinLogoDark} 
                  alt="AutoPenguin Logo" 
                  className="h-8 w-8" 
                />
                <span className="font-semibold text-sidebar-foreground">AutoPenguin</span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/profile')}
                  className="w-full justify-start"
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.email}</span>
                    <span className="text-xs text-sidebar-foreground/60">{userRole}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <ReportBugDialog 
                  trigger={
                    <SidebarMenuButton className="w-full justify-start">
                      <Bug className="mr-2 h-4 w-4" />
                      {t('report-bug')}
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsReviewDialogOpen(true)}
                  className="w-full justify-start"
                >
                  <Star className="mr-2 h-4 w-4" />
                  {t('review')}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {hasAdminAccess(userRole) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/settings')}
                    isActive={isActive('/settings')}
                    className="w-full justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings')}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={signOut}
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('sign-out')}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        
        <ResizablePanelGroup direction="horizontal" className="flex-1 h-screen overflow-hidden">
          <ResizablePanel defaultSize={75} minSize={30}>
            <main className="flex flex-col h-screen">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="flex h-14 items-center justify-between px-4">
                  <SidebarTrigger />
                  <div className="flex items-center space-x-2">
                    <SteveNotificationBell />
                    <AIAssistantToggle onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)} />
                    <ThemeToggle />
                    <LanguageToggle />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </main>
          </ResizablePanel>
          
          {isAIAssistantOpen && <ResizableHandle withHandle />}
          
          {isAIAssistantOpen && (
            <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
              <AIAssistantSidebar 
                isOpen={isAIAssistantOpen}
                onClose={() => setIsAIAssistantOpen(false)}
              />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
      
      <ReviewDialog 
        open={isReviewDialogOpen} 
        onOpenChange={setIsReviewDialogOpen} 
      />
    </SidebarProvider>
  );
}