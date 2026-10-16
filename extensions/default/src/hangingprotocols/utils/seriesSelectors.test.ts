import { HPMatcher } from '@ohif/core/src/services/HangingProtocolService/HPMatcher';
import { seriesWithImages } from './seriesSelectors';

const score = displaySet => HPMatcher.match(displaySet, seriesWithImages, {}, {}).score;

describe('seriesWithImages', () => {
  it('ranks image, ECG and SM display sets above display sets without frames', () => {
    const noFrames = score({ Modality: 'SR', numImageFrames: 0 });

    expect(score({ Modality: 'CT', numImageFrames: 10 })).toBeGreaterThan(noFrames);
    expect(score({ Modality: 'ECG', numImageFrames: 0 })).toBeGreaterThan(noFrames);
    expect(score({ Modality: 'SM', numImageFrames: 0 })).toBeGreaterThan(noFrames);
  });
});
