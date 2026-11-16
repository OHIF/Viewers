import { vec3 } from 'gl-matrix';
import { utilities as csUtils } from '@cornerstonejs/core';
import type { Types } from '@cornerstonejs/core';

const { asUnitNormal, createCircleShape, createRectangleShape, iterateVoxelsInShape } =
  csUtils.voxelSlab;

type VolumeGeometry = csUtils.voxelSlab.VolumeGeometry;

export type ROIThresholdRegion = {
  planePoint: Types.Point3;
  viewPlaneNormal: Types.Point3;
  referencePlaneThickness: number;
  getShapeRuns: csUtils.voxelSlab.ShapeRunProvider;
};

const CIRCLE_TOOLS = ['CircleROIStartEndThreshold'];
const RECTANGLE_TOOLS = ['RectangleROIThreshold', 'RectangleROIStartEndThreshold'];

/**
 * The exact voxel regions of the ROI threshold annotations, by the voxel membership
 * rule of the Cornerstone `voxelSlab` iterator (Rule M of cornerstone3D#2889).
 *
 * Each region is the drawn rectangle or circle, extruded along the view plane normal
 * from the start slice to the end slice, both inclusive. A tool without a start and an
 * end coordinate (`RectangleROIThreshold`) uses its own reference plane thickness,
 * which defaults to one voxel. Unlike the IJK bounding box, the region does not grow
 * when the view is oblique to the volume axes.
 *
 * Build all regions before a labelmap change, so that an invalid annotation changes
 * nothing.
 *
 * @throws when an annotation is not a supported tool or has no area
 */
export function getROIThresholdRegions(annotations, volume: VolumeGeometry): ROIThresholdRegion[] {
  return annotations.map(({ data, metadata }) => {
    const { toolName } = metadata;
    const isCircle = CIRCLE_TOOLS.includes(toolName);
    if (!isCircle && !RECTANGLE_TOOLS.includes(toolName)) {
      throw new Error(`ROI threshold does not support ${toolName} annotations`);
    }

    const viewPlaneNormal = asUnitNormal(metadata.viewPlaneNormal);
    const points = data.handles.points as Types.Point3[];
    const hasDepth = data.startCoordinate !== undefined && data.endCoordinate !== undefined;
    const startDepth = hasDepth ? getDepth(data.startCoordinate, points[0], viewPlaneNormal) : 0;
    const endDepth = hasDepth ? getDepth(data.endCoordinate, points[0], viewPlaneNormal) : 0;

    const center = isCircle
      ? vec3.clone(points[0] as vec3)
      : vec3.lerp(vec3.create(), points[0] as vec3, points[3] as vec3, 0.5);
    const planePoint = vec3.scaleAndAdd(
      vec3.create(),
      center,
      viewPlaneNormal as vec3,
      (startDepth + endDepth) / 2
    ) as Types.Point3;

    const shapeOptions = { volume, planePoint, viewPlaneNormal, centerWorld: planePoint };
    const shape = isCircle
      ? createCircleShape({
          ...shapeOptions,
          radius: vec3.distance(points[0] as vec3, points[1] as vec3),
        })
      : createRectangleShape({
          ...shapeOptions,
          majorAxis: vec3.sub(vec3.create(), points[1], points[0]) as Types.Point3,
          majorHalfLength: vec3.distance(points[0] as vec3, points[1] as vec3) / 2,
          minorHalfLength: vec3.distance(points[0] as vec3, points[2] as vec3) / 2,
        });

    return {
      planePoint,
      viewPlaneNormal,
      // 0 (start on the end slice) means one voxel, as the iterator defines it.
      referencePlaneThickness: hasDepth
        ? Math.abs(endDepth - startDepth)
        : metadata.planeRestriction?.referencePlaneThickness,
      getShapeRuns: shape.getRuns,
    };
  });
}

/**
 * Visit each voxel of `volume` inside the regions. A voxel in two overlapping regions
 * is visited twice. The `pointIJK` and `pointLPS` arrays are reused between calls.
 */
export function forEachVoxelInRegions(
  regions: ROIThresholdRegion[],
  volume: VolumeGeometry & { voxelManager: Types.IVoxelManager<number> },
  callback: (index: number, pointIJK: Types.Point3, pointLPS: Types.Point3) => void
): void {
  for (const region of regions) {
    for (const { ijk, center } of iterateVoxelsInShape({ volume, ...region })) {
      callback(volume.voxelManager.toIndex(ijk), ijk, center);
    }
  }
}

/**
 * Depth along the normal of a start or end coordinate, relative to `anchor`. The
 * StartEnd tools store the coordinate on the world axis closest to the normal, as a
 * number or as the matching component of a point.
 */
function getDepth(
  coordinate: number | Types.Point3,
  anchor: Types.Point3,
  normal: Types.Point3
): number {
  const axis = [0, 1, 2].reduce((best, i) =>
    Math.abs(normal[i]) > Math.abs(normal[best]) ? i : best
  );
  const value = typeof coordinate === 'number' ? coordinate : coordinate[axis];
  return (value - anchor[axis]) / normal[axis];
}
