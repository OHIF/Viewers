import {
  getImageId
} from './getImageId';
import {
  dicomWebConfig,
  naturalizedInstances,
} from './data.test';

describe('getImageId', () => {


  it('make sure we generate the correct image id', () => {
    const instance = Array.from(naturalizedInstances).pop();
    const expected = 'wadors:https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.16.124.113543.6004.101.103.20021117.190619.1/series/2.16.124.113543.6004.101.103.20021117.190619.1.001/instances/1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574/frames/1';
    const result = getImageId(instance, null, dicomWebConfig);
    expect(result).toStrictEqual(expected);
  });


  it('make sure we generate the correct image id with frame specified', () => {
    const instance = Array.from(naturalizedInstances).pop();
    const expected = 'wadors:https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.16.124.113543.6004.101.103.20021117.190619.1/series/2.16.124.113543.6004.101.103.20021117.190619.1.001/instances/1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574/frames/2';
    const result = getImageId(instance, 2, dicomWebConfig);
    expect(result).toStrictEqual(expected);
  });
});
