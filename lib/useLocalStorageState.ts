import * as React from "react";
import {
  DeepPartial,
  LocalStorageApiActions,
  LocalStorageStateOptions,
} from "./types";
import { isLocalStorageAvailable } from "./utils/isLocalStorageAvailable";
import { mergeWithDefaults } from "./utils/mergeWithDefaults";
import { readLocalStorage } from "./utils/readLocalStorage";
import { removeLocalStorage } from "./utils/removeLocalStorage";
import { resolveDefaults } from "./utils/resolveDefaults";
import { defaultDeserialize, defaultSerialize } from "./utils/serialization";
import { writeLocalStorage } from "./utils/writeLocalStorage";

/**
 * A React hook for managing state that's automatically persisted to localStorage.
 *
 * This hook provides a powerful interface for storing complex objects in localStorage
 * with support for default values, data migration, cross-tab synchronization, and more.
 *
 * @template T - The type of the state object. Must extend Record<string, unknown>
 *
 * @param defaultsOption - Default values for the state object. Can be either:
 *   - A partial object containing default values
 *   - A function that returns default values (useful for expensive computations)
 *
 * @param options - Configuration options for the hook
 * @param options.key - The localStorage key to store the data under
 * @param options.codecs - Optional custom serialization/deserialization functions for specific properties
 * @param options.sanitize - Optional function to sanitize/validate data read from localStorage
 * @param options.onChange - Optional callback fired when state changes, receives the new state and metadata about the change source
 * @param options.syncAcrossTabs - Whether to sync state changes across browser tabs (default: true)
 * @param options.version - Optional version number for data migration
 * @param options.migrate - Optional function to migrate old data when version changes
 *
 * @returns A tuple containing:
 *   - [0] The current state object
 *   - [1] An API object with methods to manipulate the state:
 *     - `setState`: Standard React setState function
 *     - `get`: Get a specific property value
 *     - `set`: Set a specific property value (or delete if undefined)
 *     - `patch`: Merge partial updates into the state
 *     - `remove`: Remove one or more properties
 *     - `clear`: Clear all data from localStorage and reset to empty state
 *
 * @example
 * ```tsx
 * // Basic usage with default values
 * const [settings, settingsApi] = useLocalStorageState(
 *   { theme: 'light', language: 'en' },
 *   { key: 'app-settings' }
 * );
 *
 * // Update a single property
 * settingsApi.set('theme', 'dark');
 *
 * // Merge multiple properties
 * settingsApi.patch({ theme: 'dark', language: 'fr' });
 *
 * // With change callback and sanitization
 * const [userPrefs, userPrefsApi] = useLocalStorageState(
 *   { notifications: true, volume: 0.8 },
 *   {
 *     key: 'user-preferences',
 *     sanitize: (data) => ({
 *       ...data,
 *       volume: Math.max(0, Math.min(1, data.volume || 0.8))
 *     }),
 *     onChange: (newState, meta) => {
 *       console.log('Settings changed:', newState, 'Source:', meta.source);
 *     }
 *   }
 * );
 *
 * // With data migration
 * const [config, configApi] = useLocalStorageState(
 *   { apiUrl: 'https://api.example.com', timeout: 5000 },
 *   {
 *     key: 'app-config',
 *     version: 2,
 *     migrate: (stored, version) => {
 *       if (version < 2 && typeof stored === 'object' && stored !== null) {
 *         // Migrate from v1 to v2: rename 'endpoint' to 'apiUrl'
 *         const old = stored as any;
 *         return {
 *           apiUrl: old.endpoint || 'https://api.example.com',
 *           timeout: old.timeout || 5000
 *         };
 *       }
 *       return stored as Partial<typeof config>;
 *     }
 *   }
 * );
 * ```
 */
export function useLocalStorageState<T extends Record<string, unknown>>(
  defaultsOption: DeepPartial<T> | (() => DeepPartial<T>),
  options: LocalStorageStateOptions<T>
): [T, LocalStorageApiActions<T>] {
  const {
    key,
    sanitize,
    onChange,
    syncAcrossTabs = true,
    version,
    migrate,
  } = options;

  const defaults = React.useMemo(
    () => resolveDefaults<T>(defaultsOption),
    [defaultsOption]
  );

  const readAll = React.useCallback((): Partial<T> => {
    if (!isLocalStorageAvailable()) return {};
    const raw = readLocalStorage<string>(key, (s) => s);
    if (!raw) return {};
    try {
      const parsed = defaultDeserialize<Partial<T>>(raw);
      if (version !== undefined && migrate) {
        return migrate(parsed, version);
      }
      return parsed;
    } catch {
      return {};
    }
  }, [key, version, migrate]);

  const readInitial = React.useCallback((): T => {
    const persisted = readAll();
    const sanitized = sanitize ? sanitize(persisted) : persisted;
    return mergeWithDefaults<T>(sanitized as Partial<T>, defaults);
  }, [readAll, defaults, sanitize]);

  const [state, setState] = React.useState<T>(readInitial);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  React.useEffect(() => {
    if (!syncAcrossTabs) return;
    const handler = (event: StorageEvent) => {
      if (event.key !== key) return;
      const next = readInitial();
      setState(next);
      onChange?.(next, { source: "external" });
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, readInitial, onChange, syncAcrossTabs]);

  const writeFull = React.useCallback(
    (next: T) => {
      if (!isLocalStorageAvailable()) return;
      // Store the entire object under a single key, same as former 'single' strategy
      writeLocalStorage<string>(key, defaultSerialize(next), (s) => s);
    },
    [key]
  );

  const api: LocalStorageApiActions<T> = React.useMemo(
    () => ({
      setState: (updater) => {
        setState((prev) => {
          const next =
            typeof updater === "function"
              ? (updater as (p: T) => T)(prev)
              : updater;
          writeFull(next);
          onChange?.(next, { source: "set" });
          return next;
        });
      },
      get: (k) => stateRef.current[k],
      set: (k, value) => {
        setState((prev) => {
          const next: T = { ...prev };
          const dict = next as unknown as Record<string, unknown>;
          if (value === undefined) delete dict[k as string];
          else dict[k as string] = value as unknown;
          writeFull(next);
          onChange?.(next, { source: "patch" });
          return next;
        });
      },
      patch: (partial) => {
        setState((prev) => {
          const next = { ...prev, ...(partial as Partial<T>) } as T;
          writeFull(next);
          onChange?.(next, { source: "patch" });
          return next;
        });
      },
      remove: (...keys) => {
        setState((prev) => {
          const next: T = { ...prev };
          const dict = next as unknown as Record<string, unknown>;
          for (const k of keys) {
            delete dict[k as string];
          }
          writeFull(next);
          onChange?.(next, { source: "patch" });
          return next;
        });
      },
      clear: () => {
        setState(() => {
          removeLocalStorage(key);
          return {} as T;
        });
      },
    }),
    [key, onChange, writeFull]
  );

  return [state, api];
}
