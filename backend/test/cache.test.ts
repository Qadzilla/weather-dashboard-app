import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Cache } from '../src/cache.js';

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new Cache<string>(1000); // 1 second TTL for testing
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should normalize keys to lowercase', () => {
    cache.set('Boston', 'data');
    expect(cache.get('boston')).toBe('data');
    expect(cache.get('BOSTON')).toBe('data');
    expect(cache.get('BoStOn')).toBe('data');
  });

  it('should trim whitespace from keys', () => {
    cache.set('  Boston  ', 'data');
    expect(cache.get('Boston')).toBe('data');
  });

  it('should expire entries after TTL', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    // Advance time past TTL
    vi.advanceTimersByTime(1001);

    expect(cache.get('key1')).toBeNull();
  });

  it('should return value if within TTL', () => {
    cache.set('key1', 'value1');

    // Advance time but stay within TTL
    vi.advanceTimersByTime(500);

    expect(cache.get('key1')).toBe('value1');
  });

  it('should report correct size excluding expired entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);

    vi.advanceTimersByTime(1001);

    expect(cache.size()).toBe(0);
  });

  it('should clear all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeNull();
  });

  it('should delete specific entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    const deleted = cache.delete('key1');

    expect(deleted).toBe(true);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });

  it('should report whether key exists via has()', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(cache.has('key1')).toBe(false);
  });
});
