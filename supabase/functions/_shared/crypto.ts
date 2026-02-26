/**
 * Timing-safe string comparison that doesn't leak length information.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  // Pad to same length to avoid length leak
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = new Uint8Array(maxLen);
  const paddedB = new Uint8Array(maxLen);
  paddedA.set(bufA);
  paddedB.set(bufB);

  let mismatch = bufA.length !== bufB.length ? 1 : 0;
  for (let i = 0; i < maxLen; i++) {
    mismatch |= paddedA[i]! ^ paddedB[i]!;
  }
  return mismatch === 0;
}
