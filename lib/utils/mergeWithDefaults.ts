import { DeepPartial } from "../types";

export function mergeWithDefaults<T extends Record<string, unknown>>(
  persisted: Partial<T>,
  defaults: DeepPartial<T>
): T {
  return Object.assign({}, defaults, persisted) as T;
}
