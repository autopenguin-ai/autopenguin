const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter for edge functions.
 * Returns true if the request should be allowed, false if rate limited.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Get client IP from request headers (works behind Cloudflare/proxies).
 */
export function getClientIp(req: Request): string {
  return req.headers.get('cf-connecting-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}

/**
 * Return a 429 Too Many Requests response.
 */
export function rateLimitResponse(headers: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    { status: 429, headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}
