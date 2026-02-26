import { useState } from 'react';
import { toast } from 'sonner';

export interface CompanySettings {
  timezone: string;
  currency: string;
}

const STORAGE_KEY = 'user-display-settings';
const DEFAULTS: CompanySettings = {
  timezone: 'Asia/Hong_Kong',
  currency: 'HKD',
};

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULTS;
  });

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success('Settings saved');
  };

  return {
    settings,
    isLoading: false,
    updateSettings,
  };
};
