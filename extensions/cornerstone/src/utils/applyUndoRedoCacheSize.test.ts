import { applyUndoRedoCacheSize } from './applyUndoRedoCacheSize';

jest.mock('@cornerstonejs/core', () => ({
  utilities: { HistoryMemo: { DefaultHistoryMemo: { size: 50 } } },
}));

it('applies a valid size, and keeps the default size for an unset or invalid value', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const history = { size: 50 };
  const apply = (value: unknown) =>
    applyUndoRedoCacheSize({ getCustomization: () => value }, history);

  apply(5);
  expect(history.size).toBe(5);
  apply(undefined);
  expect(history.size).toBe(50);
  apply(10.5);
  expect(history.size).toBe(50);
  expect(console.warn).toHaveBeenCalledTimes(1);
});
