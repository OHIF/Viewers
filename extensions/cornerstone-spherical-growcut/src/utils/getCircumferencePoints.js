import cornerstoneMath from 'cornerstone-math';

export default function getCircumferencePoints(start, end, width, height) {
  const radius = cornerstoneMath.point.distance(start, end);
  const circumferencePoints = [];

  for (let i = 0; i < 360; i++) {
    const angleRadians = (i * Math.PI) / 180;
    let x = radius * Math.cos(angleRadians) + start.x;

    x = Math.min(x, width);
    x = Math.max(x, 0);
    let y = radius * Math.sin(angleRadians) + start.y;

    y = Math.min(y, height);
    y = Math.max(y, 0);

    circumferencePoints.push({
      x,
      y,
    });
  }

  return circumferencePoints;
}
