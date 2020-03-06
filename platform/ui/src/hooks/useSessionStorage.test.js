import { renderHook, act } from '@testing-library/react-hooks';
import useSessionStorage from './useSessionStorage';

const SESSION_STORAGE_KEY = 'test';

describe('Hook Session Storage', () => {
  beforeEach(() => {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  });

  test('hook should return state and setState', () => {
    const data = { test: 1 };
    const { result } = renderHook(() =>
      useSessionStorage(SESSION_STORAGE_KEY, data)
    );
    const [hookState, setHookState] = result.current;

    expect(hookState).toStrictEqual(data);
    expect(typeof setHookState).toBe('function');
  });

  test('hook should store data on sessionStorage', () => {
    const data = { test: 2 };
    const { result } = renderHook(() =>
      useSessionStorage(SESSION_STORAGE_KEY, data)
    );

    const dataStr = JSON.stringify(data);
    const dataSessionStorage = window.sessionStorage.getItem(
      SESSION_STORAGE_KEY
    );
    expect(dataSessionStorage).toEqual(dataStr);
  });

  test('hook should return stored data from sessionStorage', () => {
    const data = { test: 3 };
    const dataToCompare = { test: 4 };

    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(dataToCompare)
    );

    const { result } = renderHook(() =>
      useSessionStorage(SESSION_STORAGE_KEY, data)
    );
    const [hookState, setHookState] = result.current;

    expect(hookState).toStrictEqual(dataToCompare);
  });

  test('hook should provide a setState method which updates its state', () => {
    const data = { test: 5 };
    const dataToCompare = { test: 6 };
    const { result } = renderHook(() =>
      useSessionStorage(SESSION_STORAGE_KEY, data)
    );
    const [hookState, setHookState] = result.current;

    act(() => {
      setHookState(dataToCompare);
    });

    const dataToCompareStr = JSON.stringify(dataToCompare);
    const dataSessionStorage = window.sessionStorage.getItem(
      SESSION_STORAGE_KEY
    );

    const [hookStateToCompare] = result.current;
    expect(dataSessionStorage).toEqual(dataToCompareStr);
    expect(hookStateToCompare).toStrictEqual(dataToCompare);
  });

  test('hook state must be preserved in case rerender', () => {
    const data = { test: 7 };
    const { result, rerender } = renderHook(() =>
      useSessionStorage(SESSION_STORAGE_KEY, data)
    );

    rerender();

    const [hookState, setHookState] = result.current;

    const dataToCompareStr = JSON.stringify(data);
    const dataSessionStorage = window.sessionStorage.getItem(
      SESSION_STORAGE_KEY
    );

    expect(dataSessionStorage).toEqual(dataToCompareStr);
    expect(hookState).toStrictEqual(data);
  });

  test('hook state must be preserved in case multiple operations and rerender', () => {
    const data = { test: 8 };
    const dataToCompare = { test: 9 };
    const { result, rerender } = renderHook(() =>
      useSessionStorage(SESSION_STORAGE_KEY, data)
    );
    const [hookState, setHookState] = result.current;

    act(() => {
      setHookState(dataToCompare);
    });

    rerender();

    const dataToCompareStr = JSON.stringify(dataToCompare);
    const dataSessionStorage = window.sessionStorage.getItem(
      SESSION_STORAGE_KEY
    );

    const [hookStateToCompare] = result.current;
    expect(dataSessionStorage).toEqual(dataToCompareStr);
    expect(hookStateToCompare).toStrictEqual(dataToCompare);
  });
});
