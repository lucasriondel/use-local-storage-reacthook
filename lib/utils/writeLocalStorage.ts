import { isLocalStorageAvailable } from "./isLocalStorageAvailable";

export function writeLocalStorage<T>(
  key: string,
  value: T,
  serialize: (value: T) => string
): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const serialized = serialize(value);
    window.localStorage.setItem(key, serialized);
  } catch {
    /* noop */
  }
}
