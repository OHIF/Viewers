import { utils } from '@ohif/core';
import { resolveThumbnailDetails } from './resolveThumbnailDetails';
import thumbnailDetailsCustomization, {
  thumbnailDetailSources,
  thumbnailDetailTests,
} from '../../customizations/thumbnailDetailsCustomization';

const { formatDate, formatTime } = utils;

const defaultItems = thumbnailDetailsCustomization['studyBrowser.thumbnailDetails'];

const resolve = (items, displaySet) =>
  resolveThumbnailDetails({
    items,
    displaySet,
    sources: thumbnailDetailSources,
    tests: thumbnailDetailTests,
    formatters: { formatDate, formatTime },
  });

const displaySet = (overrides = {}) => ({
  displaySetInstanceUID: 'ds1',
  SeriesNumber: 5,
  SeriesDate: '20260817',
  SeriesTime: '090000',
  instances: [{}, {}, {}],
  instance: { SeriesDate: '20260817', SeriesTime: '090000' },
  ...overrides,
});

describe('resolveThumbnailDetails', () => {
  // The thumbnails have always shown the series number and the instance count,
  // so that is what the default items have to come to.
  it('defaults to the series number and the instance count', () => {
    expect(resolve(defaultItems, displaySet())).toEqual([
      { id: 'SeriesNumber', label: 'S:', title: '', value: '5', iconName: undefined },
      { id: 'InstanceCount', label: '', title: '', value: '3', iconName: 'InfoSeries' },
    ]);
  });

  it('uses the display set count icon when it has one', () => {
    const [, count] = resolve(defaultItems, displaySet({ countIcon: 'icon-mpr' }));

    expect(count.iconName).toBe('icon-mpr');
  });

  it('counts a multiframe display set by its frames', () => {
    const [, count] = resolve(defaultItems, displaySet({ numImageFrames: 60 }));

    expect(count.value).toBe('60');
  });

  it('takes a value from a named source', () => {
    const items = [{ id: 'SeriesDate', label: '', source: 'seriesDate' }];

    expect(resolve(items, displaySet())[0].value).toBe(formatDate('20260817'));
  });

  it('takes a value from a source function', () => {
    const items = [{ id: 'Modality', contentF: ({ displaySet }) => displaySet.Modality }];

    expect(resolve(items, displaySet({ Modality: 'SEG' }))[0].value).toBe('SEG');
  });

  it('takes a value from an attribute of the instance the display set shows', () => {
    const items = [{ id: 'SOPInstanceUID', attribute: 'SOPInstanceUID' }];
    const ds = displaySet({ instance: { SOPInstanceUID: '1.2.3.4' } });

    expect(resolve(items, ds)[0].value).toBe('1.2.3.4');
  });

  // With no items at all - no customization was resolved - the thumbnail has to
  // be left showing the default detail line it stands alone with, which an
  // empty array would replace with an empty line.
  it('resolves to nothing when there are no items to resolve', () => {
    expect(resolve(undefined, displaySet())).toBeUndefined();
    expect(resolve([], displaySet())).toEqual([]);
  });

  it('leaves out an item with no value', () => {
    const items = [{ id: 'SeriesDate', source: 'seriesDate' }];

    expect(resolve(items, displaySet({ SeriesDate: undefined, instance: {} }))).toEqual([]);
  });

  // A `studyBrowser.thumbnailDetailSources` override written with `$set` rather
  // than `$merge` takes the sources the default items name away with it.  That
  // must not blank the series number and instance count on every thumbnail, so
  // a line left empty only by names that could not be resolved is not honoured
  // as an empty line - the thumbnail keeps the default one it stands alone with.
  it('resolves to nothing when nothing was left after an unresolved name', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(
      resolveThumbnailDetails({
        items: defaultItems,
        displaySet: displaySet(),
        sources: { somethingElse: () => 'x' },
        tests: thumbnailDetailTests,
        formatters: { formatDate, formatTime },
      })
    ).toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });

  describe('condition', () => {
    const items = [
      { id: 'InstanceDateTime', source: 'instanceDateTime', condition: 'isDerivedDisplaySet' },
    ];

    it('includes the item when a named test passes', () => {
      const ds = displaySet({ isDerivedDisplaySet: true });

      expect(resolve(items, ds).map(detail => detail.id)).toEqual(['InstanceDateTime']);
    });

    it('leaves the item out when a named test fails', () => {
      expect(resolve(items, displaySet({ isDerivedDisplaySet: false }))).toEqual([]);
    });

    it('leaves the item out when it names a test that is not registered', () => {
      const unknown = [
        { id: 'X', source: 'seriesNumber', condition: 'noSuchTest' },
        { id: 'SeriesDate', source: 'seriesDate' },
      ];
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(resolve(unknown, displaySet()).map(detail => detail.id)).toEqual(['SeriesDate']);
      expect(console.warn).toHaveBeenCalled();
    });

    it('accepts a test function', () => {
      const withFunction = [
        {
          id: 'X',
          source: 'seriesNumber',
          condition: ({ displaySet }) => displaySet.SeriesNumber > 9,
        },
      ];

      expect(resolve(withFunction, displaySet({ SeriesNumber: 10 }))).toHaveLength(1);
      expect(resolve(withFunction, displaySet({ SeriesNumber: 5 }))).toHaveLength(0);
    });
  });

  describe('instanceDateTime source', () => {
    const items = [{ id: 'InstanceDateTime', source: 'instanceDateTime' }];

    // A report saved into an existing series keeps that series' date and time,
    // so the date shown has to be the one of the instance the display set shows
    // - which is also the one the series list is sorted by.
    it('reports the creation date/time of the instance, not the series one', () => {
      const ds = displaySet({
        instance: {
          SeriesDate: '20260817',
          SeriesTime: '090000',
          ContentDate: '20260819',
          ContentTime: '143012',
        },
      });

      expect(resolve(items, ds)[0].value).toBe(`${formatDate('20260819')} 14:30`);
    });

    // Nothing below minutes: the second a report was written is noise.
    it('shows no seconds', () => {
      expect(resolve(items, displaySet())[0].value).toBe(`${formatDate('20260817')} 09:00`);
    });

    it('shows the date alone when the instance has no time', () => {
      const ds = displaySet({ instance: { SeriesDate: '20260817' } });

      expect(resolve(items, ds)[0].value).toBe(formatDate('20260817'));
    });

    it('falls back to the display set when it has no instance', () => {
      const ds = displaySet({ instance: undefined });

      expect(resolve(items, ds)[0].value).toBe(`${formatDate('20260817')} 09:00`);
    });
  });
});
