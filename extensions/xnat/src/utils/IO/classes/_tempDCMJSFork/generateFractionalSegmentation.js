import cornerstone from '@ohif/core/src/cornerstone';

export default function generateFractionalSegmentation(
  dcmjs,
  imageIds,
  labelmap3D
) {
  return new Promise(async resolve => {
    const imagePromises = imageIds.map(cornerstone.loadAndCacheImage);
    const images = await Promise.all(imagePromises);

    const segBlob = dcmjs.adapters.Cornerstone.Segmentation.generateSegmentation(
      images,
      [labelmap3D],
      { rleEncode: false }
    );

    // Modify the buffer as needed for now.
    const buffer = await segBlob.arrayBuffer();
    const { width, height } = images[0];
    const { DicomMessage, DicomMetaDictionary, datasetToBlob } = dcmjs.data;

    const dicomData = DicomMessage.readFile(buffer);
    const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);

    dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);

    // Set fractional and copy pixeldata in as fractional.
    dataset.BitsAllocated = '8';
    dataset.BitsStored = '8';
    dataset.HighBit = '7';
    dataset.SegmentationType = 'FRACTIONAL';
    dataset.SegmentationFractionalType = 'PROBABILITY';
    dataset.MaximumFractionalValue = '255';
    dataset._meta.TransferSyntaxUID.Value[0] = '1.2.840.10008.1.2.1';
    // Dataset._vrMap.PixelData = "OW";

    const newBuffer = new ArrayBuffer(width * height * 2); // 2 Segmentation frames.
    const newBufferUInt8View = new Uint8Array(newBuffer);
    const labelmapBufferView = new Uint16Array(
      labelmap3D.buffer,
      0,
      width * height
    ); // 2 as only first frame.
    const probabilityBufferView = new Uint8Array(
      labelmap3D.probabilityBuffer,
      0,
      width * height
    ); // 2 as only first frame.

    let pixelIndex = 0;

    for (let segmentIndex = 1; segmentIndex <= 2; segmentIndex++) {
      for (let p = 0; p < labelmapBufferView.length; p++) {
        if (labelmapBufferView[p] === segmentIndex) {
          newBufferUInt8View[pixelIndex] = probabilityBufferView[p];
        }
        pixelIndex++;
      }
    }

    dataset.PixelData = newBuffer;

    const newSegBlob = datasetToBlob(dataset);

    resolve(newSegBlob);
  });
}
