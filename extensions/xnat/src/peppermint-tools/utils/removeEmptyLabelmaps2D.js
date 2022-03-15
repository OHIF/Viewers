

export default function removeEmptyLabelmaps2D(
  labelmap3D
) {
  let toRemoveList = [];
  labelmap3D.labelmaps2D.forEach((labelmap2D, index) => {
    const hasNonZero = labelmap2D.segmentsOnLabelmap.some(seg => seg !== 0);
    if (!hasNonZero) {
      toRemoveList.push(index);
    }
  });

  toRemoveList.forEach(i => {
    delete labelmap3D.labelmaps2D[i];
  });
}