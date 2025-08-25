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

export function useLocalStorageProp<
  T extends Record<string, unknown>,
  K extends keyof T
>(
  prop: K,
  defaultsOption: DeepPartial<T> | (() => DeepPartial<T>) | undefined,
  options: LocalStorageStateOptions<T>
): [T[K] | undefined, (value: T[K] | undefined) => void] {
  const [state, api] = useLocalStorageState<T>(
    defaultsOption || ({} as DeepPartial<T>),
    options
  );
  const value = state[prop];
  const setValue = React.useCallback(
    (v: T[K] | undefined) => api.set(prop, v),
    [api, prop]
  );
  return [value, setValue];
}
