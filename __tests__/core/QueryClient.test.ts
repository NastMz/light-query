// __tests__/core/QueryClient.test.ts
import { queryClient } from '../../src/core/QueryClient';
import { http, HttpResponse } from 'msw';
import { server } from '../../src/mocks/server';
import { describe, it, expect } from 'vitest';

interface Todo {
  id: number;
  title: string;
}

describe('QueryClient.fetchQuery', () => {
  it('fetches data via MSW handler', async () => {
    const data = await queryClient.fetchQuery<Todo[]>({
      queryKey: ['todos'],
      queryFn: () => fetch('/todos').then(r => r.json()),
    });
    
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('title', 'Test');
  });

  it('invalidateQueries causes refetch', async () => {
    // Initial fetch with infinite staleTime to cache the result
    const data1 = await queryClient.fetchQuery<Todo[]>({
      queryKey: ['todos'],
      queryFn: () => fetch('/todos').then(r => r.json()),
      staleTime: Infinity,
    });
    expect(data1[0].title).toBe('Test');

    // Update the MSW handler to return changed data
    server.use(
      http.get('/todos', () =>
        HttpResponse.json([{ id: 2, title: 'Changed' }])
      )
    );

    // Without invalidation, fetchQuery should return cached data
    const data2 = await queryClient.fetchQuery<Todo[]>({
      queryKey: ['todos'],
      queryFn: () => fetch('/todos').then(r => r.json()),
      staleTime: Infinity,
    });
    expect(data2[0].title).toBe('Test');

    // After invalidation, fetchQuery should refetch and return the changed data
    await queryClient.invalidateQueries(['todos']);

    const data3 = await queryClient.fetchQuery<Todo[]>({
      queryKey: ['todos'],
      queryFn: () => fetch('/todos').then(r => r.json()),
      staleTime: Infinity,
    });
    
    expect(data3[0].title).toBe('Changed');
  });
});
