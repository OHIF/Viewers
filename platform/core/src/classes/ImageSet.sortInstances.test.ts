import ImageSet from './ImageSet';

/**
 * `sortInstances` is the seam the split-rule path needs: OHIF's default instance
 * order applied to a *supplied* list, so a rule's own comparator can be layered
 * over it instead of replacing it.
 *
 * The composition itself lives in `@cornerstonejs/metadata`
 * (`orderInstancesForRule`) and is tested there; what matters here is that this
 * method is the same order `sort()` produces, and that it orders the list it is
 * handed rather than `this.images`.
 */
describe('ImageSet.sortInstances', () => {
  const instance = (SOPInstanceUID: string, InstanceNumber: number) => ({
    SOPInstanceUID,
    InstanceNumber,
    SeriesInstanceUID: 'series-1',
  });

  const customizationService = (
    instanceSortingCriteria: Record<string, unknown> = {
      sortFunctions: {},
      defaultSortFunctionName: '',
    }
  ) => ({ getCustomization: () => instanceSortingCriteria });

  it('produces the same order as sort()', () => {
    const unsorted = [instance('c', 3), instance('a', 1), instance('b', 2)];

    const viaSort = new ImageSet([...unsorted]);
    viaSort.sort(customizationService());

    const viaSortInstances = new ImageSet([...unsorted]);
    const ordered = viaSortInstances.sortInstances([...unsorted], customizationService());

    expect(ordered.map(i => i.SOPInstanceUID)).toEqual(viaSort.images.map(i => i.SOPInstanceUID));
    expect(ordered.map(i => i.SOPInstanceUID)).toEqual(['a', 'b', 'c']);
  });

  it('orders the supplied list, not this.images', () => {
    const imageSet = new ImageSet([instance('x', 9)]);
    const other = [instance('c', 3), instance('a', 1)];

    const ordered = imageSet.sortInstances(other, customizationService());

    expect(ordered.map(i => i.SOPInstanceUID)).toEqual(['a', 'c']);
    // `this.images` is untouched, which is what lets the split-rule path order a
    // group's instances before deciding what to do with them.
    expect(imageSet.images.map(i => i.SOPInstanceUID)).toEqual(['x']);
  });

  it('honours a customized sort function', () => {
    const imageSet = new ImageSet([]);
    const descending = customizationService({
      sortFunctions: {
        byInstanceNumberDescending: (a, b) => b.InstanceNumber - a.InstanceNumber,
      },
      defaultSortFunctionName: 'byInstanceNumberDescending',
    });

    const ordered = imageSet.sortInstances(
      [instance('a', 1), instance('c', 3), instance('b', 2)],
      descending
    );

    expect(ordered.map(i => i.SOPInstanceUID)).toEqual(['c', 'b', 'a']);
  });

  it('is a base a comparator can defer to by returning 0', () => {
    // The shape the split-rule path relies on: sort by OHIF's criteria, then
    // stable-sort with a comparator that only has an opinion about one instance.
    // Everything it declines on must keep the base order.
    const imageSet = new ImageSet([]);
    const base = imageSet.sortInstances(
      [instance('a', 1), instance('b', 2), instance('c', 3)],
      customizationService()
    );

    const ordered = [...base].sort((x, y) => {
      if (x.SOPInstanceUID === 'c') {
        return -1;
      }
      if (y.SOPInstanceUID === 'c') {
        return 1;
      }
      return 0;
    });

    expect(ordered.map(i => i.SOPInstanceUID)).toEqual(['c', 'a', 'b']);
  });
});
