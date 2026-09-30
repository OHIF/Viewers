import {
  applyUndoRedoCacheSize,
  MAX_UNDO_REDO_CACHE_SIZE,
  UNDO_REDO_CACHE_SIZE_CUSTOMIZATION,
  validateUndoRedoCacheSize,
} from './applyUndoRedoCacheSize';

jest.mock('@cornerstonejs/core', () => ({
  utilities: { HistoryMemo: { DefaultHistoryMemo: { size: 50 } } },
}));

/** Mimics the Cornerstone setter, which clears the history on each assignment. */
class FakeHistory {
  private _size = 50;
  public assignments = 0;

  get size() {
    return this._size;
  }

  set size(newSize: number) {
    this.assignments++;
    this._size = newSize;
  }
}

const serviceWith = (value: unknown) => ({
  getCustomization: (id: string) => (id === UNDO_REDO_CACHE_SIZE_CUSTOMIZATION ? value : undefined),
});

describe('validateUndoRedoCacheSize', () => {
  it.each([1, 5, MAX_UNDO_REDO_CACHE_SIZE])('accepts %p', value => {
    expect(validateUndoRedoCacheSize(value)).toBe(value);
  });

  it.each([0, -1, 10.5, 1e10, MAX_UNDO_REDO_CACHE_SIZE + 1, Infinity, NaN, '5', null, undefined])(
    'rejects %p',
    value => {
      expect(validateUndoRedoCacheSize(value)).toBeUndefined();
    }
  );
});

describe('applyUndoRedoCacheSize', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('sets a valid size', () => {
    const history = new FakeHistory();
    applyUndoRedoCacheSize(serviceWith(5), history);
    expect(history.size).toBe(5);
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not assign the size again when the value is unchanged', () => {
    const history = new FakeHistory();
    applyUndoRedoCacheSize(serviceWith(5), history);
    applyUndoRedoCacheSize(serviceWith(5), history);
    expect(history.assignments).toBe(1);
  });

  it('leaves the default size when the value is unset', () => {
    const history = new FakeHistory();
    applyUndoRedoCacheSize(serviceWith(undefined), history);
    expect(history.size).toBe(50);
    expect(history.assignments).toBe(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it('restores the default size when the value is removed', () => {
    const history = new FakeHistory();
    applyUndoRedoCacheSize(serviceWith(5), history);
    applyUndoRedoCacheSize(serviceWith(undefined), history);
    expect(history.size).toBe(50);
  });

  it.each([0, 10.5, 1e10, Infinity])('ignores %p with a warning and keeps the default', value => {
    const history = new FakeHistory();
    applyUndoRedoCacheSize(serviceWith(value), history);
    expect(history.size).toBe(50);
    expect(history.assignments).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
