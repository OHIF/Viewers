import { _ } from 'meteor/underscore';
import { getWADORSImageId } from './getWADORSImageId';
import { WadoRsMetaDataBuilder } from './classes/metadata/WadoRsMetaDataBuilder';

function getRadiopharmaceuticalInfoMetaData(instance) {
    const radiopharmaceuticalInfo = instance.radiopharmaceuticalInfo;

    if ((instance.modality !== 'PT') || !radiopharmaceuticalInfo) {
        return;
    }

    return new WadoRsMetaDataBuilder()
        .addTag('00181072', radiopharmaceuticalInfo.radiopharmaceuticalStartTime)
        .addTag('00181074', radiopharmaceuticalInfo.radionuclideTotalDose)
        .addTag('00181075', radiopharmaceuticalInfo.radionuclideHalfLife)
        .toJSON();
}

const getWadoRsInstanceMetaData = (study, series, instance) => {
    return new WadoRsMetaDataBuilder()
        .addTag('00080016', instance.sopClassUid)
        .addTag('00080018', instance.sopInstanceUid)
        .addTag('00080021', series.seriesDate)
        .addTag('00080031', series.seriesTime)
        .addTag('00080060', instance.modality)
        .addTag('00101010', study.patientAge)
        .addTag('00101020', study.patientSize)
        .addTag('00101030', study.patientWeight)
        .addTag('00180050', instance.sliceThickness)
        .addTag('0020000e', series.seriesInstanceUid)
        .addTag('00200011', series.seriesNumber)
        .addTag('0020000d', study.studyInstanceUid)
        .addTag('00200013', instance.instanceNumber)
        .addTag('00200032', instance.imagePositionPatient, true)
        .addTag('00200037', instance.imageOrientationPatient, true)
        .addTag('00200052', instance.frameOfReferenceUID)
        .addTag('00201041', instance.sliceLocation)
        .addTag('00280002', instance.samplesPerPixel)
        .addTag('00280004', instance.photometricInterpretation)
        .addTag('00280006', instance.planarConfiguration)
        .addTag('00280010', instance.rows)
        .addTag('00280011', instance.columns)
        .addTag('00280030', instance.pixelSpacing, true)
        .addTag('00280034', instance.pixelAspectRatio, true)
        .addTag('00280100', instance.bitsAllocated)
        .addTag('00280101', instance.bitsStored)
        .addTag('00280102', instance.highBit)
        .addTag('00280103', instance.pixelRepresentation)
        .addTag('00280106', instance.smallestPixelValue)
        .addTag('00280107', instance.largestPixelValue)
        .addTag('00281050', instance.windowCenter, true)
        .addTag('00281051', instance.windowWidth, true)
        .addTag('00281052', instance.rescaleIntercept)
        .addTag('00281053', instance.rescaleSlope)
        .addTag('00281054', instance.rescaleType)
        .addTag('00281101', instance.redPaletteColorLookupTableDescriptor)
        .addTag('00281102', instance.greenPaletteColorLookupTableDescriptor)
        .addTag('00281103', instance.bluePaletteColorLookupTableDescriptor)
        .addTag('00281201', instance.redPaletteColorLookupTableData)
        .addTag('00281202', instance.greenPaletteColorLookupTableData)
        .addTag('00281203', instance.bluePaletteColorLookupTableData)
        .addTag('00540016', getRadiopharmaceuticalInfoMetaData(instance))
        .toJSON();
};

export function updateMetaDataManager(study) {
    study.seriesList.forEach(series => {
        series.instances.forEach(instance => {
            // Cache just images that are going to be loaded via WADO-RS
            if ((instance.imageRendering !== 'wadors') && (instance.thumbnailRendering !== 'wadors')) {
                return;
            }

            const metaData = getWadoRsInstanceMetaData(study, series, instance);
            const numberOfFrames = instance.numberOfFrames || 1;

            // We can share the same metaData with all frames because it doesn't have
            // any frame specific data, such as frameNumber, pixelData, offset, etc.
            // WADO-RS frame number is 1-based
            for (let frameNumber = 0; frameNumber < numberOfFrames; frameNumber++) {
                const imageId = getWADORSImageId(instance, frameNumber);
                cornerstoneWADOImageLoader.wadors.metaDataManager.add(imageId, metaData);
            }
        });
    });
}
