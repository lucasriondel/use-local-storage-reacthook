import * as React from "react";

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type Codec<V> = {
  parse: (raw: string) => V;
  format: (value: V) => string;
};

export type CodecsMap<T> = Partial<{ [K in keyof T]: Codec<NonNullable<T[K]>> }>;

export interface LocalStorageStateOptions<T extends Record<string, unknown>> {
  key: string;
  codecs?: CodecsMap<T>;
  sanitize?: (draft: DeepPartial<T>) => DeepPartial<T>;
  onChange?: (next: T, meta: { source: "set" | "patch" | "external" }) => void;
  syncAcrossTabs?: boolean;
  version?: number;
  migrate?: (stored: unknown, version: number) => Partial<T>;
}

export type LocalStorageApiActions<T extends Record<string, unknown>> = {
  setState: React.Dispatch<React.SetStateAction<T>>;
  get: <K extends keyof T>(key: K) => T[K] | undefined;
  set: <K extends keyof T>(key: K, value: T[K] | undefined) => void;
  patch: (partial: DeepPartial<T>) => void;
  remove: <K extends keyof T>(...keys: K[]) => void;
  clear: () => void;
};
