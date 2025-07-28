import { DicomMetadataStore } from '@ohif/core';

export function processLengthTool(measurement, im, displaySetService, seriesUID, sopInstanceUID, frameNumber, zCoord) {
  if (measurement.points.length >= 2) { 
    const point1World = [measurement.points[0][0], measurement.points[0][1], measurement.points[0][2]];
    const point2World = [measurement.points[1][0], measurement.points[1][1], measurement.points[1][2]];
    const textBoxWorldPosition = [
      (point1World[0] + point2World[0]) / 2,
      (point1World[1] + point2World[1]) / 2,
      (point1World[2] + point2World[2]) / 2,
    ];

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

    measurement.data.handles = {
      points: [point1World, point2World],
      textBox: {
        hasMoved: false,
        worldPosition: textBoxWorldPosition,
        worldBoundingBox: worldBoundingBox,
      },
      activeHandleIndex: null,
      start: { x: point1World[0], y: point1World[1], z: point1World[2] },
      end: { x: point2World[0], y: point2World[1], z: point2World[2] },
    };
  }
  
  let lengthValue = null;
  const stat = Array.isArray(im.measurements) && im.measurements.find((m: any) => m.name === 'length');
  if (stat && typeof stat.value === 'number' && stat.value > 0) {
    lengthValue = stat.value;
    measurement.data.length = stat.value;
  }

  if (!lengthValue && measurement.data.handles?.points?.length >= 2) {
    const p1 = measurement.data.handles.points[0];
    const p2 = measurement.data.handles.points[1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    lengthValue = Math.sqrt(dx * dx + dy * dy + dz * dz);
    measurement.data.length = lengthValue;
  }

  if (lengthValue && lengthValue > 0) {
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
      console.warn('Failed to generate secondary text:', e);
      secondaryText = 'S: 0 I: 1'; // Fallback
    }

    measurement.displayText = {
      primary: [`${lengthValue.toFixed(2)} mm`],
      secondary: [secondaryText],
    };
  } else {
    measurement.displayText = {
      primary: [measurement.label || 'Length'],
      secondary: ['S: 0 I: 1'], // Fallback secondary text
    };
  }
} 