import { renderHook, act } from '@testing-library/react-hooks';
import useLocalStorage from './useLocalStorage';

const LOCAL_STORAGE_KEY = 'test';

describe('Hook Local Storage', () => {
  beforeEach(() => {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  });

  test('hook should return state and setState', () => {
    const data = { test: 1 };
    const { result } = renderHook(() =>
      useLocalStorage(LOCAL_STORAGE_KEY, data)
    );
    const [hookState, setHookState] = result.current;

    expect(hookState).toStrictEqual(data);
    expect(typeof setHookState).toBe('function');
  });

  test('hook should store data on localStorage', () => {
    const data = { test: 2 };
    const { result } = renderHook(() =>
      useLocalStorage(LOCAL_STORAGE_KEY, data)
    );

    const dataStr = JSON.stringify(data);
    const dataLocalStorage = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    expect(dataLocalStorage).toEqual(dataStr);
  });

  test('hook should return stored data from localStorage', () => {
    const data = { test: 3 };
    const dataToCompare = { test: 4 };

    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(dataToCompare)
    );

    const { result } = renderHook(() =>
      useLocalStorage(LOCAL_STORAGE_KEY, data)
    );
    const [hookState, setHookState] = result.current;

    expect(hookState).toStrictEqual(dataToCompare);
  });

  test('hook should provide a setState method which updates its state', () => {
    const data = { test: 5 };
    const dataToCompare = { test: 6 };
    const { result } = renderHook(() =>
      useLocalStorage(LOCAL_STORAGE_KEY, data)
    );
    const [hookState, setHookState] = result.current;

    act(() => {
      setHookState(dataToCompare);
    });

    const dataToCompareStr = JSON.stringify(dataToCompare);
    const dataLocalStorage = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    const [hookStateToCompare] = result.current;
    expect(dataLocalStorage).toEqual(dataToCompareStr);
    expect(hookStateToCompare).toStrictEqual(dataToCompare);
  });

  test('hook state must be preserved in case rerender', () => {
    const data = { test: 7 };
    const { result, rerender } = renderHook(() =>
      useLocalStorage(LOCAL_STORAGE_KEY, data)
    );

    rerender();

    const [hookState, setHookState] = result.current;

    const dataToCompareStr = JSON.stringify(data);
    const dataLocalStorage = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    expect(dataLocalStorage).toEqual(dataToCompareStr);
    expect(hookState).toStrictEqual(data);
  });

  test('hook state must be preserved in case multiple operations and rerender', () => {
    const data = { test: 8 };
    const dataToCompare = { test: 9 };
    const { result, rerender } = renderHook(() =>
      useLocalStorage(LOCAL_STORAGE_KEY, data)
    );
    const [hookState, setHookState] = result.current;

    act(() => {
      setHookState(dataToCompare);
    });

    rerender();

    const dataToCompareStr = JSON.stringify(dataToCompare);
    const dataLocalStorage = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    const [hookStateToCompare] = result.current;
    expect(dataLocalStorage).toEqual(dataToCompareStr);
    expect(hookStateToCompare).toStrictEqual(dataToCompare);
  });
});
