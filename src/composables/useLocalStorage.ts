import { ref, watch, type Ref } from 'vue';

/**
 * Reactive `localStorage` state persistence composable with safe JSON serialization
 * and graceful fallback when storage is unavailable or corrupted.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  const readInitial = (): T => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return cloneDefault(defaultValue);
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return cloneDefault(defaultValue);
      }
      return JSON.parse(raw) as T;
    } catch {
      return cloneDefault(defaultValue);
    }
  };

  const state = ref<T>(readInitial()) as Ref<T>;

  watch(
    state,
    (newVal) => {
      if (typeof window === 'undefined' || !window.localStorage) return;
      try {
        window.localStorage.setItem(key, JSON.stringify(newVal));
      } catch {
        // Ignore quota exceeded / private browsing write errors
      }
    },
    { deep: true },
  );

  return state;
}

function cloneDefault<T>(val: T): T {
  if (val !== null && typeof val === 'object') {
    return JSON.parse(JSON.stringify(val)) as T;
  }
  return val;
}
