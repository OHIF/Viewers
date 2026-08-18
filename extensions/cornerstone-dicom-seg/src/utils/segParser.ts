import { parseDicom } from 'dicom-parser';

/**
 * Parse DICOM SEG file and extract pixel data as a 3D mask array
 * @param arrayBuffer - DICOM SEG file as ArrayBuffer
 * @returns 3D mask array [frames][rows][columns] with values 0 or 1
 */
export function parseSegToMaskArray(arrayBuffer: ArrayBuffer): number[][][] {
  const dataSet = parseDicom(new Uint8Array(arrayBuffer));
  
  // Get dimensions with defaults
  const rows = dataSet.uint16('x00280010') || 512;
  const columns = dataSet.uint16('x00280011') || 512;
  const numberOfFrames = dataSet.uint16('x00280008') || 1;
  
  console.log(`SEG Parser: Dimensions ${numberOfFrames}x${rows}x${columns}`);
  
  // Get pixel data element
  const pixelDataElement = dataSet.elements.x7fe00010;
  if (!pixelDataElement) {
    throw new Error('Pixel Data not found in SEG file');
  }
  
  // Get raw pixel data using dicom-parser's byte array
  const pixelData = dataSet.byteArray;
  const pixelDataOffset = pixelDataElement.dataOffset;
  const pixelDataLength = pixelDataElement.length;
  
  // Calculate expected size
  const expectedSize = numberOfFrames * rows * columns;
  console.log(`SEG Parser: Expected pixel data size: ${expectedSize}, Actual: ${pixelDataLength}`);
  
  // Create 3D mask array
  const maskArray: number[][][] = [];
  
  for (let frame = 0; frame < numberOfFrames; frame++) {
    const frameData: number[][] = [];
    const frameOffset = pixelDataOffset + frame * rows * columns;
    
    for (let row = 0; row < rows; row++) {
      const rowData: number[] = [];
      const rowOffset = frameOffset + row * columns;
      
      for (let col = 0; col < columns; col++) {
        const pixelIndex = rowOffset + col;
        // Since we use 8-bit depth, each pixel is one byte
        const pixelValue = pixelData[pixelIndex] || 0;
        // Convert to binary mask (0 or 1)
        rowData.push(pixelValue > 0 ? 1 : 0);
      }
      
      frameData.push(rowData);
    }
    
    maskArray.push(frameData);
  }
  
  console.log(`SEG Parser: Successfully parsed ${maskArray.length} frames`);
  return maskArray;
}

/**
 * Load SEG file from URL and parse to mask array
 * @param url - URL to DICOM SEG file
 * @returns Promise resolving to 3D mask array
 */
export async function loadSegFromUrl(url: string): Promise<number[][][]> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return parseSegToMaskArray(arrayBuffer);
}

/**
 * Load SEG file from imageId and parse to mask array
 * @param imageId - Cornerstone imageId for SEG file
 * @returns Promise resolving to 3D mask array
 */
export async function loadSegFromImageId(imageId: string): Promise<number[][][]> {
  // Try to load the image using cornerstone's imageLoader
  const imageLoader = (window as any).cornerstone?.imageLoader;
  if (!imageLoader) {
    throw new Error('Cornerstone imageLoader not available');
  }
  
  const image = await imageLoader.loadImage(imageId).promise;
  return parseSegToMaskArray(image.data.byteArray);
}
