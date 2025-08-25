import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useLocalStorageProp,
  useLocalStorageState,
} from "./useLocalStorageState";

function mockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  } as unknown as Storage;
}

describe("useLocalStorageState", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage(),
      writable: true,
    });
  });

  describe("defaults", () => {
    it("initializes with defaults", () => {
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string; cols?: string[] }>(
          { theme: "light", cols: [] },
          { key: "prefs" }
        )
      );
      expect(result.current[0]).toEqual({ theme: "light", cols: [] });
    });

    // namespaced strategy removed
  });

  describe("writes", () => {
    it("set writes to single key", () => {
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string }>({}, { key: "prefs" })
      );
      act(() => result.current[1].set("theme", "dark"));
      expect(window.localStorage.getItem("prefs")).toBeDefined();
      const parsed = JSON.parse(window.localStorage.getItem("prefs") || "{}");
      expect(parsed).toEqual({ theme: "dark" });
    });
  });

  describe("onChange", () => {
    it("called with correct state and source", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string; page?: number }>(
          {},
          {
            key: "prefs",
            onChange,
          }
        )
      );
      act(() => result.current[1].patch({ theme: "dark" }));
      act(() => result.current[1].set("page", 3));
      const sources = onChange.mock.calls.map((c) => c[1].source);
      expect(sources).toEqual(["patch", "patch"]);
      const states = onChange.mock.calls.map((c) => c[0]);
      expect(states[0]).toEqual({ theme: "dark" });
      expect(states[1]).toEqual({ theme: "dark", page: 3 });
    });
  });

  describe("prop hook", () => {
    it("reads/sets a single key", () => {
      const { result } = renderHook(() =>
        useLocalStorageProp<{ theme?: string; page?: number }, "theme">(
          "theme",
          undefined,
          { key: "prefs" }
        )
      );
      const [value, setValue] = result.current;
      expect(value).toBeUndefined();
      act(() => setValue("dark"));
      const parsed = JSON.parse(window.localStorage.getItem("prefs") || "{}");
      expect(parsed.theme).toBe("dark");
    });
  });

  describe("syncAcrossTabs", () => {
    it("updates on storage event (single)", () => {
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string }>(
          {},
          {
            key: "prefs",
            syncAcrossTabs: true,
          }
        )
      );
      act(() => {
        window.localStorage.setItem("prefs", JSON.stringify({ theme: "dark" }));
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "prefs",
            newValue: JSON.stringify({ theme: "dark" }),
          })
        );
      });
      expect(result.current[0]).toEqual({ theme: "dark" });
    });
  });

  describe("migrate", () => {
    it("is applied to stored state (single)", () => {
      window.localStorage.setItem("prefs", JSON.stringify({ theme: "old" }));
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string }>(
          {},
          {
            key: "prefs",
            version: 2,
            migrate: (stored, version) => {
              const obj = stored as { theme?: string };
              return version >= 2 && obj.theme === "old"
                ? { theme: "new" }
                : obj;
            },
          }
        )
      );
      expect(result.current[0]).toEqual({ theme: "new" });
    });
  });

  describe("remove/clear", () => {
    it("remove deletes keys", () => {
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string; page?: number }>(
          {},
          {
            key: "prefs",
          }
        )
      );
      act(() => result.current[1].patch({ theme: "dark", page: 2 }));
      act(() => result.current[1].remove("theme"));
      const parsed = JSON.parse(window.localStorage.getItem("prefs") || "{}");
      expect(parsed.theme).toBeUndefined();
    });

    it("remove handles multiple keys", () => {
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string; page?: number; sort?: string }>(
          {},
          {
            key: "prefs",
          }
        )
      );
      act(() =>
        result.current[1].patch({ theme: "dark", page: 2, sort: "asc" })
      );
      act(() => result.current[1].remove("theme", "page"));
      const parsed = JSON.parse(window.localStorage.getItem("prefs") || "{}");
      expect(parsed.theme).toBeUndefined();
      expect(parsed.page).toBeUndefined();
      expect(parsed.sort).toBe("asc");
    });

    it("clear removes all keys", () => {
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string; page?: number }>(
          {},
          {
            key: "prefs",
          }
        )
      );
      act(() => result.current[1].patch({ theme: "dark", page: 2 }));
      act(() => result.current[1].clear());
      expect(window.localStorage.getItem("prefs")).toBeNull();
    });
  });

  describe("function-based defaults", () => {
    it("supports function-based defaults", () => {
      const defaultsFn = vi.fn(() => ({ theme: "computed", count: 42 }));
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string; count?: number }>(defaultsFn, {
          key: "prefs",
        })
      );
      expect(defaultsFn).toHaveBeenCalled();
      expect(result.current[0]).toEqual({ theme: "computed", count: 42 });
    });
  });

  describe("error handling", () => {
    it("handles localStorage unavailable gracefully", () => {
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true,
      });
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string }>(
          { theme: "light" },
          {
            key: "prefs",
          }
        )
      );
      expect(result.current[0]).toEqual({ theme: "light" });
      act(() => result.current[1].set("theme", "dark"));
      expect(result.current[0]).toEqual({ theme: "dark" });
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
      });
    });

    it("handles JSON parse errors in stored data", () => {
      window.localStorage.setItem("prefs", "invalid-json");
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string }>(
          { theme: "light" },
          {
            key: "prefs",
          }
        )
      );
      expect(result.current[0]).toEqual({ theme: "light" });
    });

    it("handles localStorage read errors", () => {
      const mockStorage = mockLocalStorage();
      mockStorage.getItem = vi.fn(() => {
        throw new Error("Storage error");
      });
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        writable: true,
      });
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string }>(
          { theme: "light" },
          {
            key: "prefs",
          }
        )
      );
      expect(result.current[0]).toEqual({ theme: "light" });
    });
  });

  describe("version migration", () => {
    it("applies migration when version matches", () => {
      window.localStorage.setItem(
        "prefs",
        JSON.stringify({ oldTheme: "dark" })
      );
      const migrate = vi.fn((stored, version) => {
        const obj = stored as { oldTheme?: string };
        return version >= 2 ? { theme: obj.oldTheme } : obj;
      });
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string; oldTheme?: string }>(
          {},
          {
            key: "prefs",
            version: 2,
            migrate,
          }
        )
      );
      expect(migrate).toHaveBeenCalledWith({ oldTheme: "dark" }, 2);
      expect(result.current[0]).toEqual({ theme: "dark" });
    });

    it("skips migration when version is lower", () => {
      window.localStorage.setItem(
        "prefs",
        JSON.stringify({ theme: "original" })
      );
      const migrate = vi.fn(() => ({ theme: "migrated" }));
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string }>(
          {},
          {
            key: "prefs",
            version: 1,
            migrate,
          }
        )
      );
      expect(migrate).toHaveBeenCalledWith({ theme: "original" }, 1);
      expect(result.current[0]).toEqual({ theme: "migrated" });
    });

    it("handles migration function errors", () => {
      window.localStorage.setItem("prefs", JSON.stringify({ theme: "dark" }));
      const migrate = vi.fn(() => {
        throw new Error("Migration failed");
      });
      const { result } = renderHook(() =>
        useLocalStorageState<{ theme?: string }>(
          { theme: "light" },
          {
            key: "prefs",
            version: 2,
            migrate,
          }
        )
      );
      expect(result.current[0]).toEqual({ theme: "light" });
    });
  });
});
