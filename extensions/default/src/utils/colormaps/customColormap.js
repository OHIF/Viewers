function customColormap() {
  // Define the number of points in the colormap
  const numPoints = 1000;

  // Define the HU range and breakpoints
  const huMin = 0;
  const huMax = 4000;
  const huLow = 910;
  const huMid = 1223;
  const huHigh = 1500;
  const huG = (huLow + huMid) / 2;
  const huB = (huMid + huHigh) / 2;

  // Define the color transitions
  const breakpoints = [
    [huMin, 'black'],
    [huLow / huMax, 'gray'],
    [huG / huMax, 'green'],
    [huMid / huMax, 'red'],
    [huB / huMax, 'blue'],
    [huHigh / huMax, 'gray'],
    [1, 'white'],
  ];

  // Create the colormap using LinearSegmentedColormap
  const colormap = createLinearSegmentedColormap(
    'custom_colormap',
    breakpoints,
    numPoints
  );
  console.log(colormap);
  // Initialize the array to store RGBPoints
  const RGBPoints = [];
  // Generate RGBPoints
  for (let i = 0; i < numPoints; i++) {
    const value = huMin + (huMax - huMin) * (i / (numPoints - 1));
    const normalizedValue = (value - huMin) / (huMax - huMin);
    const [r, g, b] = colormap;
    RGBPoints.push([normalizedValue, r, g, b]);
  }
  console.log(RGBPoints);
  return RGBPoints;
}

function createLinearSegmentedColormap(name, breakpoints, numPoints) {
  const colormap = [];

  for (let i = 0; i < numPoints; i++) {
    const value = i / (numPoints - 1);
    colormap.push(interpolateColor(value, breakpoints));
  }

  return colormap;
}

function interpolateColor(value, breakpoints) {
  for (let i = 1; i < breakpoints.length; i++) {
    const [prevValue, prevColor] = breakpoints[i - 1];
    const [nextValue, nextColor] = breakpoints[i];

    if (value <= nextValue) {
      const t = (value - prevValue) / (nextValue - prevValue);
      return interpolateRGB(prevColor, nextColor, t);
    }
  }

  return breakpoints[breakpoints.length - 1][1];
}

function interpolateRGB(startColor, endColor, t) {
  const startRGB = parseColor(startColor);
  const endRGB = parseColor(endColor);

  const r = Math.round(startRGB[0] + (endRGB[0] - startRGB[0]) * t);
  const g = Math.round(startRGB[1] + (endRGB[1] - startRGB[1]) * t);
  const b = Math.round(startRGB[2] + (endRGB[2] - startRGB[2]) * t);

  return [r, g, b];
}

function parseColor(color) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

// Usage
const RGBPoints = customColormap();
console.log('RGBPoints =', RGBPoints);
export default customColormap;
