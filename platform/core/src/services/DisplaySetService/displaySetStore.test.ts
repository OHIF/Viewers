import { Enums, metaData, utilities as csMetadataUtilities } from '@cornerstonejs/metadata';
import * as displaySetStore from './displaySetStore';

const makeDisplaySet = (uid: string, extra: Record<string, unknown> = {}) =>
  ({ displaySetInstanceUID: uid, SeriesInstanceUID: `series-${uid}`, ...extra }) as any;

describe('displaySetStore', () => {
  beforeEach(() => {
    displaySetStore.clearDisplaySets();
  });

  it('round-trips set/get/has', () => {
    const displaySet = makeDisplaySet('uid-1');
    displaySetStore.setDisplaySet(displaySet);
    expect(displaySetStore.getDisplaySet('uid-1')).toBe(displaySet);
    expect(displaySetStore.hasDisplaySet('uid-1')).toBe(true);
    expect(displaySetStore.getDisplaySet('missing')).toBeUndefined();
  });

  it('overwrites silently on duplicate set (no console.warn)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const first = makeDisplaySet('uid-1', { generation: 1 });
      const second = makeDisplaySet('uid-1', { generation: 2 });
      displaySetStore.setDisplaySet(first);
      displaySetStore.setDisplaySet(second);
      expect(displaySetStore.getDisplaySet('uid-1')).toBe(second);
      expect(displaySetStore.getAllDisplaySets()).toHaveLength(1);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('deletes display sets', () => {
    displaySetStore.setDisplaySet(makeDisplaySet('uid-1'));
    expect(displaySetStore.deleteDisplaySet('uid-1')).toBe(true);
    expect(displaySetStore.getDisplaySet('uid-1')).toBeUndefined();
    expect(displaySetStore.deleteDisplaySet('uid-1')).toBe(false);
  });

  it('clears all display sets', () => {
    displaySetStore.setDisplaySet(makeDisplaySet('uid-1'));
    displaySetStore.setDisplaySet(makeDisplaySet('uid-2'));
    displaySetStore.clearDisplaySets();
    expect(displaySetStore.getAllDisplaySets()).toEqual([]);
  });

  it('preserves insertion order in getAllDisplaySets', () => {
    const uids = ['b', 'a', 'c'];
    uids.forEach(uid => displaySetStore.setDisplaySet(makeDisplaySet(uid)));
    expect(displaySetStore.getAllDisplaySets().map(ds => ds.displaySetInstanceUID)).toEqual(uids);
  });

  it('returns an independent snapshot map', () => {
    displaySetStore.setDisplaySet(makeDisplaySet('uid-1'));
    const snapshot = displaySetStore.getDisplaySetSnapshot();
    expect(snapshot.get('uid-1')).toBeDefined();
    snapshot.clear();
    expect(displaySetStore.getDisplaySet('uid-1')).toBeDefined();
    expect(displaySetStore.getDisplaySetSnapshot()).not.toBe(snapshot);
  });

  it('interops with metaData.getTyped through the DISPLAY_SET module', () => {
    const displaySet = makeDisplaySet('uid-typed');
    displaySetStore.setDisplaySet(displaySet);
    expect(metaData.getTyped(Enums.MetadataModules.DISPLAY_SET, 'uid-typed')).toBe(displaySet);
  });

  it('survives an external typed-cache wipe by pruning its index', () => {
    displaySetStore.setDisplaySet(makeDisplaySet('uid-1'));
    csMetadataUtilities.clearCacheData();
    expect(displaySetStore.getDisplaySet('uid-1')).toBeUndefined();
    expect(displaySetStore.getAllDisplaySets()).toEqual([]);
  });

  it('does not clear cs3d-native DISPLAY_SET entries on clearDisplaySets', () => {
    const nativeKey = 'wadors://example/native-image-id';
    csMetadataUtilities.setCacheData(Enums.MetadataModules.DISPLAY_SET, nativeKey, {
      displaySetId: 'native',
    });
    displaySetStore.setDisplaySet(makeDisplaySet('uid-1'));
    displaySetStore.clearDisplaySets();
    expect(csMetadataUtilities.getCacheData(Enums.MetadataModules.DISPLAY_SET, nativeKey)).toEqual({
      displaySetId: 'native',
    });
    csMetadataUtilities.clearTypedCacheData(Enums.MetadataModules.DISPLAY_SET, nativeKey);
  });
});
