import { renderHook } from '@testing-library/react';
import { useByteArray } from './useByteArray';

describe('useByteArray', () => {
  it('gives an empty array, and does not throw, for a non-finite size', () => {
    const { result } = renderHook(() => useByteArray(Infinity));

    expect(result.current.bytes.length).toBe(0);
    expect(result.current.isFull).toBe(false);
  });
});
