/**
 * Strip zero-width and invisible unicode characters that can hide prompt injections.
 */
export function stripInvisibleChars(input: string): string {
  return input
    // Zero-width characters
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    // Zero-width no-break space, word joiner
    .replace(/[\u2060\u2061\u2062\u2063\u2064]/g, '')
    // Variation selectors (VS1-VS256)
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/[\uE0100-\uE01EF]/g, '')
    // Tag characters (used to hide text)
    .replace(/[\uE0001-\uE007F]/g, '')
    // Directional formatting characters
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    // Soft hyphen and other invisible formatters
    .replace(/[\u00AD\u034F\u061C\u180E]/g, '');
}

/**
 * Detect common prompt injection patterns.
 * Returns true if the input looks suspicious.
 */
export function detectInjectionPatterns(input: string): boolean {
  const normalized = input.toLowerCase();
  const patterns = [
    /ignore\s+(all\s+)?previous\s+(instructions|prompts)/,
    /ignore\s+(the\s+)?(above|system)/,
    /you\s+are\s+now\s+/,
    /new\s+instructions?\s*:/,
    /system\s*prompt\s*:/,
    /\[system\]/,
    /\[inst\]/,
    /<<\s*sys\s*>>/,
    /forget\s+(everything|all|your)\s+(above|previous|instructions)/,
    /do\s+not\s+follow\s+(the\s+)?(above|previous|system)/,
    /override\s+(system|instructions|rules)/,
    /jailbreak/,
    /DAN\s+mode/,
  ];
  return patterns.some(p => p.test(normalized));
}

/**
 * Sanitize user message before sending to LLM.
 * Strips invisible chars and logs if injection patterns detected.
 */
export function sanitizeUserMessage(message: string): { clean: string; flagged: boolean } {
  const clean = stripInvisibleChars(message).trim();
  const flagged = detectInjectionPatterns(clean);
  return { clean, flagged };
}
