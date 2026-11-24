import { Enums } from '@cornerstonejs/core';
import { legacyViewportOperations } from '../services/ViewportService/backends/LegacyViewportOperations';
import { getVOILUTFunction, getVOILUTLabel, getWindowLevelReadout } from './voiLUTFunction';

describe('getVOILUTLabel', () => {
  it.each([
    ['LINEAR', false, undefined],
    [undefined, false, undefined],
    ['LINEAR_EXACT', false, 'Exact'],
    ['SIGMOID', false, 'Sigmoid'],
    ['LINEAR', true, 'VOI LUT'],
  ])('labels %s (sequence %s) as %s', (VOILUTFunction, sequence, expected) => {
    expect(getVOILUTLabel(VOILUTFunction, sequence)).toBe(expected);
  });
});

describe('LINEAR_EXACT window level round trip', () => {
  it('sets W 400 / C 40 as -160..240 and reads it back as W 400 / C 40', () => {
    const setProperties = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewport: any = {
      id: 'legacy-stack',
      type: Enums.ViewportType.STACK,
      getProperties: () => ({ VOILUTFunction: 'LINEAR_EXACT' }),
      setProperties,
    };

    legacyViewportOperations.setWindowLevel(viewport, { windowWidth: 400, windowCenter: 40 });
    const { voiRange } = setProperties.mock.calls[0][0];

    expect(voiRange).toEqual({ lower: -160, upper: 240 });
    expect(getWindowLevelReadout(voiRange, getVOILUTFunction(viewport))).toEqual({
      windowWidth: 400,
      windowCenter: 40,
    });
  });
});
