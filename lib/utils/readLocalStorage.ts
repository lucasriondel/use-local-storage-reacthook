import { isLocalStorageAvailable } from "./isLocalStorageAvailable";

export function readLocalStorage<T>(
  key: string,
  deserialize: (raw: string) => T
): T | undefined {
  if (!isLocalStorageAvailable()) return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return undefined;
    return deserialize(raw);
  } catch {
    return undefined;
  }
}
