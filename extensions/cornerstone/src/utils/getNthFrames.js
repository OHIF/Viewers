export default function getNthFrames(imageIds) {
  const frames = [[], [], [], [], []];
  const centerStart = imageIds.length / 2 - 3;
  const centerEnd = centerStart + 6;

  for (let i = 0; i < imageIds.length; i++) {
    if (
      i < 2 ||
      i > imageIds.length - 4 ||
      (i > centerStart && i < centerEnd)
    ) {
      frames[0].push(imageIds[i]);
    } else if (i % 7 === 2) {
      frames[1].push(imageIds[i]);
    } else if (i % 7 === 5) {
      frames[2].push(imageIds[i]);
    } else {
      frames[(i % 2) + 3].push(imageIds[i]);
    }
  }
  const ret = [
    ...frames[0],
    ...frames[1],
    ...frames[2],
    ...frames[3],
    ...frames[4],
  ];
  return ret;
}
