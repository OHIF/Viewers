export function processRectangleROI(measurement, im, displaySetService, seriesUID, sopInstanceUID, frameNumber) {
  if (measurement.points.length >= 4) {
    const avgX = measurement.points.reduce((sum, point) => {
      const x = Array.isArray(point) ? point[0] : (point && typeof point === 'object' ? point.x : 0);
      return sum + x;
    }, 0) / measurement.points.length;

    const avgY = measurement.points.reduce((sum, point) => {
      const y = Array.isArray(point) ? point[1] : (point && typeof point === 'object' ? point.y : 0);
      return sum + y;
    }, 0) / measurement.points.length;

    const avgZ = measurement.points.reduce((sum, point) => {
      const z = Array.isArray(point) ? (point[2] || 0) : (point && typeof point === 'object' ? (point.z || 0) : 0);
      return sum + z;
    }, 0) / measurement.points.length;

    const textBoxWorldPosition = [avgX, avgY, avgZ];

    const textBoxSize = 50; // Approximate text box size in world coordinates
    const halfSize = textBoxSize / 2;

    const worldBoundingBox = {
      topLeft: [
        textBoxWorldPosition[0] - halfSize,
        textBoxWorldPosition[1] + halfSize,
        textBoxWorldPosition[2]
      ],
      topRight: [
        textBoxWorldPosition[0] + halfSize,
        textBoxWorldPosition[1] + halfSize,
        textBoxWorldPosition[2]
      ],
      bottomLeft: [
        textBoxWorldPosition[0] - halfSize,
        textBoxWorldPosition[1] - halfSize,
        textBoxWorldPosition[2]
      ],
      bottomRight: [
        textBoxWorldPosition[0] + halfSize,
        textBoxWorldPosition[1] - halfSize,
        textBoxWorldPosition[2]
      ],
    };

    const formattedPoints = measurement.points.map(point => {
      if (Array.isArray(point)) {
        return [point[0], point[1], point[2] || 0];
      } else if (point && typeof point === 'object' && 'x' in point) {
        return [point.x, point.y, point.z || 0];
      } else {
        console.warn('Unexpected point format for RectangleROI:', point);
        return [0, 0, 0];
      }
    });

    measurement.points = formattedPoints;

    measurement.data.handles = {
      points: formattedPoints,
      textBox: {
        hasMoved: false,
        worldPosition: textBoxWorldPosition,
        worldBoundingBox: worldBoundingBox,
      },
    };
  } else if (im.data?.handles) {
    if (im.data.handles.points && Array.isArray(im.data.handles.points)) {
      const formattedPoints = im.data.handles.points.map((point: any) => {
        if (Array.isArray(point)) {
          return [point[0], point[1], point[2] || 0];
        } else if (point && typeof point === 'object' && 'x' in point) {
          return [point.x, point.y, point.z || 0];
        } else {
          console.warn('Unexpected point format in handles.points:', point);
          return [0, 0, 0];
        }
      });

      measurement.points = formattedPoints;
      measurement.data.handles = {
        ...im.data.handles,
        points: formattedPoints
      };
    } else if (im.data.handles.corner1 && im.data.handles.corner2) {
      measurement.points = [
        [im.data.handles.corner1.x, im.data.handles.corner1.y, im.data.handles.corner1.z || 0],
        [im.data.handles.corner2.x, im.data.handles.corner2.y, im.data.handles.corner2.z || 0],
      ];
      measurement.data.handles = im.data.handles;
    } else {
      const handleValues = Object.values(im.data.handles).filter(
        (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
      );
      measurement.points = handleValues.map((h: any) => [h.x, h.y, h.z || 0]);
      measurement.data.handles = im.data.handles;
    }
  }

  if (im.measurements && im.measurements.length > 0) {
    const stats = im.measurements;
    const displayValues = [];

    stats.forEach(stat => {
      if (stat.value !== undefined && stat.value !== null && typeof stat.value === 'number') {
        displayValues.push(`${stat.name}: ${stat.value.toFixed(2)} ${stat.unit || ''}`);
      }
    });

    let secondaryText = '';
    try {
      const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);
      if (displaySets && displaySets.length > 0) {
        const displaySet = displaySets[0];
        const SeriesNumber = displaySet.SeriesNumber || '0';

        let InstanceNumber = '';
        if (displaySet.instances && displaySet.instances.length > 0) {
          const instance = displaySet.instances.find(img => img.SOPInstanceUID === sopInstanceUID);
          if (instance) {
            InstanceNumber = instance.InstanceNumber || '';
          }
        }

        const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
        const frameText = displaySet.isMultiFrame && frameNumber > 1 ? ` F: ${frameNumber}` : '';

        secondaryText = `S: ${SeriesNumber}${instanceText}${frameText}`;
      }
    } catch (e) {
      console.warn('Failed to generate secondary text for RectangleROI:', e);
      secondaryText = 'S: 0 I: 1';
    }

    measurement.displayText = {
      primary: displayValues.length > 0 ? displayValues : [measurement.label || 'RectangleROI'],
      secondary: [secondaryText],
    };
  } else {
    measurement.displayText = {
      primary: [measurement.label || 'RectangleROI'],
      secondary: ['S: 0 I: 1'],
    };
  }
}

export function processEllipticalROI(measurement, im, displaySetService, seriesUID, sopInstanceUID, frameNumber) {
  measurement.data.handles = {};

  if (im.data?.cachedStats) {
    measurement.data.cachedStats = im.data.cachedStats;
  }

  let hasValidHandles = false;

  const exportedHandles = im.data?.handles;

  if (exportedHandles) {
    if (exportedHandles.center && exportedHandles.end) {
      measurement.data.handles = {
        center: {
          x: exportedHandles.center.x,
          y: exportedHandles.center.y,
          z: exportedHandles.center.z || 0
        },
        end: {
          x: exportedHandles.end.x,
          y: exportedHandles.end.y,
          z: exportedHandles.end.z || 0
        }
      };

      measurement.points = [
        [exportedHandles.center.x, exportedHandles.center.y, exportedHandles.center.z || 0],
        [exportedHandles.end.x, exportedHandles.end.y, exportedHandles.end.z || 0],
      ];
      hasValidHandles = true;
    } else if (exportedHandles.points && Array.isArray(exportedHandles.points)) {
      if (exportedHandles.points.length >= 4) {
        measurement.data.handles = {
          points: exportedHandles.points.map((pt: any) => ({
            x: pt.x,
            y: pt.y,
            z: pt.z || 0
          }))
        };
        measurement.points = exportedHandles.points.map((pt: any) => [pt.x, pt.y, pt.z || 0]);
        hasValidHandles = true;
      } else if (exportedHandles.points.length >= 2) {
        const firstPoint = exportedHandles.points[0];
        const secondPoint = exportedHandles.points[1];

        measurement.data.handles = {
          center: {
            x: firstPoint.x,
            y: firstPoint.y,
            z: firstPoint.z || 0
          },
          end: {
            x: secondPoint.x,
            y: secondPoint.y,
            z: secondPoint.z || 0
          }
        };

        measurement.points = exportedHandles.points.map((pt: any) => [pt.x, pt.y, pt.z || 0]);
        hasValidHandles = true;
      }
    } else {
      const handleValues = Object.values(exportedHandles).filter(
        (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
      );

      if (handleValues.length >= 2) {
        const firstHandle = handleValues[0] as any;
        const secondHandle = handleValues[1] as any;

        measurement.data.handles = {
          center: {
            x: firstHandle.x,
            y: firstHandle.y,
            z: firstHandle.z || 0
          },
          end: {
            x: secondHandle.x,
            y: secondHandle.y,
            z: secondHandle.z || 0
          }
        };

        measurement.points = handleValues.map((h: any) => [h.x, h.y, h.z || 0]);
        hasValidHandles = true;
      }
    }
  }

  if (!hasValidHandles && measurement.points && measurement.points.length >= 2) {
    if (measurement.toolName === 'RectangleROI' && measurement.points.length >= 4) {
      measurement.data.handles = {
        points: measurement.points.map((pt: any) => ({
          x: pt[0],
          y: pt[1],
          z: pt[2] || 0
        }))
      };
    } else {
      measurement.data.handles = {
        center: {
          x: measurement.points[0][0],
          y: measurement.points[0][1],
          z: measurement.points[0][2] || 0
        },
        end: {
          x: measurement.points[1][0],
          y: measurement.points[1][1],
          z: measurement.points[1][2] || 0
        }
      };
    }
    hasValidHandles = true;
  }

  if (!hasValidHandles) {
    if (measurement.toolName === 'RectangleROI') {
      const defaultPoints = [
        { x: 100, y: 100, z: 0 },
        { x: 200, y: 100, z: 0 },
        { x: 100, y: 200, z: 0 },
        { x: 200, y: 200, z: 0 }
      ];

      measurement.data.handles = {
        points: defaultPoints
      };

      measurement.points = defaultPoints.map(pt => [pt.x, pt.y, pt.z]);
    } else {
      const defaultCenter = { x: 100, y: 100, z: 0 };
      const defaultEnd = { x: 150, y: 100, z: 0 };

      measurement.data.handles = {
        center: defaultCenter,
        end: defaultEnd
      };

      measurement.points = [
        [defaultCenter.x, defaultCenter.y, defaultCenter.z],
        [defaultEnd.x, defaultEnd.y, defaultEnd.z]
      ];
    }

    hasValidHandles = true;
  }

  if (!measurement.data.handles.textBox) {
    measurement.data.handles.textBox = {
      hasMoved: false,
      worldPosition: [0, 0, 0],
      worldBoundingBox: {
        topLeft: [0, 0, 0],
        topRight: [0, 0, 0],
        bottomLeft: [0, 0, 0],
        bottomRight: [0, 0, 0]
      }
    };
  }

  if (measurement.data.handles.center && measurement.data.handles.textBox) {
    measurement.data.handles.textBox.worldPosition = [
      measurement.data.handles.center.x,
      measurement.data.handles.center.y,
      measurement.data.handles.center.z || 0
    ];

    const textBoxSize = 50;
    const halfSize = textBoxSize / 2;
    const centerX = measurement.data.handles.center.x;
    const centerY = measurement.data.handles.center.y;
    const centerZ = measurement.data.handles.center.z || 0;

    measurement.data.handles.textBox.worldBoundingBox = {
      topLeft: [centerX - halfSize, centerY + halfSize, centerZ],
      topRight: [centerX + halfSize, centerY + halfSize, centerZ],
      bottomLeft: [centerX - halfSize, centerY - halfSize, centerZ],
      bottomRight: [centerX + halfSize, centerY - halfSize, centerZ],
    };
  }

  if (measurement.toolName === 'Bidirectional' && measurement.data.handles.start && measurement.data.handles.end && measurement.data.handles.textBox) {
    const centerX = (measurement.data.handles.start.x + measurement.data.handles.end.x) / 2;
    const centerY = (measurement.data.handles.start.y + measurement.data.handles.end.y) / 2;
    const centerZ = (measurement.data.handles.start.z + measurement.data.handles.end.z) / 2;

    measurement.data.handles.textBox.worldPosition = [centerX, centerY, centerZ];

    const textBoxSize = 50;
    const halfSize = textBoxSize / 2;

    measurement.data.handles.textBox.worldBoundingBox = {
      topLeft: [centerX - halfSize, centerY + halfSize, centerZ],
      topRight: [centerX + halfSize, centerY + halfSize, centerZ],
      bottomLeft: [centerX - halfSize, centerY - halfSize, centerZ],
      bottomRight: [centerX + halfSize, centerY - halfSize, centerZ],
    };
  }

  if (im.measurements && im.measurements.length > 0 && measurement.toolName !== 'PlanarFreehandROI' && measurement.toolName !== 'SplineROI' && measurement.toolName !== 'LivewireContour') {
    const stats = im.measurements;
    const displayValues = [];

    stats.forEach(stat => {
      if (stat.value !== undefined && stat.value !== null && typeof stat.value === 'number') {
        displayValues.push(`${stat.name}: ${stat.value.toFixed(2)} ${stat.unit || ''}`);
      }
    });

    let secondaryText = '';
    try {
      const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);
      if (displaySets && displaySets.length > 0) {
        const displaySet = displaySets[0];
        const SeriesNumber = displaySet.SeriesNumber || '0';

        let InstanceNumber = '';
        if (displaySet.instances && displaySet.instances.length > 0) {
          const instance = displaySet.instances.find(img => img.SOPInstanceUID === sopInstanceUID);
          if (instance) {
            InstanceNumber = instance.InstanceNumber || '';
          }
        }

        const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
        const frameText = displaySet.isMultiFrame && frameNumber > 1 ? ` F: ${frameNumber}` : '';

        secondaryText = `S: ${SeriesNumber}${instanceText}${frameText}`;
      }
    } catch (e) {
      console.warn('Failed to generate secondary text for ROI tool:', e);
      secondaryText = 'S: 0 I: 1';
    }

    measurement.displayText = {
      primary: displayValues.length > 0 ? displayValues : [measurement.label || measurement.toolName],
      secondary: [secondaryText],
    };
  } else {
    measurement.displayText = {
      primary: [measurement.label || measurement.toolName],
      secondary: ['S: 0 I: 1'],
    };
  }

  if (im.data?.cachedStats) {
    measurement.data.cachedStats = im.data.cachedStats;
  }

  if ((!measurement.data.handles.center || !measurement.data.handles.end) && measurement.toolName !== 'PlanarFreehandROI' && measurement.toolName !== 'SplineROI' && measurement.toolName !== 'LivewireContour') {
    if (!measurement.data.handles.center && measurement.points && measurement.points.length > 0) {
      measurement.data.handles.center = {
        x: measurement.points[0][0],
        y: measurement.points[0][1],
        z: measurement.points[0][2] || 0
      };
    }

    if (!measurement.data.handles.end && measurement.points && measurement.points.length > 1) {
      measurement.data.handles.end = {
        x: measurement.points[1][0],
        y: measurement.points[1][1],
        z: measurement.points[1][2] || 0
      };
    }
  }

  if (measurement.data.handles.activeHandleIndex === undefined) {
    measurement.data.handles.activeHandleIndex = null;
  }

  if (!measurement.data.handles.points && measurement.toolName !== 'PlanarFreehandROI' && measurement.toolName !== 'SplineROI' && measurement.toolName !== 'LivewireContour') {
    measurement.data.handles.points = [
      [measurement.data.handles.center.x, measurement.data.handles.center.y, measurement.data.handles.center.z || 0],
      [measurement.data.handles.end.x, measurement.data.handles.end.y, measurement.data.handles.end.z || 0]
    ];
  }

  if (!measurement.data.handles.invalidated) {
    measurement.data.handles.invalidated = false;
  }

  if (!measurement.data.handles.highlighted) {
    measurement.data.handles.highlighted = false;
  }

  if (!measurement.data.handles.locked) {
    measurement.data.handles.locked = false;
  }

  if (!measurement.data.handles.visible) {
    measurement.data.handles.visible = true;
  }

  if (measurement.toolName === 'EllipticalROI' || measurement.toolName === 'EllipticalRoi') {
    if (measurement.points && measurement.points.length >= 4) {
      const [point1, point2, point3, point4] = measurement.points;

      const centerX = (point1[0] + point2[0] + point3[0] + point4[0]) / 4;
      const centerY = (point1[1] + point2[1] + point3[1] + point4[1]) / 4;
      const centerZ = (point1[2] + point2[2] + point3[2] + point4[2]) / 4;

      measurement.data.handles = {
        center: { x: centerX, y: centerY, z: centerZ },
        end: { x: point1[0], y: point1[1], z: point1[2] },
        start: { x: point2[0], y: point2[1], z: point2[2] },
        perpendicularStart: { x: point3[0], y: point3[1], z: point3[2] },
        perpendicularEnd: { x: point4[0], y: point4[1], z: point4[2] },
        points: measurement.points,
        activeHandleIndex: null,
        invalidated: false,
        highlighted: false,
        locked: false,
        visible: true
      };

    } else if (measurement.points && measurement.points.length >= 2) {
      const [point1, point2] = measurement.points;

      measurement.data.handles = {
        center: { x: point1[0], y: point1[1], z: point1[2] },
        end: { x: point2[0], y: point2[1], z: point2[2] },
        start: { x: point1[0], y: point1[1], z: point1[2] },
        perpendicularStart: { x: point1[0], y: point1[1], z: point1[2] },
        perpendicularEnd: { x: point2[0], y: point2[1], z: point2[2] },
        points: [
          [point1[0], point1[1], point1[2]],
          [point2[0], point2[1], point2[2]],
          [point1[0], point1[1], point1[2]],
          [point2[0], point2[1], point2[2]]
        ],
        activeHandleIndex: null,
        invalidated: false,
        highlighted: false,
        locked: false,
        visible: true
      };

    } else {
      const defaultCenter = { x: 100, y: 100, z: 0 };
      const defaultEnd = { x: 150, y: 100, z: 0 };

      measurement.data.handles = {
        center: defaultCenter,
        end: defaultEnd,
        start: defaultCenter,
        perpendicularStart: defaultCenter,
        perpendicularEnd: defaultEnd,
        points: [
          [defaultCenter.x, defaultCenter.y, defaultCenter.z],
          [defaultEnd.x, defaultEnd.y, defaultEnd.z],
          [defaultCenter.x, defaultCenter.y, defaultCenter.z],
          [defaultEnd.x, defaultEnd.y, defaultEnd.z]
        ],
        activeHandleIndex: null,
        invalidated: false,
        highlighted: false,
        locked: false,
        visible: true
      };
    }
  }
} 