import { LayoutDashboard, Users, CheckSquare, Home, Briefcase, DollarSign, Calendar, HelpCircle } from 'lucide-react';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useTranslation } from 'react-i18next';
import { useIndustry } from '@/contexts/IndustryContext';
import { useAuth } from '@/hooks/useAuth';

export interface SlashCommand {
  command: string;
  label: string;
  description: string;
  icon: React.ElementType;
  /** Page name to open as overlay, or null for non-overlay commands like /help */
  overlayPage: string | null;
  message: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/dashboard',
    label: 'Dashboard',
    description: 'Show dashboard overview',
    icon: LayoutDashboard,
    overlayPage: 'dashboard',
    message: 'Show me the dashboard',
  },
  {
    command: '/contacts',
    label: 'Contacts',
    description: 'Show contacts list',
    icon: Users,
    overlayPage: 'contacts',
    message: 'Show contacts',
  },
  {
    command: '/tasks',
    label: 'Tasks',
    description: 'Show tasks overview',
    icon: CheckSquare,
    overlayPage: 'tasks',
    message: 'Show tasks',
  },
  {
    command: '/projects',
    label: 'Projects',
    description: 'Show projects list',
    icon: Home,
    overlayPage: 'projects',
    message: 'Show projects',
  },
  {
    command: '/talent',
    label: 'Talent',
    description: 'Show talent pool',
    icon: Briefcase,
    overlayPage: 'talent',
    message: 'Show talent',
  },
  {
    command: '/finance',
    label: 'Finance',
    description: 'Show finance overview',
    icon: DollarSign,
    overlayPage: 'finance',
    message: 'Show finance',
  },
  {
    command: '/bookings',
    label: 'Bookings',
    description: 'Show bookings calendar',
    icon: Calendar,
    overlayPage: 'bookings',
    message: 'Show bookings',
  },
  {
    command: '/help',
    label: 'Help',
    description: 'Show available commands',
    icon: HelpCircle,
    overlayPage: null,
    message: '/help',
  },
];

interface SlashCommandBarProps {
  filter: string;
  onSelect: (command: SlashCommand) => void;
}

export function SlashCommandBar({ filter, onSelect }: SlashCommandBarProps) {
  const { t } = useTranslation();
  const { config } = useIndustry();
  const { userRole } = useAuth();

  // Filter commands based on what user typed after /
  const filterText = filter.startsWith('/') ? filter.slice(1).toLowerCase() : filter.toLowerCase();

  // Filter by industry visibility first, then by user's text input
  const filtered = SLASH_COMMANDS.filter((cmd) => {
    if (!cmd.overlayPage) return true;
    if (userRole === 'SUPER_ADMIN') return true;
    return config.visiblePages.includes(cmd.overlayPage);
  }).filter(
    (cmd) =>
      cmd.command.toLowerCase().includes(filterText) ||
      cmd.label.toLowerCase().includes(filterText)
  );

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
      <Command className="rounded-lg border border-border shadow-lg bg-popover">
        <CommandList>
          <CommandGroup heading={t('commands', 'Commands')}>
            {filtered.map((cmd) => (
              <CommandItem
                key={cmd.command}
                value={cmd.command}
                onSelect={() => onSelect(cmd)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer"
              >
                <cmd.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{cmd.command}</span>
                  <span className="text-xs text-muted-foreground">{cmd.description}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

export { SLASH_COMMANDS };
