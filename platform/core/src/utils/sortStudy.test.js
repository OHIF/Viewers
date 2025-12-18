import { compareSeriesUID, addSameSeriesCompare, compare } from './sortStudy';

addSameSeriesCompare('default', (a,b) => compare(a.default,b.default), 5);
const altCompare = 'altCompare'
addSameSeriesCompare(altCompare, (a,b) => compare(a.altCompare,b.altCompare), 3);

const ds1 = {
  SeriesInstanceUID: '1',
  default: 'ds1',
}

const ds2 = {
  ...ds1,
  default: 'ds2',
}

const ds3 = {
  ...ds2,
  altCompare: 3,
  compareSameSeries: altCompare,
}

const ds4 = {
  ...ds1,
  altCompare:4,
  compareSameSeries: altCompare,
}

const ds5 = {
  ...ds1,
  SeriesInstanceUID: '3',
}

describe('sortStudy', () => {
  test('compareSameSeries',() => {
    const initial = [ds5, ds4,ds3,ds2,ds1];
    initial.sort(compareSeriesUID);
    expect(initial[0]).toBe(ds1);
    expect(initial[1]).toBe(ds2);
    expect(initial[2]).toBe(ds3);
    expect(initial[3]).toBe(ds4);
    expect(initial[4]).toBe(ds5);
  })
})
