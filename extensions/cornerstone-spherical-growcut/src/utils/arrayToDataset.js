import * as dcmjs from "dcmjs";

export default function arrayToDataset(PixelData, extent) {
  const { width, height, numFrames } = extent;
  const spacings = [1, 1, 1];

  const dataset = {
    // TODO -> Why does most of this matter for this calculation?
    // It seems most of it was mandatory for other tangled bits of STEP.
    // Doesn't matter, just to stop derivation breaking.
    SOPClassUID:
      dcmjs.data.DicomMetaDictionary.sopClassUIDsByName.EnhancedCTImage,
    Columns: String(width),
    Rows: String(height),
    NumberOfFrames: String(numFrames),
    SamplesPerPixel: 1,
    BitsStored: 16,
    HighBit: 15,
    WindowCenter: ["84"],
    WindowWidth: ["168"],
    BitsAllocated: 16,
    PixelRepresentation: 1,
    RescaleSlope: "1",
    RescaleIntercept: "0",
    SharedFunctionalGroupsSequence: {
      PlaneOrientation: {
        ImageOrientationPatient: [
          String(1),
          String(0),
          String(0),
          String(0),
          String(1),
          String(0)
        ]
      },
      PixelMeasuresSequence: {
        PixelSpacing: [String(spacings[0]), String(spacings[1])],
        SpacingBetweenSlices: String(spacings[2])
      },
      PixelValueTransformation: {
        RescaleIntercept: "0",
        RescaleSlope: "1",
        RescaleType: "US"
      }
    },
    PixelData,
    _vrMap: {},
    _meta: {}
  };

  dataset.PerFrameFunctionalGroupsSequence = [];

  const origin = [0, 0, 0];

  for (let imageIdIndex = 0; imageIdIndex < numFrames; imageIdIndex++) {
    dataset.PerFrameFunctionalGroupsSequence.push({
      PlanePosition: {
        ImagePositionPatient: [
          String(origin[0]),
          String(origin[1]),
          String(origin[2] + imageIdIndex)
        ]
      }
    });
  }

  return dataset;
}
