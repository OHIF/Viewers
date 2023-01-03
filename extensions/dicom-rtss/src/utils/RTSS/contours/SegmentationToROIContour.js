import * as cs from '@cornerstonejs/core';
//import { vtkImageMarchingSquares } from '@kitware/vtk.js/Filters/General/ImageMarchingSquares';
import vtkImageMarchingSquares from '@kitware/vtk.js/Filters/General/ImageMarchingSquares';

import * as contourUtils from './contourUtils';

class SegmentationToROIContour {
  construction() {}

  static async convert(segmentations, metadataProvider) {
    console.log('>>>convert');
    //segmentations = SegmentationService.getSegmentations();
    console.log(segmentations);

    const ROIContours = [];

    //const vol = cs.volumeLoader.loadVolume(segmentations[0].volumeId);
    //console.log(vol);
    //cs.volumeLoader.loadVolume(segmentations[0].volumeId).then(vol => {
    //  cs.volumeLoader.loadVolume(vol.referencedVolumeId).then(imageVol => {

    await segmentations.forEach(async (segmentation, segIndex) => {
      const vol = await cs.volumeLoader.loadVolume(segmentation.volumeId);
      const imageVol = await cs.volumeLoader.loadVolume(vol.referencedVolumeId);

      //console.log(vol);
      //console.log(imageVol);
      //console.log(vol.imageData);
      //console.log(vol.imageData.getBounds());
      //console.log(vol.imageData.getCellData().getArrays());
      //console.log(vol.imageData.getFieldData().getArrays());
      //console.log(vol.imageData.getPointData().getArrays());

      const numSlices = vol.dimensions[2];

      const segData = vol.imageData
        .getPointData()
        .getArrays()[0]
        .getData();
      console.log(segData);

      // NOTE: Workaround for marching squares not finding closed contors at
      // boundary of image volume, clear pixels along x-y border of volume
      const dataPerSlice = vol.dimensions[0] * vol.dimensions[1];
      for (let z = 0; z < numSlices; z++) {
        for (let y = 0; y < vol.dimensions[1]; y++) {
          for (let x = 0; x < vol.dimensions[0]; x++) {
            if (
              x === 0 ||
              y === 0 ||
              x === vol.dimensions[0] - 1 ||
              y === vol.dimensions[1] - 1
            ) {
              const index = x + y * vol.dimensions[0] + z * dataPerSlice;
              segData[index] = 0;
            }
          }
        }
      }

      // end workaround

      const contourSequence = [];

      for (let i = 0; i < numSlices; i++) {
        const mSquares = vtkImageMarchingSquares.newInstance({ slice: i });

        // Connect pipeline
        mSquares.setInputData(vol.imageData);
        const cValues = [];
        cValues[0] = 1; // number for thresholding
        mSquares.setContourValues(cValues);
        mSquares.setMergePoints(false);

        window['console']['time'] = function() {};
        window['console']['timeEnd'] = function() {};
        const msOutput = mSquares.getOutputData();
        window['console']['time'] = console.time;
        window['console']['timeEnd'] = console.timeEnd;

        const reducedSet = contourUtils.mergePoints.removeDuplicatePoints(
          msOutput
        );

        const unreducedSet = contourUtils.mergePoints.removeDuplicatePoints(
          msOutput,
          true // bypass for debugging
        );

        if (unreducedSet.points && unreducedSet.points.length > 0) {
          console.log(JSON.parse(JSON.stringify(unreducedSet)));
        }

        if (reducedSet.points && reducedSet.points.length > 0) {
          console.log(JSON.parse(JSON.stringify(reducedSet)));
          console.log(msOutput);
          console.log(JSON.parse(JSON.stringify(msOutput)));

          const contours = contourUtils.contourFinder.findContoursFromReducedSet(
            reducedSet.lines,
            reducedSet.points
          );

          console.log(JSON.parse(JSON.stringify(contours)));

          const processedContours = contourUtils.detectContourHoles.processContourHoles(
            contours,
            reducedSet.points
          );

          console.log(JSON.parse(JSON.stringify(processedContours)));

          /**
           * addContour - Adds a new ROI with related contours to ROIContourSequence
           *
           * @param {Object} newContour cornerstoneTools `ROIContour` object
           *
           * newContour = {
           *   name: string,
           *   description: string,
           *   contourSequence: array[contour]
           * }
           *
           * contour = {
           *   ContourImageSequence: array[
           *       { ReferencedSOPClassUID: string, ReferencedSOPInstanceUID: string}
           *     ]
           *   ContourGeometricType: string,
           *   NumberOfContourPoints: number,
           *   ContourData: array[number]
           * }
           */
          // Note: change needed if support non-planar contour representation is needed
          const sopCommon = metadataProvider.get(
            'sopCommonModule',
            imageVol.imageIds[i]
          );
          const ReferencedSOPClassUID = sopCommon.sopClassUID;
          const ReferencedSOPInstanceUID = sopCommon.sopInstanceUID;
          const ContourImageSequence = [
            //imageVol.imageIds[i],
            { ReferencedSOPClassUID, ReferencedSOPInstanceUID }, // NOTE: replace in dcmjs?
          ];
          contours.forEach((contour, index) => {
            const ContourGeometricType = contour.type;
            const NumberOfContourPoints = contour.contourPoints.length;
            const ContourData = [];

            contour.contourPoints.forEach(point => {
              const pointData = reducedSet.points[point];
              //pointData[0] = +pointData[0].toFixed(2);
              //pointData[1] = +pointData[1].toFixed(2);
              //pointData[2] = +pointData[2].toFixed(2);
              ContourData.push(pointData[0]);
              ContourData.push(pointData[1]);
              ContourData.push(pointData[2]);
            });

            contourSequence.push({
              ContourImageSequence,
              ContourGeometricType,
              NumberOfContourPoints,
              ContourNumber: index + 1,
              ContourData,
            });
          });
        }
      }

      const metadata = {
        referencedImageId: imageVol.imageIds[0], // just use 0
        FrameOfReferenceUID: imageVol.metadata.FrameOfReferenceUID,
      };

      const ROIContour = {
        name: segmentation.label || `Segmentation ${segIndex + 1}`,
        description: 'test contour description',
        contourSequence,
        metadata,
      };

      console.log(ROIContour);
      ROIContours.push(ROIContour);
    });

    console.log('<<<convert');
    return ROIContours;
  }
}

export default SegmentationToROIContour;
