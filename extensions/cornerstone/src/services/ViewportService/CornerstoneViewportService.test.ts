import { Enums } from '@cornerstonejs/core';
import CornerstoneViewportService from './CornerstoneViewportService';

// The native ("next") lane reports PLANAR_NEXT for both stack and volume mounts.
function makeService(numberOfSlices: number) {
  const service = new CornerstoneViewportService({} as AppTypes.ServicesManager);
  const getNumberOfSlices = jest.fn().mockReturnValue(numberOfSlices);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (service as any).getCornerstoneViewport = () => ({ getNumberOfSlices });
  return { service, getNumberOfSlices };
}

function makeViewportInfo(initialImageOptions) {
  return {
    getViewportId: () => 'mpr-axial',
    getViewportType: () => Enums.ViewportType.PLANAR_NEXT,
    getInitialImageOptions: () => initialImageOptions,
  };
}

describe('CornerstoneViewportService initialImageOptions on native viewports', () => {
  it('resolves first, last and index of a native volume in the view-order slice count', () => {
    const { service } = makeService(20);
    const resolve = options =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any)._getInitialImageIndexForViewport(makeViewportInfo(options));

    expect(resolve({ preset: 'first' })).toBe(0);
    expect(resolve({ preset: 'last' })).toBe(19);
    expect(resolve({ preset: 'middle' })).toBe(10);
    expect(resolve({ index: 30 })).toBe(19);
    expect(resolve(undefined)).toBeUndefined();
  });

  it('resolves a native stack from its imageIds, not from the viewport', () => {
    const { service, getNumberOfSlices } = makeService(1);
    const imageIds = Array.from({ length: 20 }, (_, i) => `imageId:${i}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const index = (service as any)._getInitialImageIndexForViewport(
      makeViewportInfo({ preset: 'last' }),
      imageIds
    );

    expect(index).toBe(19);
    expect(getNumberOfSlices).not.toHaveBeenCalled();
  });
});
