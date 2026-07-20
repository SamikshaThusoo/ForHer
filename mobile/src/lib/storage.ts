import AsyncStorage from "@react-native-async-storage/async-storage";

// A synchronous key-value store that mirrors the web `localStorage` API, backed by
// an in-memory cache hydrated from AsyncStorage at app start. Reads are synchronous
// (served from the cache); writes update the cache immediately and persist to
// AsyncStorage in the background. This lets the shared logic layer ported from the
// web keep its synchronous storage calls unchanged (localStorage -> storage).
const cache = new Map<string, string>();
let hydrated = false;

/** Load all persisted keys into the cache. Call once before rendering the app. */
export async function hydrateStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [k, v] of pairs) if (v != null) cache.set(k, v);
  } catch {
    /* start empty on failure */
  }
  hydrated = true;
}

export const isHydrated = () => hydrated;

export const storage = {
  getItem(key: string): string | null {
    return cache.has(key) ? (cache.get(key) as string) : null;
  },
  setItem(key: string, value: string): void {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch(() => {});
  },
  removeItem(key: string): void {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch(() => {});
  },
  /** All cached keys — replaces `localStorage.length` / `localStorage.key(i)` loops. */
  keys(): string[] {
    return [...cache.keys()];
  },
};
