import { useCallback, useEffect, useRef, useState } from 'react';

export interface ByteArrayHandle {
  /** Marked positions. A new identity is published whenever the contents change. */
  bytes: Uint8Array;
  /** True when every byte in the array is set (all positions marked). */
  isFull: boolean;
  setByte: (index: number) => void;
  clearByte: (index: number) => void;
  resetWith: (populate: (bytes: Uint8Array) => void) => void;
}

/**
 * Manages a mutable Uint8Array (one byte per position) with React change
 * detection.
 *
 * Writes mutate a single buffer in place, so marking a position costs nothing
 * and never reallocates. Change is published by `commit()`, which swaps in a
 * fresh view over that same buffer via `subarray()` — an O(1) identity change
 * with no copy.
 *
 * Publishing a new identity is load-bearing, not cosmetic. The React Compiler
 * infers memoization dependencies from the values a callback actually reads, so
 * a separate change token would be dropped from the emitted cache guard, and a
 * consumer memoizing on `bytes` alone would never recompute.
 *
 * @param size       - Number of positions (e.g. total slices in a viewport).
 * @param batchIntervalMs - When > 0, writes are coalesced into a scheduled
 *                          flush: the first write starts a timer, the next
 *                          flush publishes, and the timer stops. New writes
 *                          start a new interval window. Omit or pass 0 for
 *                          immediate re-renders on every write.
 */
export function useByteArray(size: number, batchIntervalMs = 0): ByteArrayHandle {
  // State is declared first so the initial buffer comes from it rather than
  // from a ref read during render, which the compiler rightly rejects.
  const [published, setPublished] = useState(() => ({
    bytes: new Uint8Array(size),
    count: 0,
  }));
  const bytesRef = useRef(published.bytes);
  const countRef = useRef(0);
  const timeoutIdRef = useRef<number | null>(null);

  const clearScheduledFlush = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // Publish the buffer's current contents: a new view identity over the same
  // memory, plus the count that goes with it, in one state update.
  const commit = useCallback(() => {
    setPublished({ bytes: bytesRef.current.subarray(), count: countRef.current });
  }, []);

  const flushScheduled = useCallback(() => {
    // End this timeout window after the scheduled flush.
    clearScheduledFlush();
    commit();
  }, [clearScheduledFlush, commit]);

  // Reset array only when size actually changes — skip on initial mount since
  // bytesRef is already initialized to the correct size via useState.
  useEffect(() => {
    if (bytesRef.current.length === size) return;
    // Drop any in-flight timeout window when resetting the underlying array.
    clearScheduledFlush();
    bytesRef.current = new Uint8Array(size);
    countRef.current = 0;
    commit();
  }, [size, clearScheduledFlush, commit]);

  useEffect(() => {
    // If timing changes mid-window, restart that timeout using the new timing.
    const pendingTimeoutId = timeoutIdRef.current;
    clearScheduledFlush();
    if (batchIntervalMs <= 0) {
      if (pendingTimeoutId !== null) {
        commit();
      }
      return;
    }
    if (pendingTimeoutId !== null) {
      timeoutIdRef.current = window.setTimeout(flushScheduled, batchIntervalMs);
    }
    return () => clearScheduledFlush();
  }, [batchIntervalMs, clearScheduledFlush, commit, flushScheduled]);

  const bump = useCallback(() => {
    if (batchIntervalMs <= 0) {
      commit();
      return;
    }

    if (timeoutIdRef.current === null) {
      timeoutIdRef.current = window.setTimeout(flushScheduled, batchIntervalMs);
    }
  }, [batchIntervalMs, commit, flushScheduled]);

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
    bytes: published.bytes,
    isFull: size > 0 && published.count === size,
    setByte,
    clearByte,
    resetWith,
  };
}
