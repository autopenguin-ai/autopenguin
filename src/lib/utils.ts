import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'HKD'): string {
  return new Intl.NumberFormat('en-HK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrencySymbol(currency: string = 'HKD'): string {
  return new Intl.NumberFormat('en-HK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(0).find(part => part.type === 'currency')?.value || '$';
}
