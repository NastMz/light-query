# 🚀 light-query

**A lightweight data-fetching library for React inspired by TanStack Query**

![React 18+](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)
![TypeScript 5.0+](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-blue)

**Performant • Lightweight • Easy to use • Fully typed**

---

## 🎯 Overview

**light-query** is a modern data-fetching library that provides powerful async state management for React applications. Built with TypeScript, it offers intelligent caching, request deduplication, and automatic background updates while maintaining a simple and intuitive API.

> **Note**: This library is designed for exploration and learning purposes. While fully functional and well-tested, it is not intended as a commercial solution.

### ✨ Key Features

A comprehensive data-fetching solution with advanced capabilities:

| Feature                     | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| 🔄 **Queries & Mutations**  | Declarative async state management with intuitive API |
| 🚀 **Infinite Queries**     | Built-in pagination and infinite loading support      |
| 💾 **Smart Caching**        | Intelligent cache system with automatic invalidation  |
| ⚡ **Performance**          | Request deduplication and batch notification system   |
| 🎯 **TypeScript**           | Full TypeScript support with advanced type safety     |
| 🧪 **Testing**              | Comprehensive testing utilities and mock support      |
| 🔧 **Configuration**        | Flexible, global configuration system                 |
| 📊 **State Tracking**       | Reactive state monitoring and global query tracking   |
| 🚫 **Request Cancellation** | Automatic request cancellation with AbortController   |
| ⚛️ **React Suspense**       | Native React Suspense integration                     |

### 🎨 Technical Highlights

Advanced implementation features:

- 📊 **State Management** - Sophisticated async state patterns and lifecycle management
- 🔄 **Data Synchronization** - Automatic UI-server synchronization with optimistic updates
- 🏗️ **Architecture Design** - Modular, extensible architecture with clear separation of concerns
- 🛠️ **TypeScript** - Advanced type system usage with generics and conditional types
- 🧪 **Testing Patterns** - Comprehensive testing utilities for async React components
- 🔍 **Performance Optimization** - Memory-efficient rendering with structural sharing

## 📦 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/NastMz/light-query.git
cd light-query

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

## 🚀 Quick Start

### Step 1: Setup the Provider

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "light-query";
import App from "./App";

// Create client with custom configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchInterval: 0,
      suspense: false,
    },
  },
  maxCacheSize: 50,
  logger: {
    error: (message, meta) => console.error(message, meta),
    warn: (message, meta) => console.warn(message, meta),
  }, // Optional: logging system
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Step 2: Your First Query

```tsx
import React from "react";
import { useQuery } from "light-query";

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: number }) {
  const { data, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/users/${userId}`, { signal });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data?.name}</h1>
      <p>{data?.email}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Step 3: Your First Mutation

```tsx
import React, { useState } from "react";
import { useMutation, useQueryClient } from "light-query";

function CreateUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: async (newUser: { name: string; email: string }) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setName("");
      setEmail("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <button type="submit" disabled={createUser.status === "loading"}>
        {createUser.status === "loading" ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

## 🔍 Core Concepts

### Caching and Invalidation

light-query implements an intelligent caching system that:

- **Deduplication**: Prevents duplicate requests
- **Automatic invalidation**: Refetches when data changes
- **Automatic cleanup**: Removes stale data based on `cacheTime`
- **Sharing**: Multiple components can share the same query

```tsx
// Invalidate specific queries
queryClient.invalidateQueries(["users"]);

// Invalidate queries starting with 'users'
queryClient.invalidateQueries(["users"]);

// Update cache directly
queryClient.setQueryData(["user", 1], newUserData);
```

### Query States

```tsx
const { status, isLoading, isFetching, isError, isSuccess } = useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
});

// status can be: 'idle', 'loading', 'error', 'success'
// isLoading: true only on initial load
// isFetching: true during any fetch (including refetch)
```

### Query Options

```tsx
useQuery({
  queryKey: ["posts", { page: 1 }],
  queryFn: fetchPosts,

  // Cache configuration
  staleTime: 5 * 60 * 1000, // Data is "fresh" for 5 minutes
  cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes

  // Behavior
  retry: 3, // Retry on error
  retryDelay: 1000, // Delay between retries

  // Automatic refetch
  refetchInterval: 30 * 1000, // Every 30 seconds

  // Suspense
  suspense: false, // Enable React Suspense
});
```

## 📖 API Reference

### Hooks

#### `useQuery<T>(options: QueryOptions<T>)`

Main hook for data fetching with automatic cache and state management.

**Parameters:**

- `queryKey` - Unique key to identify the query
- `queryFn` - Function that returns a Promise with the data
- `staleTime` - Time in ms before data is considered stale
- `cacheTime` - Time in ms data stays in cache
- `retry` - Number of retries on error
- `retryDelay` - Delay between retries in ms
- `refetchInterval` - Automatic refetch interval in ms
- `suspense` - Enable React Suspense support

**Returns:**

- `data` - The query data
- `isLoading` - If the query is loading for the first time
- `isFetching` - If the query is fetching (includes refetch)
- `error` - Error if the query failed
- `status` - Current state (`idle`, `loading`, `success`, `error`)
- `refetch` - Function for manual refetch

#### `useMutation<TData, TVariables>(options: MutationOptions<TData, TVariables>)`

Hook for mutations (POST, PUT, DELETE, etc.) with success and error callbacks.

```tsx
const mutation = useMutation({
  mutationFn: (variables) => createUser(variables),
  onSuccess: (data) => {
    // Success logic
  },
  onError: (error) => {
    // Error handling
  },
});

// Use the mutation
mutation.mutate(userData);
```

#### `useInfiniteQuery<T>(options: InfiniteQueryOptions<T>)`

Hook for paginated queries with infinite loading.

```tsx
const result = useInfiniteQuery({
  queryKey: ["posts"],
  queryFn: ({ pageParam = 1 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage, pages) => lastPage.nextPage,
});
```

#### `useQueryClient()`

Hook to access the QueryClient and its methods.

```tsx
const queryClient = useQueryClient();

// Invalidate queries
queryClient.invalidateQueries(["users"]);

// Update cache
queryClient.setQueryData(["user", 1], newUserData);
```

#### `useIsFetching()`

Hook that returns the number of queries currently fetching.

```tsx
const isFetching = useIsFetching();
// Returns: number
```

#### `useIsMutating()`

Hook that returns the number of mutations currently executing.

```tsx
const mutatingCount = useIsMutating();
// Returns: number
```

### QueryClient

Main class for managing global query and mutation state.

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: 1000,
      refetchInterval: 0,
      suspense: false,
    },
  },
  maxCacheSize: 50,
  logger: {
    error: (message, meta) => console.error(message, meta),
    warn: (message, meta) => console.warn(message, meta),
  },
});
```

#### Main Methods

- `invalidateQueries(queryKey)` - Invalidate specific queries
- `cancelQueries(queryKey)` - Cancel running queries
- `getQueryData(queryKey)` - Get data from cache
- `setQueryData(queryKey, data)` - Update cache data
- `getQueries(queryKey)` - Get queries matching a pattern
- `clear()` - Clear all cache
- `getActiveMutationCount()` - Get number of active mutations

### TypeScript Types

```tsx
interface QueryOptions<T> {
  queryKey: QueryKey;
  queryFn: (context: QueryFunctionContext) => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
  refetchInterval?: number;
  suspense?: boolean;
}

interface MutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  status: "idle" | "loading" | "success" | "error";
  refetch: () => Promise<void>;
}
```

## 🎯 Advanced Patterns

### Query Dependencies

```tsx
function UserProfile({ userId }: { userId: number }) {
  // Main query to get user
  const userQuery = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  // Dependent query that only runs if user exists
  const postsQuery = useQuery({
    queryKey: ["posts", userId],
    queryFn: () => fetchUserPosts(userId),
    // Note: This example shows conditional logic, but 'enabled' is not implemented
    // You would need to handle this in your component logic
  });

  return (
    <div>
      {userQuery.data && (
        <div>
          <h1>{userQuery.data.name}</h1>
          {postsQuery.data && (
            <ul>
              {postsQuery.data.map((post) => (
                <li key={post.id}>{post.title}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

### Optimistic Updates

```tsx
function UpdateTodo({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const updateTodo = useMutation({
    mutationFn: (updatedTodo: Partial<Todo>) =>
      updateTodoApi(todo.id, updatedTodo),

    onMutate: async (updatedTodo) => {
      // Cancel pending refetches
      await queryClient.cancelQueries(["todos"]);

      // Snapshot current state
      const previousTodos = queryClient.getQueryData(["todos"]);

      // Optimistic update
      queryClient.setQueryData(["todos"], (old: Todo[]) =>
        old?.map((t) => (t.id === todo.id ? { ...t, ...updatedTodo } : t))
      );

      // Return context for rollback
      return { previousTodos };
    },

    onError: (err, updatedTodo, context) => {
      // Rollback on error
      queryClient.setQueryData(["todos"], context?.previousTodos);
    },

    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries(["todos"]);
    },
  });

  const handleToggle = () => {
    updateTodo.mutate({ completed: !todo.completed });
  };

  return (
    <div>
      <input type="checkbox" checked={todo.completed} onChange={handleToggle} />
      <span
        style={{
          textDecoration: todo.completed ? "line-through" : "none",
        }}
      >
        {todo.title}
      </span>
    </div>
  );
}
```

### Parallel Queries

```tsx
function Dashboard() {
  // Multiple queries running in parallel
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: fetchCurrentUser,
  });

  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  // Use useIsFetching to show global state
  const isFetching = useIsFetching();

  return (
    <div>
      {isFetching > 0 && (
        <div>🔄 Loading data... ({isFetching} active queries)</div>
      )}

      <UserSection user={userQuery.data} loading={userQuery.isLoading} />
      <StatsSection stats={statsQuery.data} loading={statsQuery.isLoading} />
      <NotificationSection
        notifications={notificationsQuery.data}
        loading={notificationsQuery.isLoading}
      />
    </div>
  );
}
```

### Search with Debounce

```tsx
function SearchResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchQuery = useQuery({
    queryKey: ["search", debouncedSearchTerm],
    queryFn: () => searchApi(debouncedSearchTerm),
    // Note: You would need to handle conditional fetching in your component
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Only render results if we have a search term
  if (debouncedSearchTerm.length <= 2) {
    return (
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
        />
        <div>Type at least 3 characters to search...</div>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />

      {searchQuery.isLoading && <div>Searching...</div>}
      {searchQuery.error && <div>Error: {searchQuery.error.message}</div>}

      {searchQuery.data && (
        <div>
          {searchQuery.data.map((result) => (
            <div key={result.id}>{result.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🛠️ Advanced Features

### Request Cancellation

light-query includes automatic request cancellation support using AbortController:

```tsx
const { data, refetch } = useQuery({
  queryKey: ["data"],
  queryFn: async ({ signal }) => {
    const response = await fetch("/api/data", {
      signal, // AbortController signal
    });
    return response.json();
  },
});

// Queries are automatically cancelled when:
// - Component unmounts
// - queryKey changes
// - New query with same key is executed
```

### React Suspense

```tsx
function TodosWithSuspense() {
  const { data } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    suspense: true, // Enable Suspense
  });

  // No need to handle loading state
  // Suspense handles it automatically
  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}

// In your App
function App() {
  return (
    <Suspense fallback={<div>Loading todos...</div>}>
      <TodosWithSuspense />
    </Suspense>
  );
}
```

### Logging System

```tsx
import { Logger, LogLevel } from "light-query";

// Create a logger instance
const logger = new Logger(LogLevel.Info);

const queryClient = new QueryClient({
  logger: {
    error: (message, meta) => logger.error(message, meta),
    warn: (message, meta) => logger.warn(message, meta),
  },
});
```

## 🧪 Testing

light-query includes comprehensive testing utilities:

### Testing Utilities

```tsx
import { createMockQueryClient, waitForQuery } from "light-query/test-utils";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "light-query";

describe("TodoList", () => {
  it("should render todos after loading", async () => {
    const mockClient = createMockQueryClient();

    render(
      <QueryClientProvider client={mockClient}>
        <TodoList />
      </QueryClientProvider>
    );

    // Wait for query to complete
    await waitForQuery(mockClient, ["todos"]);

    expect(screen.getByText("Todo 1")).toBeInTheDocument();
    expect(screen.getByText("Todo 2")).toBeInTheDocument();
  });

  it("should handle error state", async () => {
    const mockClient = createMockQueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retry for tests
        },
      },
    });

    // Simulate query error
    mockClient.setQueryData(["todos"], () => {
      throw new Error("Network error");
    });

    render(
      <QueryClientProvider client={mockClient}>
        <TodoList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## 📊 Performance

light-query is optimized for performance:

### Built-in Optimizations

- **Deduplication**: Identical requests are automatically deduplicated
- **Batch Notifications**: Multiple updates are batched to prevent unnecessary re-renders
- **Automatic Cancellation**: Stale requests are cancelled automatically
- **Smart Cleanup**: Cache is cleaned automatically based on `cacheTime`
- **Lazy Loading**: Queries only execute when needed
- **Structural Sharing**: Data is structurally shared to prevent re-renders

### Best Practices

1. **Use descriptive queryKeys**:

   ```tsx
   // ❌ Bad
   useQuery({ queryKey: ["data"], queryFn: fetchData });

   // ✅ Good
   useQuery({ queryKey: ["posts", "user", userId], queryFn: fetchUserPosts });
   ```

2. **Configure staleTime appropriately**:

   ```tsx
   // For data that changes infrequently
   useQuery({
     queryKey: ["settings"],
     queryFn: fetchSettings,
     staleTime: 10 * 60 * 1000, // 10 minutes
   });

   // For data that changes frequently
   useQuery({
     queryKey: ["notifications"],
     queryFn: fetchNotifications,
     staleTime: 30 * 1000, // 30 seconds
   });
   ```

## 🛠️ Development

### Environment Setup

```bash
# Clone the repository
git clone https://github.com/NastMz/light-query.git
cd light-query

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

### Available Scripts

- `npm test` - Run all tests with vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run build` - Production build with rollup
- `npm run lint` - Lint with ts-standard
- `npm run format` - Format code with ts-standard

### Project Structure

```text
light-query/
├── src/
│   ├── hooks/           # Main hooks
│   ├── core/            # Core logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities
│   └── index.ts         # Main exports
├── __tests__/           # Tests
│   └── test-utils/      # Testing utilities
├── examples/            # Usage examples
├── package.json
├── tsconfig.json
├── rollup.config.mjs
└── vitest.config.ts
```

## 🎓 Technical Implementation

This library demonstrates comprehensive implementation of:

### Core Technologies

- **React Hooks**: Advanced custom hooks, useEffect patterns, useRef, useCallback
- **State Management**: Complex state patterns, state machines, and reactive systems
- **Async Operations**: Promise handling, error boundaries, and automatic cancellation
- **TypeScript**: Generics, conditional types, utility types, and advanced type safety
- **Testing**: React Testing Library, async testing patterns, and comprehensive mocking

### Advanced Implementation Details

- **Observer Pattern**: Reactive subscription system with efficient change detection
- **Cache Management**: LRU cache with TTL, intelligent invalidation strategies
- **Performance Optimization**: Request deduplication, batching, and structural sharing
- **Error Handling**: Custom error types with recovery strategies and user-friendly messages
- **Configuration Systems**: Flexible, typed configuration with sensible defaults

### Architecture Patterns

- **Modular Design**: Clean separation of concerns with clear interfaces
- **API Design**: Intuitive, consistent API with TypeScript-first approach
- **Plugin Architecture**: Extensible system with configurable components
- **Documentation**: Comprehensive API documentation with practical examples

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kevin Martinez** - [@NastMz](https://github.com/NastMz)

---

⭐ If you find this project useful, consider giving it a star on GitHub! ⭐
