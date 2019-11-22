import arrayToDataset from "./arrayToDataset";

export default function getDatasetPair(
  backgroundVolume,
  labelmapVolume,
  extent
) {
  const backgroundDataset = arrayToDataset(backgroundVolume, extent);
  const labelmapDataset = arrayToDataset(labelmapVolume, extent);

  return { backgroundDataset, labelmapDataset };
}
