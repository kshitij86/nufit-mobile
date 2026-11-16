import { useCallback, useEffect, useState } from "react";
import { userMessage } from "./http";

/**
 * What a screen reads from a feature service. Services backed by the API and services still on
 * local data return the same shape, so swapping one for the other doesn't touch the screens.
 */
export interface Resource<T> {
  /** The last loaded value. Kept while a reload is in flight, so screens don't flash empty. */
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

const listeners = new Map<string, Set<() => void>>();

/** Tells every mounted useResource with this key to load again, e.g. after a save. */
export function invalidate(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, listener: () => void) {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

/**
 * Loads `load()` on mount and again whenever `invalidate(key)` is called or `reload()` is pressed.
 * `load` must be stable (a module-level function or a memoised callback).
 */
export function useResource<T>(key: string, load: () => Promise<T>): Resource<T> {
  const [version, setVersion] = useState(0);
  const request = `${key}#${version}`;
  const [settled, setSettled] = useState<{ request: string; data?: T; error: string | null } | null>(null);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => subscribe(key, reload), [key, reload]);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => active && setSettled({ request, data, error: null }),
      (e) => active && setSettled((prev) => ({ request, data: prev?.data, error: userMessage(e) }))
    );
    return () => {
      active = false;
    };
  }, [request, load]);

  return {
    data: settled?.data,
    error: settled?.request === request ? settled.error : null,
    loading: settled?.request !== request,
    reload,
  };
}

const noop = () => {};

/** A resource that is already loaded, for features still served from local data. */
export function readyResource<T>(data: T): Resource<T> {
  return { data, error: null, loading: false, reload: noop };
}

/** Local data that can change: re-reads `read()` whenever `invalidate(key)` is called. */
export function useLocalResource<T>(key: string, read: () => T): Resource<T> {
  const [, setVersion] = useState(0);
  useEffect(() => subscribe(key, () => setVersion((v) => v + 1)), [key]);
  return readyResource(read());
}
