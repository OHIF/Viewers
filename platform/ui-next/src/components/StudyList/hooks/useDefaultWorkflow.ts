import * as React from 'react';

const storageKey = 'studyList.defaultWorkflow';

/**
 * Read the stored workflow, or null when storage is unavailable or empty.
 * Module scope on purpose: a conditional inside a try/catch is a React Compiler
 * limitation that bails the whole hook, and plain functions are never compiled.
 */
function readStoredWorkflow(): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
  } catch {
    return null;
  }
}

/** Write or clear the stored workflow. Module scope for the same reason. */
function writeStoredWorkflow(next: string | null): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    if (next == null) {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, next);
    }
  } catch {
    // no-op
  }
}

/**
 * Persist and retrieve a default workflow string from localStorage.
 * If `allowed` is provided, the returned value is guaranteed to be from the allowed list (or null).
 */
export function useDefaultWorkflow(
  allowed?: readonly string[]
): [string | null, (next: string | null) => void] {
  // State holds the raw stored string; the validated value is derived during
  // render. Deriving rather than storing keeps the result correct when `allowed`
  // arrives late - the study list passes `appConfig?.loadedModes ?? []`, so it is
  // briefly empty - and removes an effect whose only job was to re-validate.
  const [stored, setStored] = React.useState<string | null>(readStoredWorkflow);

  const value = stored != null && (!allowed || allowed.includes(stored)) ? stored : null;

  const setAndPersist = React.useCallback(
    (next: string | null) => {
      setStored(next);
      if (next == null || !allowed || allowed.includes(next)) {
        writeStoredWorkflow(next);
      }
    },
    [allowed]
  );

  return [value, setAndPersist] as const;
}
