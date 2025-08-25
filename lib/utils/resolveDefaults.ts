import { DeepPartial } from "../types";

export function resolveDefaults<T>(
  defaults?: DeepPartial<T> | (() => DeepPartial<T>)
): DeepPartial<T> {
  if (!defaults) return {};
  return typeof defaults === "function" ? defaults() : defaults;
}
