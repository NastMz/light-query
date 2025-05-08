# light-query

Light-query is a minimal, from-scratch React data-fetching library inspired by TanStack Query.  
It provides easy-to-use hooks for queries, mutations, and infinite loading, with configurable caching, stale-time, retry logic, and optional React Suspense support.

> **Note:** This library is a lightweight, minimal implementation and may lack some advanced features, performance optimizations, and edge-case handling of mature production-ready libraries.

## Features

- **`useQuery`**: Fetch data with caching, stale-time, retry, and optional auto-refetch
- **`useMutation`**: Perform mutations with `onSuccess` and `onError` callbacks
- **`useInfiniteQuery`**: Paginated / infinite-loading support
- **Configurable Options**: `staleTime`, `cacheTime`, `retry`, `retryDelay`, `refetchInterval`, `suspense`
- **Global `QueryClient`**: Shared cache and mutation management
- **React Context Provider**: Easy integration with Suspense or custom clients

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/NastMz/light-query.git
cd light-query
```

### 2. Configure `package.json`

Ensure your **package.json** contains:

```jsonc
{
  "name": "light-query",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "rollup -c",
    "prepare": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@rollup/plugin-typescript": "^11.x",
    "@rollup/plugin-node-resolve": "^15.x",
    "@rollup/plugin-commonjs": "^25.x",
    "rollup-plugin-dts": "^4.x",
    "rollup": "^3.x"
  }
}
```

### 3. Install & Build

```bash
npm install
npm run build
```

### 4. File-based installation

1. Copy `dist/` and `package.json` into your project (e.g. `./lib/light-query`).
2. In your app’s `package.json`:

   ```jsonc
   {
     "dependencies": {
       "light-query": "file:./lib/light-query"
     }
   }
   ```

3. Run:

   ```bash
   npm install
   ```

## Usage

### Wrap your App

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider, queryClient } from "light-query";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Basic Query

```tsx
import React from "react";
import { useQuery, QueryStatus } from "light-query";

function Todos() {
  const { data, status, error, refetch } = useQuery({
    queryKey: ["todos"],
    queryFn: () => fetch("/api/todos").then((r) => r.json()),
    staleTime: 1000 * 60,
    retry: 2,
    refetchInterval: 1000 * 30,
  });

  if (status === QueryStatus.Loading) return <p>Loading…</p>;
  if (status === QueryStatus.Error)
    return <p>Error: {(error as Error).message}</p>;

  return (
    <>
      <button onClick={() => refetch()}>Reload</button>
      <ul>
        {data!.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  );
}
```

### Mutation

```tsx
import React from "react";
import { useMutation, queryClient } from "light-query";

function AddTodo() {
  const { mutate, status } = useMutation<string, string>({
    mutationFn: (title) =>
      fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(["todos"]);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  return (
    <button onClick={() => mutate("New Task")} disabled={status === "loading"}>
      {status === "loading" ? "Adding…" : "Add Todo"}
    </button>
  );
}
```

### Infinite Query

```tsx
import React from "react";
import { useInfiniteQuery } from "light-query";

function InfiniteUsers() {
  const { pages, fetchNextPage, status } = useInfiniteQuery<{
    items: { id: number; name: string }[];
    nextPage: number | null;
  }>({
    queryKey: ["users"],
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/users?page=${pageParam}`).then((r) => r.json()),
    getNextPageParam: (last) => last.nextPage,
  });

  if (status === "loading") return <p>Loading…</p>;

  return (
    <>
      {pages.map((page, i) => (
        <ul key={i}>
          {page.items.map((u) => (
            <li key={u.id}>{u.name}</li>
          ))}
        </ul>
      ))}
      <button onClick={() => fetchNextPage()}>Load More</button>
    </>
  );
}
```

## API Reference

See the JSDoc comments in each file under `src/` for full method signatures, parameter descriptions, and return types.

## Contributing

Pull requests and issues are welcome. For major changes, please open an issue first to discuss what you’d like to change.

## License

MIT © Kevin Martinez
