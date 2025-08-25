export function defaultSerialize<T>(value: T): string {
  return JSON.stringify(value);
}

export function defaultDeserialize<T>(raw: string): T {
  return JSON.parse(raw) as T;
}
