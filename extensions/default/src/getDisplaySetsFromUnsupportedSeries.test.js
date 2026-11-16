import getDisplaySetsFromUnsupportedSeries from './getDisplaySetsFromUnsupportedSeries';

describe('getDisplaySetsFromUnsupportedSeries', () => {
  it('sets the instance of the display set to the last instance', () => {
    const instances = [
      { SOPInstanceUID: '1', SeriesInstanceUID: 's', StudyInstanceUID: 't', SOPClassUID: 'x' },
      { SOPInstanceUID: '2', SeriesInstanceUID: 's', StudyInstanceUID: 't', SOPClassUID: 'x' },
    ];

    const [displaySet] = getDisplaySetsFromUnsupportedSeries(instances);

    expect(displaySet.instance).toBe(instances[1]);
  });
});
