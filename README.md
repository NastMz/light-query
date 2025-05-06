# light-query

Light-query is a minimal, from-scratch React data-fetching library inspired by TanStack Query. It provides easy-to-use hooks for queries, mutations, and infinite scrolling with configurable caching, stale-time, retry logic, and optional React Suspense support.

> **Note:** This library is a lightweight, minimal implementation and may lack some advanced features, performance optimizations, and edge-case handling of mature production-ready libraries.

## Features

- **`useQuery`**: Fetch data with caching, stale-time, retry, and optional auto-refetch
- **`useMutation`**: Perform mutations with `onSuccess` and `onError` callbacks
- **`useInfiniteQuery`**: Paginated/infinite-loading support
- **Configurable Options**: `staleTime`, `cacheTime`, `retry`, `retryDelay`, `refetchInterval` (auto-refetch interval), `suspense`
- **Global `QueryClient`**: Shared cache and mutation management
- **React Context Provider**: Easy integration with Suspense or custom clients

## Installation

Since this package is not published to npm, you can include it in your project by copying the `src/` directory into your codebase, or by adding it as a local dependency:

```bash
# 1. Copy `src/` into your project (e.g. under `lib/light-query`)
cp -R /path/to/light-query/src ./src/lib/light-query

# 2. Add a file dependency in package.json
npm install --save file:./src/lib/light-query
```

Then import from the installed module:

```ts
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  QueryClientProvider,
  queryClient,
} from "light-query";
```

## Quick Start

### Wrap your App

```tsx
import React from "react";
import ReactDOM from "react-dom";
import { QueryClientProvider, queryClient, QueryStatus } from "light-query";
import App from "./App";

ReactDOM.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  document.getElementById("root")
);
```

### Basic Query

```tsx
import React from "react";
import { useQuery } from "light-query";

function Todos() {
  const { data, status, error, refetch } = useQuery({
    queryKey: ["todos"],
    queryFn: () => fetch("/api/todos").then((res) => res.json()),
    staleTime: 1000 * 60,
    retry: 2,
    refetchInterval: 1000 * 30, // Auto-refetch every 30 seconds
  });

  if (status === QueryStatus.Loading) return <p>Loading...</p>;
  if (status === QueryStatus.Error)
    return <p>Error: {(error as Error).message}</p>;

  return (
    <div>
      <button onClick={() => refetch()}>Reload</button>
      <ul>
        {data.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Mutation

```tsx
import React from "react";
import { useMutation, useQueryClient } from "light-query";

function AddTodo() {
  const queryClient = useQueryClient();
  const { mutate, status } = useMutation({
    mutationFn: (title: string) =>
      fetch("/api/todos", {
        method: "POST",
        body: JSON.stringify({ title }),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(["todos"]);
    },
  });

  return (
    <button onClick={() => mutate("New Task")} disabled={status === "loading"}>
      Add Todo
    </button>
  );
}
```

### Infinite Query

```tsx
import React from "react";
import { useInfiniteQuery } from "light-query";

function InfiniteUsers() {
  const { pages, fetchNextPage, status } = useInfiniteQuery({
    queryKey: ["users"],
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/users?page=${pageParam}`).then((res) => res.json()),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div>
      {pages.map((page, idx) => (
        <ul key={idx}>
          {page.items.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      ))}
      <button onClick={() => fetchNextPage()}>Load More</button>
    </div>
  );
}
```

## API Reference

See the JSDoc comments in each file under `src/` for full method signatures, parameter descriptions, and return types.

## Contributing

Pull requests and issues are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT © Kevin Martinez
