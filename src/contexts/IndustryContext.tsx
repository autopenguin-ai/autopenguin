import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface IndustryConfig {
  displayName: string;
  projectLabel: string;
  projectTypes: string[];
  projectStatuses: string[];
  showMaintenanceTab: boolean;
  kpis: string[];
  dealsWonStatuses: string[];
  visiblePages: string[];
}

const DEFAULT_PAGES = ['dashboard', 'contacts', 'tasks', 'projects', 'finance', 'bookings', 'automations'];

const DEFAULT_CONFIG: IndustryConfig = {
  displayName: 'Project Management',
  projectLabel: 'Project',
  projectTypes: ['SOFTWARE', 'MARKETING', 'DESIGN', 'CONSULTING', 'OPERATIONS'],
  projectStatuses: ['AVAILABLE', 'IN_PROGRESS', 'ON_HOLD', 'WON', 'COMPLETED', 'CANCELLED'],
  showMaintenanceTab: false,
  kpis: ['new_leads', 'active_projects', 'tasks_due', 'deals_won'],
  dealsWonStatuses: ['WON', 'COMPLETED'],
  visiblePages: DEFAULT_PAGES,
};

export const INDUSTRY_CONFIG: Record<string, IndustryConfig> = {
  talent_agency: {
    displayName: 'Social Media / Talent Agency',
    projectLabel: 'Project',
    projectTypes: ['CAMPAIGN', 'PHOTOSHOOT', 'VIDEO', 'EVENT', 'COLLABORATION'],
    projectStatuses: ['AVAILABLE', 'IN_PROGRESS', 'ON_HOLD', 'WON', 'COMPLETED', 'CANCELLED'],
    showMaintenanceTab: false,
    kpis: ['new_leads', 'active_projects', 'tasks_due', 'deals_won'],
    dealsWonStatuses: ['WON', 'COMPLETED'],
    visiblePages: [...DEFAULT_PAGES, 'talent'],
  },
  real_estate: {
    displayName: 'Real Estate',
    projectLabel: 'Property',
    projectTypes: ['APARTMENT', 'VILLA', 'HOUSE', 'CONDO', 'LAND'],
    projectStatuses: ['AVAILABLE', 'RENTED', 'SOLD', 'PENDING'],
    showMaintenanceTab: true,
    kpis: ['new_leads', 'viewings_booked', 'automation_leads', 'deals_won'],
    dealsWonStatuses: ['RENTED', 'SOLD'],
    visiblePages: DEFAULT_PAGES,
  },
  default: DEFAULT_CONFIG,
};

interface IndustryContextType {
  industry: string | null;
  config: IndustryConfig;
}

const IndustryContext = createContext<IndustryContextType>({
  industry: null,
  config: DEFAULT_CONFIG,
});

export function IndustryProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const industry = userProfile?.industry ?? null;
  const config = (industry && INDUSTRY_CONFIG[industry]) || DEFAULT_CONFIG;

  return (
    <IndustryContext.Provider value={{ industry, config }}>
      {children}
    </IndustryContext.Provider>
  );
}

export function useIndustry() {
  return useContext(IndustryContext);
}
