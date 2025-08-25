# 🔗 useUrlState

A powerful React hook for managing state synchronized with URL search parameters. Perfect for creating shareable URLs, maintaining filters across page refreshes, and building user-friendly web applications with deep linking support.

[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-%3E%3D16.8.0-blue.svg)](https://reactjs.org/)

## ✨ Features

- 🎯 **Type-safe** - Full TypeScript support with generic types
- 🔄 **Automatic URL sync** - State changes are reflected in the URL instantly
- ⏱️ **Debouncing** - Prevent excessive URL updates during rapid state changes
- 🧭 **Browser history** - Full support for back/forward navigation
- 🏷️ **Namespacing** - Avoid conflicts when using multiple instances
- 🛡️ **Validation** - Built-in sanitization and validation hooks
- 📦 **Custom serialization** - Define custom codecs for complex data types
- 🪶 **Lightweight** - Zero dependencies (except React peer dependency)

## 📦 Installation

```bash
# Using npm
npm install use-url-state-reacthook

# Using yarn
yarn add use-url-state-reacthook

# Using pnpm
pnpm add use-url-state-reacthook
```

## 🚀 Quick Start

```tsx
import { useUrlState } from "use-url-state-reacthook";

function SearchFilters() {
  const [filters, filtersApi] = useUrlState({
    search: "",
    category: "all",
    page: 1,
  });

  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => filtersApi.set("search", e.target.value)}
        placeholder="Search..."
      />

      <select
        value={filters.category}
        onChange={(e) => filtersApi.set("category", e.target.value)}
      >
        <option value="all">All Categories</option>
        <option value="tech">Technology</option>
        <option value="design">Design</option>
      </select>

      <div>Current page: {filters.page}</div>
      <button onClick={() => filtersApi.set("page", filters.page + 1)}>
        Next Page
      </button>
    </div>
  );
}
```

The URL will automatically update to something like: `?search=react&category=tech&page=2`

## 📚 API Reference

### `useUrlState(defaults?, options?)`

Returns a tuple `[state, api]` where:

- `state`: The current state object
- `api`: Object with methods to manipulate the state

#### Parameters

| Parameter  | Type                 | Description                             |
| ---------- | -------------------- | --------------------------------------- |
| `defaults` | `T \| (() => T)`     | Default values for the state (optional) |
| `options`  | `UrlStateOptions<T>` | Configuration options (optional)        |

#### Options

| Option           | Type                                       | Default     | Description                                  |
| ---------------- | ------------------------------------------ | ----------- | -------------------------------------------- |
| `codecs`         | `Partial<{ [K in keyof T]: Codec<T[K]> }>` | `{}`        | Custom serialization for specific properties |
| `sanitize`       | `(draft: Partial<T>) => Partial<T>`        | `undefined` | Validation/sanitization function             |
| `onChange`       | `(state: T, meta) => void`                 | `undefined` | Callback fired on state changes              |
| `history`        | `'replace' \| 'push'`                      | `'replace'` | Browser history behavior                     |
| `debounceMs`     | `number`                                   | `undefined` | Debounce delay for URL updates               |
| `syncOnPopState` | `boolean`                                  | `true`      | Sync state on browser navigation             |
| `namespace`      | `string`                                   | `undefined` | Prefix for URL parameters                    |

#### API Methods

| Method     | Signature                                | Description                    |
| ---------- | ---------------------------------------- | ------------------------------ |
| `setState` | `(updater: T \| (prev: T) => T) => void` | Replace entire state           |
| `get`      | `(key: keyof T) => T[key]`               | Get value of specific property |
| `set`      | `(key: keyof T, value: T[key]) => void`  | Set specific property          |
| `patch`    | `(partial: Partial<T>) => void`          | Merge partial changes          |
| `remove`   | `(...keys: (keyof T)[]) => void`         | Remove properties              |
| `clear`    | `() => void`                             | Clear all state                |

## 🎯 Examples

### Basic Usage

```tsx
import { useUrlState } from "use-url-state-reacthook";

function App() {
  const [state, api] = useUrlState({ name: "", age: 0 });

  return (
    <div>
      <input
        value={state.name}
        onChange={(e) => api.set("name", e.target.value)}
      />
      <input
        type="number"
        value={state.age}
        onChange={(e) => api.set("age", parseInt(e.target.value) || 0)}
      />
      <button onClick={() => api.clear()}>Clear All</button>
    </div>
  );
}
```

### With Custom Serialization

```tsx
interface Filters {
  tags: string[];
  dateRange: { start: Date; end: Date };
  settings: { theme: string; lang: string };
}

const [filters, api] = useUrlState<Filters>(
  {
    tags: [],
    dateRange: { start: new Date(), end: new Date() },
    settings: { theme: "light", lang: "en" },
  },
  {
    codecs: {
      tags: {
        parse: (str) => str.split(",").filter(Boolean),
        format: (tags) => tags.join(","),
      },
      dateRange: {
        parse: (str) => {
          const [start, end] = str.split("|").map((d) => new Date(d));
          return { start, end };
        },
        format: (range) =>
          `${range.start.toISOString()}|${range.end.toISOString()}`,
      },
    },
  }
);
```

### With Validation and Debouncing

```tsx
const [userPrefs, api] = useUrlState(
  {
    theme: "light",
    fontSize: 16,
    language: "en",
  },
  {
    sanitize: (draft) => ({
      theme: ["light", "dark"].includes(draft.theme) ? draft.theme : "light",
      fontSize: Math.max(12, Math.min(24, draft.fontSize || 16)),
      language: ["en", "fr", "es"].includes(draft.language)
        ? draft.language
        : "en",
    }),
    debounceMs: 300, // Wait 300ms before updating URL
    onChange: (newState, { source }) => {
      console.log(`Preferences updated from ${source}:`, newState);
      // Save to analytics, localStorage, etc.
    },
  }
);
```

### Multiple Hook Instances with Namespacing

```tsx
function Dashboard() {
  // User filters (prefixed with 'user_')
  const [userFilters, userApi] = useUrlState(
    {
      role: "all",
      department: "all",
    },
    { namespace: "user" }
  );

  // Product filters (prefixed with 'product_')
  const [productFilters, productApi] = useUrlState(
    {
      category: "all",
      inStock: true,
    },
    { namespace: "product" }
  );

  // URL: ?user_role=admin&user_department=engineering&product_category=electronics&product_inStock=true
}
```

### Complex State Management

```tsx
interface AppState {
  filters: {
    search: string;
    category: string[];
    priceRange: [number, number];
  };
  view: "grid" | "list";
  sort: { field: string; direction: "asc" | "desc" };
}

const [appState, api] = useUrlState<AppState>({
  filters: {
    search: "",
    category: [],
    priceRange: [0, 1000],
  },
  view: "grid",
  sort: { field: "name", direction: "asc" },
});

// Update nested properties
api.patch({
  filters: {
    ...appState.filters,
    search: "new search term",
  },
});

// Toggle sort direction
api.set("sort", {
  ...appState.sort,
  direction: appState.sort.direction === "asc" ? "desc" : "asc",
});
```

## 🔧 Advanced Configuration

### History Management

```tsx
// Replace current URL (default)
const [state, api] = useUrlState(defaults, { history: "replace" });

// Create new history entries (enables back/forward navigation between state changes)
const [state, api] = useUrlState(defaults, { history: "push" });
```

### Disabling Browser Navigation Sync

```tsx
// Don't sync state when user uses back/forward buttons
const [state, api] = useUrlState(defaults, { syncOnPopState: false });
```

### Performance Optimization

```tsx
// Debounce URL updates for better performance with rapid changes
const [searchState, api] = useUrlState(
  { query: "" },
  {
    debounceMs: 300, // Wait 300ms before updating URL
  }
);

// Perfect for search inputs that update frequently
<input
  value={searchState.query}
  onChange={(e) => api.set("query", e.target.value)}
/>;
```

## 📝 TypeScript Support

The hook is fully typed and provides excellent TypeScript integration:

```tsx
interface UserFilters {
  name: string;
  roles: ("admin" | "user" | "guest")[];
  isActive: boolean;
  metadata?: { lastLogin: Date };
}

// Full type safety
const [filters, api] = useUrlState<UserFilters>({
  name: "",
  roles: [],
  isActive: true,
});

// TypeScript knows the exact shape
api.set("name", "john"); // ✅ Valid
api.set("roles", ["admin", "user"]); // ✅ Valid
api.set("invalidProp", "value"); // ❌ TypeScript error
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for better URL state management in React applications
- Built with TypeScript for maximum developer experience
- Designed to be simple yet powerful for real-world use cases

---

**Happy coding!** 🚀 If you find this hook useful, please consider giving it a ⭐ on GitHub!
