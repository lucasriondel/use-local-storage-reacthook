# 💾 useLocalStorageState

A powerful React hook for managing state that's automatically persisted to localStorage. Perfect for maintaining user preferences, form data, and application settings across browser sessions with automatic synchronization and data migration support.

[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-%3E%3D16.8.0-blue.svg)](https://reactjs.org/)

## ✨ Features

- 🎯 **Type-safe** - Full TypeScript support with generic types
- 💾 **Automatic localStorage sync** - State changes are persisted instantly
- 🔄 **Cross-tab synchronization** - Share state changes across browser tabs
- 🛡️ **Validation** - Built-in sanitization and validation hooks
- 📦 **Custom serialization** - Define custom codecs for complex data types
- 🔄 **Data migration** - Handle schema changes with version migration
- ⚡ **Performance optimized** - Efficient serialization and change detection
- 🪶 **Lightweight** - Zero dependencies (except React peer dependency)

## 📦 Installation

```bash
# Using npm
npm install @lucasriondel/use-local-storage-reacthook

# Using yarn
yarn add @lucasriondel/use-local-storage-reacthook

# Using pnpm
pnpm add @lucasriondel/use-local-storage-reacthook
```

## 🚀 Quick Start

```tsx
import { useLocalStorageState } from "@lucasriondel/use-local-storage-reacthook";

function UserPreferences() {
  const [settings, settingsApi] = useLocalStorageState(
    {
      theme: "light",
      language: "en",
      notifications: true,
    },
    { key: "user-preferences" }
  );

  return (
    <div>
      <select
        value={settings.theme}
        onChange={(e) => settingsApi.set("theme", e.target.value)}
      >
        <option value="light">Light Theme</option>
        <option value="dark">Dark Theme</option>
      </select>

      <select
        value={settings.language}
        onChange={(e) => settingsApi.set("language", e.target.value)}
      >
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="es">Spanish</option>
      </select>

      <label>
        <input
          type="checkbox"
          checked={settings.notifications}
          onChange={(e) => settingsApi.set("notifications", e.target.checked)}
        />
        Enable Notifications
      </label>
    </div>
  );
}
```

Your settings will automatically persist across browser sessions!

## 📚 API Reference

### `useLocalStorageState(defaults, options)`

Returns a tuple `[state, api]` where:

- `state`: The current state object
- `api`: Object with methods to manipulate the state

#### Parameters

| Parameter  | Type                                       | Description                  |
| ---------- | ------------------------------------------ | ---------------------------- |
| `defaults` | `DeepPartial<T> \| (() => DeepPartial<T>)` | Default values for the state |
| `options`  | `LocalStorageStateOptions<T>`              | Configuration options        |

#### Options

| Option           | Type                                               | Default     | Description                                       |
| ---------------- | -------------------------------------------------- | ----------- | ------------------------------------------------- |
| `key`            | `string`                                           | Required    | The localStorage key to store data under          |
| `codecs`         | `Partial<{ [K in keyof T]: Codec<T[K]> }>`         | `{}`        | Custom serialization for specific properties      |
| `sanitize`       | `(draft: DeepPartial<T>) => DeepPartial<T>`        | `undefined` | Validation/sanitization function                  |
| `onChange`       | `(state: T, meta) => void`                         | `undefined` | Callback fired on state changes                   |
| `syncAcrossTabs` | `boolean`                                          | `true`      | Sync state changes across browser tabs            |
| `version`        | `number`                                           | `undefined` | Version number for data migration                 |
| `migrate`        | `(stored: unknown, version: number) => Partial<T>` | `undefined` | Function to migrate old data when version changes |

#### API Methods

| Method     | Signature                                            | Description                                    |
| ---------- | ---------------------------------------------------- | ---------------------------------------------- |
| `setState` | `(updater: T \| (prev: T) => T) => void`             | Replace entire state                           |
| `get`      | `(key: keyof T) => T[key] \| undefined`              | Get value of specific property                 |
| `set`      | `(key: keyof T, value: T[key] \| undefined) => void` | Set specific property (or delete if undefined) |
| `patch`    | `(partial: DeepPartial<T>) => void`                  | Merge partial changes                          |
| `remove`   | `(...keys: (keyof T)[]) => void`                     | Remove one or more properties                  |
| `clear`    | `() => void`                                         | Clear all data from localStorage               |

## 🎯 Examples

### Basic Usage

```tsx
import { useLocalStorageState } from "use-local-storage-reacthook";

function App() {
  const [profile, profileApi] = useLocalStorageState(
    { name: "", age: 0 },
    { key: "user-profile" }
  );

  return (
    <div>
      <input
        value={profile.name}
        onChange={(e) => profileApi.set("name", e.target.value)}
        placeholder="Enter your name"
      />
      <input
        type="number"
        value={profile.age}
        onChange={(e) => profileApi.set("age", parseInt(e.target.value) || 0)}
        placeholder="Enter your age"
      />
      <button onClick={() => profileApi.clear()}>Clear Profile</button>
    </div>
  );
}
```

### With Custom Serialization

```tsx
interface AppSettings {
  tags: string[];
  lastLoginDate: Date;
  preferences: { theme: string; lang: string };
}

const [settings, settingsApi] = useLocalStorageState<AppSettings>(
  {
    tags: [],
    lastLoginDate: new Date(),
    preferences: { theme: "light", lang: "en" },
  },
  {
    key: "app-settings",
    codecs: {
      tags: {
        parse: (str) => str.split(",").filter(Boolean),
        format: (tags) => tags.join(","),
      },
      lastLoginDate: {
        parse: (str) => new Date(str),
        format: (date) => date.toISOString(),
      },
    },
  }
);
```

### With Validation and Change Tracking

```tsx
const [userPrefs, prefsApi] = useLocalStorageState(
  {
    theme: "light",
    fontSize: 16,
    language: "en",
  },
  {
    key: "user-preferences",
    sanitize: (draft) => ({
      theme: ["light", "dark"].includes(draft.theme) ? draft.theme : "light",
      fontSize: Math.max(12, Math.min(24, draft.fontSize || 16)),
      language: ["en", "fr", "es"].includes(draft.language)
        ? draft.language
        : "en",
    }),
    onChange: (newState, { source }) => {
      console.log(`Preferences updated from ${source}:`, newState);
      // Send analytics, trigger theme updates, etc.
    },
  }
);
```

### Multiple Hook Instances with Different Keys

```tsx
function Dashboard() {
  // User filters stored under 'user-filters' key
  const [userFilters, userApi] = useLocalStorageState(
    {
      role: "all",
      department: "all",
    },
    { key: "user-filters" }
  );

  // Product filters stored under 'product-filters' key
  const [productFilters, productApi] = useLocalStorageState(
    {
      category: "all",
      inStock: true,
    },
    { key: "product-filters" }
  );

  // Each hook manages its own localStorage entry independently
  // localStorage: { "user-filters": {...}, "product-filters": {...} }
}
```

### Complex State Management with Data Migration

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

const [appState, api] = useLocalStorageState<AppState>(
  {
    filters: {
      search: "",
      category: [],
      priceRange: [0, 1000],
    },
    view: "grid",
    sort: { field: "name", direction: "asc" },
  },
  {
    key: "app-state",
    version: 2,
    migrate: (stored, version) => {
      if (version < 2) {
        // Migrate from v1: add new priceRange field
        const oldState = stored as any;
        return {
          ...oldState,
          filters: {
            ...oldState.filters,
            priceRange: [0, 1000], // Add default price range
          },
        };
      }
      return stored as Partial<AppState>;
    },
  }
);

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

### Cross-Tab Synchronization

```tsx
// Enable cross-tab sync (default)
const [state, api] = useLocalStorageState(defaults, {
  key: "shared-state",
  syncAcrossTabs: true,
});

// Disable cross-tab sync for performance or privacy
const [state, api] = useLocalStorageState(defaults, {
  key: "local-only-state",
  syncAcrossTabs: false,
});
```

### Data Migration Between Versions

```tsx
const [config, configApi] = useLocalStorageState(
  { apiUrl: "https://api.example.com", timeout: 5000 },
  {
    key: "app-config",
    version: 3,
    migrate: (stored, currentVersion) => {
      const data = stored as any;

      if (currentVersion < 2) {
        // v1 -> v2: rename 'endpoint' to 'apiUrl'
        data.apiUrl = data.endpoint;
        delete data.endpoint;
      }

      if (currentVersion < 3) {
        // v2 -> v3: add timeout field
        data.timeout = data.timeout || 5000;
      }

      return data;
    },
  }
);
```

### Error Handling and Validation

```tsx
const [userInput, inputApi] = useLocalStorageState(
  { email: "", age: 0 },
  {
    key: "user-input",
    sanitize: (draft) => {
      // Validate and sanitize data from localStorage
      const email = typeof draft.email === "string" ? draft.email : "";
      const age =
        typeof draft.age === "number" && draft.age >= 0 ? draft.age : 0;

      return { email, age };
    },
    onChange: (newState, { source }) => {
      if (source === "external") {
        console.log("State updated from another tab:", newState);
      }
    },
  }
);
```

## 📝 TypeScript Support

The hook is fully typed and provides excellent TypeScript integration:

```tsx
interface UserProfile {
  name: string;
  roles: ("admin" | "user" | "guest")[];
  isActive: boolean;
  metadata?: { lastLogin: Date };
}

// Full type safety
const [profile, profileApi] = useLocalStorageState<UserProfile>(
  {
    name: "",
    roles: [],
    isActive: true,
  },
  { key: "user-profile" }
);

// TypeScript knows the exact shape
profileApi.set("name", "john"); // ✅ Valid
profileApi.set("roles", ["admin", "user"]); // ✅ Valid
profileApi.set("invalidProp", "value"); // ❌ TypeScript error

// Partial updates are also type-safe
profileApi.patch({
  name: "jane",
  isActive: false,
}); // ✅ Valid

profileApi.patch({
  invalidField: true,
}); // ❌ TypeScript error
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for better localStorage state management in React applications
- Built with TypeScript for maximum developer experience
- Designed to handle complex state persistence scenarios with ease
- Supports modern React patterns and best practices

---

**Happy coding!** 🚀 If you find this hook useful, please consider giving it a ⭐ on GitHub!
