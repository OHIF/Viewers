import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface ByteArrayHandle {
  bytes: Uint8Array;
  version: number;
  /** True when every byte in the array is set (all positions marked). */
  isFull: boolean;
  setByte: (index: number) => void;
  clearByte: (index: number) => void;
  resetWith: (populate: (bytes: Uint8Array) => void) => void;
}

/**
 * Manages a mutable Uint8Array (one byte per position) with React change
 * detection via an incrementing version counter.
 *
 * @param size       - Number of positions (e.g. total slices in a viewport).
 * @param debounceMs - When > 0, version bumps are debounced by this many
 *                    milliseconds. Byte writes are always immediate. Use for
 *                    high-frequency sources (cache prefetch) to batch renders.
 *                    Omit or pass 0 for immediate re-renders (e.g. viewed tracking).
 */
export function useByteArray(size: number, debounceMs = 0): ByteArrayHandle {
  const bytesRef = useRef(new Uint8Array(size));
  const countRef = useRef(0);
  const [version, setVersion] = useState(0);

  // Debounced bump — recreated when debounceMs changes; cancelled on unmount
  // or when debounceMs changes, following the lodash.debounce pattern used
  // throughout ui-next (InputFilter, CinePlayer).
  const debouncedBump = useMemo(
    () => (debounceMs > 0 ? debounce(() => setVersion(v => v + 1), debounceMs) : null),
    [debounceMs]
  );

  useEffect(() => {
    return () => debouncedBump?.cancel();
  }, [debouncedBump]);

  // Reset array only when size actually changes — skip on initial mount since
  // bytesRef is already initialised to the correct size via useRef.
  useEffect(() => {
    if (bytesRef.current.length === size) return;
    debouncedBump?.cancel();
    bytesRef.current = new Uint8Array(size);
    countRef.current = 0;
    setVersion(v => v + 1);
  }, [size, debouncedBump]);

  const bump = useCallback(() => {
    if (debouncedBump) {
      debouncedBump();
    } else {
      setVersion(v => v + 1);
    }
  }, [debouncedBump]);

  const setByte = useCallback(
    (index: number) => {
      const bytes = bytesRef.current;
      if (index < 0 || index >= bytes.length || bytes[index] === 1) return;
      bytes[index] = 1;
      countRef.current++;
      bump();
    },
    [bump]
  );

  const clearByte = useCallback(
    (index: number) => {
      const bytes = bytesRef.current;
      if (index < 0 || index >= bytes.length || bytes[index] === 0) return;
      bytes[index] = 0;
      countRef.current--;
      bump();
    },
    [bump]
  );

  const resetWith = useCallback(
    (populate: (bytes: Uint8Array) => void) => {
      const bytes = bytesRef.current;
      bytes.fill(0);
      populate(bytes);
      let count = 0;
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i]) count++;
      }
      countRef.current = count;
      bump();
    },
    [bump]
  );

  return {
    bytes: bytesRef.current,
    version,
    // countRef.current is read at render time (triggered by version bump) so
    // it is always up to date when this value is consumed.
    isFull: size > 0 && countRef.current === size,
    setByte,
    clearByte,
    resetWith,
  };
}
