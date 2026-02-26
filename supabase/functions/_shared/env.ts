/**
 * Shared environment helpers for edge functions.
 * Set APP_URL and EMAIL_FROM_DOMAIN in your environment.
 */

export function getAppUrl(): string {
  return Deno.env.get('APP_URL') || 'http://localhost:3000';
}

export function getEmailFrom(prefix: string = 'notifications'): string {
  const domain = Deno.env.get('EMAIL_FROM_DOMAIN') || 'localhost';
  return `AutoPenguin <${prefix}@${domain}>`;
}

export function getEmailAddress(prefix: string): string {
  const domain = Deno.env.get('EMAIL_FROM_DOMAIN') || 'localhost';
  return `${prefix}@${domain}`;
}

export function getSupportEmail(): string {
  return getEmailAddress(Deno.env.get('EMAIL_SUPPORT_PREFIX') || 'info');
}
