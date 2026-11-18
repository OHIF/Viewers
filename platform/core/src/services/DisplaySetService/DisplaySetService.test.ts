import DisplaySetService from './DisplaySetService';

type TestDisplaySet = {
  displaySetInstanceUID: string;
  StudyInstanceUID: string;
  SeriesInstanceUID: string;
  SeriesNumber: number;
  Modality: string;
  numImageFrames: number;
  instances: Array<{ SOPInstanceUID: string }>;
};

const displaySet = (seriesNumber: number): TestDisplaySet => ({
  displaySetInstanceUID: `ds-${seriesNumber}`,
  StudyInstanceUID: 'study-1',
  SeriesInstanceUID: `series-${seriesNumber}`,
  SeriesNumber: seriesNumber,
  Modality: 'XA',
  numImageFrames: 10,
  instances: [{ SOPInstanceUID: `sop-${seriesNumber}` }],
});

const order = (service: DisplaySetService) =>
  service.getActiveDisplaySets().map(ds => ds.SeriesNumber);

const create = (servicesManager?) =>
  DisplaySetService.REGISTRATION.create({ configuration: {}, servicesManager } as never);

describe('DisplaySetService active display set order', () => {
  it('keeps the series number order whatever order the series arrive in', () => {
    const service = create();
    [1, 5, 2, 3, 4].forEach(n => service.addDisplaySets(displaySet(n) as never));
    expect(order(service)).toEqual([1, 2, 3, 4, 5]);
  });

  it('gives the same order for two different arrival orders', () => {
    const first = create();
    const second = create();
    [3, 1, 2].forEach(n => first.addDisplaySets(displaySet(n) as never));
    [2, 3, 1].forEach(n => second.addDisplaySets(displaySet(n) as never));
    expect(order(first)).toEqual(order(second));
  });

  it('returns the display set added last as the most recent one', () => {
    const service = create();
    [1, 5, 2].forEach(n => service.addDisplaySets(displaySet(n) as never));
    expect(service.getMostRecentDisplaySet().SeriesNumber).toBe(2);
  });

  it('uses the sortingCriteria customization when there is one', () => {
    const descending = (a, b) => b.SeriesNumber - a.SeriesNumber;
    const service = create({
      services: { customizationService: { getCustomization: () => descending } },
    });
    [1, 3, 2].forEach(n => service.addDisplaySets(displaySet(n) as never));
    expect(order(service)).toEqual([3, 2, 1]);
  });

  it('keeps a sort applied with sortDisplaySets for display sets added later', () => {
    const service = create();
    [1, 2].forEach(n => service.addDisplaySets(displaySet(n) as never));
    service.sortDisplaySets((a, b) => a.SeriesNumber - b.SeriesNumber, 'descending', true);
    service.addDisplaySets(displaySet(3) as never);
    expect(order(service)).toEqual([3, 2, 1]);
  });

  it('forgets the applied sort on mode exit', () => {
    const service = create();
    service.sortDisplaySets((a, b) => a.SeriesNumber - b.SeriesNumber, 'descending', true);
    service.onModeExit();
    [2, 1].forEach(n => service.addDisplaySets(displaySet(n) as never));
    expect(order(service)).toEqual([1, 2]);
  });
});
