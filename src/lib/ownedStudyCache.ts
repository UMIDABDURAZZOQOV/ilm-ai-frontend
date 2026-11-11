/** Local drafts are scoped by the application's user ID, never email.
 * This is cache isolation; the server must still authorize every API request.
 * Unknown legacy keys are preserved but never adopted into another account. */
export function studyCacheKey(ownerId: number | null | undefined, resource: string): string | null {
  if (!Number.isSafeInteger(ownerId) || (ownerId as number) <= 0 || !resource) return null;
  return `ilm-study:${ownerId}:${encodeURIComponent(resource)}`;
}

export function readOwnedCache(storage: Pick<Storage, "getItem">, ownerId: number | null | undefined, resource: string): string | null {
  const key = studyCacheKey(ownerId, resource);
  if (!key) return null;
  try { return storage.getItem(key); } catch { return null; }
}

export function writeOwnedCache(storage: Pick<Storage, "setItem">, ownerId: number | null | undefined, resource: string, value: string): void {
  const key = studyCacheKey(ownerId, resource);
  if (!key) return;
  try { storage.setItem(key, value); } catch { /* Quota must not break an answer. */ }
}

export function removeOwnedCache(storage: Pick<Storage, "removeItem">, ownerId: number | null | undefined, resource: string): void {
  const key = studyCacheKey(ownerId, resource);
  if (!key) return;
  try { storage.removeItem(key); } catch { /* Browser storage can be disabled. */ }
}
