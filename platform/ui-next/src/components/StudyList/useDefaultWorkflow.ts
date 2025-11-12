import * as React from 'react';

/**
 * Persist and retrieve a "default workflow" (or any string union) from localStorage.
 * If `allowed` is provided, the returned value is guaranteed to be from the allowed list (or null).
 */
export function useDefaultWorkflow<T extends string>(
  storageKey: string = 'studylist.defaultWorkflow',
  allowed?: readonly T[]
) {
  const [value, setValue] = React.useState<T | null>(null);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(storageKey);
        if (raw != null) {
          if (!allowed || (allowed as readonly string[]).includes(raw)) {
            setValue(raw as T);
          } else {
            setValue(null);
          }
        }
      }
    } catch {
      // no-op
    }
  }, [storageKey, allowed]);

  const setAndPersist = React.useCallback(
    (next: T | null) => {
      setValue(next);
      try {
        if (typeof window !== 'undefined') {
          if (next == null) {
            window.localStorage.removeItem(storageKey);
          } else {
            if (!allowed || allowed.includes(next)) {
              window.localStorage.setItem(storageKey, next);
            }
          }
        }
      } catch {
        // no-op
      }
    },
    [storageKey, allowed]
  );

  return [value, setAndPersist] as const;
}

