import { isLocalStorageAvailable } from "./isLocalStorageAvailable";

export function removeLocalStorage(key: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}
