import type { CacheEntry } from './types.js';

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class Cache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase().trim();
  }

  get(key: string): T | null {
    const normalizedKey = this.normalizeKey(key);
    const entry = this.store.get(normalizedKey);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.store.delete(normalizedKey);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    const normalizedKey = this.normalizeKey(key);
    this.store.set(normalizedKey, {
      data,
      timestamp: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const normalizedKey = this.normalizeKey(key);
    return this.store.delete(normalizedKey);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    // Clean up expired entries first
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.store.delete(key);
      }
    }
    return this.store.size;
  }
}
