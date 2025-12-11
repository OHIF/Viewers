import * as React from 'react';

/**
 * Persist and retrieve a default workflow string from localStorage.
 * If `allowed` is provided, the returned value is guaranteed to be from the allowed list (or null).
 */
export function useDefaultWorkflow(
  allowed?: readonly string[]
): [string | null, (next: string | null) => void] {
  const storageKey = 'studyList.defaultWorkflow';
  const [value, setValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(storageKey);
        if (raw != null) {
          if (!allowed || allowed.includes(raw)) {
            setValue(raw);
          } else {
            setValue(null);
          }
        }
      }
    } catch {
      // no-op
    }
  }, [allowed]);

  const setAndPersist = React.useCallback(
    (next: string | null) => {
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
    [allowed]
  );

  return [value, setAndPersist] as const;
}
