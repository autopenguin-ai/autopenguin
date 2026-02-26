/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape HTML and convert newlines to <br> for email body text.
 */
export function escapeHtmlWithBreaks(str: string): string {
  return escapeHtml(str).replace(/\n/g, '<br>');
}
