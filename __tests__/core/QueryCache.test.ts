import { QueryCache } from '../../src/core/QueryCache';
import { Query } from '../../src/core/Query';
import { describe, it, expect } from 'vitest';

describe('QueryCache', () => {
  it('stores, retrieves and removes queries', () => {
    const cache = new QueryCache();
    const q = new Query('key', {
      queryKey: ['key'],
      queryFn: () => Promise.resolve(1),
    });
    cache.set('key', q);
    expect(cache.get('key')).toBe(q);
    cache.remove('key');
    expect(cache.get('key')).toBeUndefined();
  });
});