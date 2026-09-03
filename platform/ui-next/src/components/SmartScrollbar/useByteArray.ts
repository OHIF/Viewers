import { useCallback, useEffect, useRef, useState } from 'react';

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
 * @param batchIntervalMs - When > 0, writes are coalesced into a scheduled
 *                          flush: the first write starts a timer, the next
 *                          flush bumps `version`, and the timer stops. New
 *                          writes start a new interval window. Omit or pass 0
 *                          for immediate re-renders on every write.
 */
export function useByteArray(size: number, batchIntervalMs = 0): ByteArrayHandle {
  const bytesRef = useRef(new Uint8Array(size));
  const countRef = useRef(0);
  const [version, setVersion] = useState(0);
  const timeoutIdRef = useRef<number | null>(null);

  const clearScheduledFlush = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const flushScheduledVersion = useCallback(() => {
    // End this timeout window after the scheduled flush.
    clearScheduledFlush();
    setVersion(v => v + 1);
  }, [clearScheduledFlush]);

  // Reset array only when size actually changes — skip on initial mount since
  // bytesRef is already initialised to the correct size via useRef.
  useEffect(() => {
    if (bytesRef.current.length === size) return;
    // Drop any in-flight timeout window when resetting the underlying array.
    clearScheduledFlush();
    bytesRef.current = new Uint8Array(size);
    countRef.current = 0;
    setVersion(v => v + 1);
  }, [size, clearScheduledFlush]);

  useEffect(() => {
    // If timing changes mid-window, restart that timeout using the new timing.
    const pendingTimeoutId = timeoutIdRef.current;
    clearScheduledFlush();
    if (batchIntervalMs <= 0) {
      if (pendingTimeoutId !== null) {
        setVersion(v => v + 1);
      }
      return;
    }
    if (pendingTimeoutId !== null) {
      timeoutIdRef.current = window.setTimeout(flushScheduledVersion, batchIntervalMs);
    }
    return () => clearScheduledFlush();
  }, [batchIntervalMs, clearScheduledFlush, flushScheduledVersion]);

  const bump = useCallback(() => {
    if (batchIntervalMs <= 0) {
      setVersion(v => v + 1);
      return;
    }

    if (timeoutIdRef.current === null) {
      timeoutIdRef.current = window.setTimeout(flushScheduledVersion, batchIntervalMs);
    }
  }, [batchIntervalMs, flushScheduledVersion]);

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
