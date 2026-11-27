import { Enums } from '@cornerstonejs/core';
import { rotateVolume3D, setVolume3DViewDirection } from './volume3dView';

// Legacy volume3d viewport: the adapter reads getCamera and writes setCamera.
function makeViewport(type = Enums.ViewportType.VOLUME_3D) {
  let camera = { focalPoint: [0, 0, 0], position: [0, 0, 10], viewUp: [0, 1, 0] };
  return {
    type,
    getCamera: () => camera,
    setCamera: jest.fn(patch => (camera = { ...camera, ...patch })),
    render: jest.fn(),
  };
}

const rounded = (point: number[]) => point.map(value => Math.round(value * 1e6) / 1e6 + 0);

describe('volume3dView', () => {
  it('looks from anterior: camera at -y (LPS), same distance, superior up', () => {
    const viewport = makeViewport();
    setVolume3DViewDirection(viewport as never, 'A');
    const camera = viewport.getCamera();
    expect(rounded(camera.position)).toEqual([0, -10, 0]);
    expect(camera.viewUp).toEqual([0, 0, 1]);
    expect(viewport.render).toHaveBeenCalled();
  });

  it('orbits about the superior axis: 90 degrees takes anterior to left', () => {
    const viewport = makeViewport();
    setVolume3DViewDirection(viewport as never, 'A');
    expect(rotateVolume3D(viewport as never, 90)).toBe(true);
    expect(rounded(viewport.getCamera().position)).toEqual([10, 0, 0]);
    expect(rounded(viewport.getCamera().viewUp)).toEqual([0, 0, 1]);
  });

  it('does nothing on a viewport that is not volume3d', () => {
    const viewport = makeViewport(Enums.ViewportType.ORTHOGRAPHIC);
    expect(rotateVolume3D(viewport as never, 90)).toBe(false);
    setVolume3DViewDirection(viewport as never, 'A');
    expect(viewport.setCamera).not.toHaveBeenCalled();
  });
});
