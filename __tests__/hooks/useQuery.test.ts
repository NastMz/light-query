import { renderHook, waitFor, act } from '@testing-library/react';
import { useQuery } from '../../src/hooks/useQuery';
import { QueryStatus } from '../../src/types';
import { queryClient } from '../../src/core/QueryClient';
import { http, HttpResponse } from 'msw';
import { server } from '../../src/mocks/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useQuery hook', () => {
  beforeEach(() => {
    // Clear cache before each test
    queryClient.getQueryCache().clear();
  });

  it('should auto-fetch on initial mount', async () => {
    const queryFn = vi.fn(() => 
      fetch('/todos').then(r => r.json())
    );

    const { result } = renderHook(() => useQuery({
      queryKey: ['todos'],
      queryFn,
    }));

    // Initially should be loading or will be loading soon
    expect(['idle', 'loading']).toContain(result.current.status);
    expect(queryFn).toHaveBeenCalledTimes(1);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.status).toBe(QueryStatus.Success);
    });

    expect(result.current.data).toEqual([{ id: 1, title: 'Test' }]);
  });

  it('should refetch when refetch is called', async () => {
    const queryFn = vi.fn(() => 
      fetch('/todos').then(r => r.json())
    );

    const { result } = renderHook(() => useQuery({
      queryKey: ['todos'],
      queryFn,
    }));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.status).toBe(QueryStatus.Success);
    });

    expect(result.current.data).toEqual([{ id: 1, title: 'Test' }]);
    expect(queryFn).toHaveBeenCalledTimes(1);

    // Update MSW handler to return different data
    server.use(
      http.get('/todos', () =>
        HttpResponse.json([{ id: 2, title: 'Refetched' }])
      )
    );

    // Call refetch
    await act(async () => {
      await result.current.refetch();
    });

    // Wait for the state to update after refetch
    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 2, title: 'Refetched' }]);
    });

    // Should have new data
    expect(result.current.data).toEqual([{ id: 2, title: 'Refetched' }]);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('should respect staleTime and not refetch fresh data', async () => {
    const queryFn = vi.fn(() => 
      fetch('/todos').then(r => r.json())
    );

    const { result } = renderHook(() => useQuery({
      queryKey: ['todos'],
      queryFn,
      staleTime: 60000, // 1 minute
    }));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.status).toBe(QueryStatus.Success);
    });

    expect(queryFn).toHaveBeenCalledTimes(1);

    // Remount the hook (simulating component re-render)
    const { result: result2 } = renderHook(() => useQuery({
      queryKey: ['todos'],
      queryFn,
      staleTime: 60000,
    }));

    // Should not refetch since data is still fresh
    await waitFor(() => {
      expect(result2.current.status).toBe(QueryStatus.Success);
    });

    expect(queryFn).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('should automatically refetch at intervals when refetchInterval is set', async () => {
    const queryFn = vi.fn(() => 
      fetch('/todos').then(r => r.json())
    );

    const { result } = renderHook(() => useQuery({
      queryKey: ['todos'],
      queryFn,
      refetchInterval: 100, // 100ms
    }));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.status).toBe(QueryStatus.Success);
    });

    expect(queryFn).toHaveBeenCalledTimes(1);

    // Wait for interval refetch
    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(2);
    }, { timeout: 200 });

    // Wait for another interval refetch
    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(3);
    }, { timeout: 200 });
  });

  it('should refetch updated data at intervals', async () => {
    let responseData = [{ id: 1, title: 'Initial' }];
    
    const queryFn = vi.fn(() => 
      Promise.resolve(responseData)
    );

    const { result } = renderHook(() => useQuery({
      queryKey: ['todos-interval'],
      queryFn,
      refetchInterval: 50, // 50ms for faster test
    }));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.status).toBe(QueryStatus.Success);
    });

    expect(result.current.data).toEqual([{ id: 1, title: 'Initial' }]);
    
    // Reset call count after initial fetch to track only interval calls
    const initialCallCount = queryFn.mock.calls.length;

    // Update the data that will be returned by the next fetch
    responseData = [{ id: 2, title: 'Updated' }];

    // Wait for interval refetch
    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(initialCallCount + 1);
    }, { timeout: 100 });

    // Wait for the data to be updated
    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 2, title: 'Updated' }]);
    }, { timeout: 100 });

    // Update data again
    responseData = [{ id: 3, title: 'Updated Again' }];

    // Wait for another interval refetch
    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(initialCallCount + 2);
    }, { timeout: 100 });

    // Wait for the data to be updated again
    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 3, title: 'Updated Again' }]);
    }, { timeout: 100 });
  });

  it('should handle errors properly', async () => {
    const queryFn = vi.fn(() => 
      Promise.reject(new Error('Test error'))
    );

    const { result } = renderHook(() => useQuery({
      queryKey: ['todos'],
      queryFn,
    }));

    // Wait for error
    await waitFor(() => {
      expect(result.current.status).toBe(QueryStatus.Error);
    });

    expect(result.current.error).toEqual(new Error('Test error'));
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
