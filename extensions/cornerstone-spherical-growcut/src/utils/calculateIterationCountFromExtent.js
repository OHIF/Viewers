export default function calculateNumberOfIterations(extent) {
  return Math.floor(
    Math.sqrt(
      Math.pow(extent.width, 2) +
        Math.pow(extent.height, 2) +
        Math.pow(extent.numFrames, 2)
    ) / 2
  );
}
