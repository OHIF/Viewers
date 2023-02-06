import queryString from 'query-string';
import dicomParser from 'dicom-parser';
import { imageIdToURI } from '../utils';
import getPixelSpacingInformation from '../utils/metadataProvider/getPixelSpacingInformation';
import DicomMetadataStore from '../services/DicomMetadataStore';
import fetchPaletteColorLookupTableData from '../utils/metadataProvider/fetchPaletteColorLookupTableData';
import toNumber from '../utils/toNumber';
import combineFrameInstance from '../utils/combineFrameInstance';

class MetadataProvider {
  constructor() {
    // Define the main "metadataLookup" private property as an immutable property.
    Object.defineProperty(this, 'studies', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: new Map(),
    });
    Object.defineProperty(this, 'imageURIToUIDs', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: new Map(),
    });
    // Can be used to store custom metadata for a specific type.
    // For instance, the scaling metadata for PET can be stored here
    // as type "scalingModule"
    //
    Object.defineProperty(this, 'customMetadata', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: new Map(),
    });
  }

  addImageIdToUIDs(imageId, uids) {
    // This method is a fallback for when you don't have WADO-URI or WADO-RS.
    // You can add instances fetched by any method by calling addInstance, and hook an imageId to point at it here.
    // An example would be dicom hosted at some random site.
    const imageURI = imageIdToURI(imageId);
    this.imageURIToUIDs.set(imageURI, uids);
  }

  addCustomMetadata(imageId, type, metadata) {
    const imageURI = imageIdToURI(imageId);
    if (!this.customMetadata.has(type)) {
      this.customMetadata.set(type, {});
    }

    this.customMetadata.get(type)[imageURI] = metadata;
  }

  _getInstance(imageId) {
    const uids = this.getUIDsFromImageID(imageId);

    if (!uids) {
      return;
    }

    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID,
      frameNumber,
    } = uids;

    const instance = DicomMetadataStore.getInstance(
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID
    );
    return (
      (frameNumber && combineFrameInstance(frameNumber, instance)) || instance
    );
  }

  get(query, imageId, options = { fallback: false }) {
    const instance = this._getInstance(imageId);

    if (query === INSTANCE) {
      return instance;
    }

    // check inside custom metadata
    if (this.customMetadata.has(query)) {
      const customMetadata = this.customMetadata.get(query);
      const imageURI = imageIdToURI(imageId);
      if (customMetadata[imageURI]) {
        return customMetadata[imageURI];
      }
    }

    return this.getTagFromInstance(query, instance, options);
  }

  getTag(query, imageId, options) {
    return this.get(query, imageId, options);
  }

  getInstance(imageId) {
    return this.get(INSTANCE, imageId);
  }

  getTagFromInstance(
    naturalizedTagOrWADOImageLoaderTag,
    instance,
    options = { fallback: false }
  ) {
    if (!instance) {
      return;
    }

    // If its a naturalized dcmjs tag present on the instance, return.
    if (instance[naturalizedTagOrWADOImageLoaderTag]) {
      return instance[naturalizedTagOrWADOImageLoaderTag];
    }

    // Maybe its a legacy CornerstoneWADOImageLoader tag then:
    return this._getCornerstoneWADOImageLoaderTag(
      naturalizedTagOrWADOImageLoaderTag,
      instance
    );
  }

  _getCornerstoneWADOImageLoaderTag(wadoImageLoaderTag, instance) {
    let metadata;

    switch (wadoImageLoaderTag) {
      case WADO_IMAGE_LOADER_TAGS.GENERAL_SERIES_MODULE:
        const { SeriesDate, SeriesTime } = instance;

        let seriesDate;
        let seriesTime;

        if (SeriesDate) {
          seriesDate = dicomParser.parseDA(SeriesDate);
        }

        if (SeriesTime) {
          seriesTime = dicomParser.parseTM(SeriesTime);
        }

        metadata = {
          modality: instance.Modality,
          seriesInstanceUID: instance.SeriesInstanceUID,
          seriesNumber: toNumber(instance.SeriesNumber),
          studyInstanceUID: instance.StudyInstanceUID,
          seriesDate,
          seriesTime,
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.PATIENT_STUDY_MODULE:
        metadata = {
          patientAge: toNumber(instance.PatientAge),
          patientSize: toNumber(instance.PatientSize),
          patientWeight: toNumber(instance.PatientWeight),
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.PATIENT_DEMOGRAPHIC_MODULE:
        metadata = {
          patientSex: instance.PatientSex,
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.IMAGE_PLANE_MODULE:
        const { ImageOrientationPatient } = instance;

        // Fallback for DX images.
        // TODO: We should use the rest of the results of this function
        // to update the UI somehow
        const { PixelSpacing } = getPixelSpacingInformation(instance);

        let rowPixelSpacing;
        let columnPixelSpacing;

        let rowCosines;
        let columnCosines;

        if (PixelSpacing) {
          rowPixelSpacing = PixelSpacing[0];
          columnPixelSpacing = PixelSpacing[1];
        }

        if (ImageOrientationPatient) {
          rowCosines = ImageOrientationPatient.slice(0, 3);
          columnCosines = ImageOrientationPatient.slice(3, 6);
        }

        metadata = {
          frameOfReferenceUID: instance.FrameOfReferenceUID,
          rows: toNumber(instance.Rows),
          columns: toNumber(instance.Columns),
          imageOrientationPatient: toNumber(ImageOrientationPatient),
          rowCosines: toNumber(rowCosines || [0, 1, 0]),
          columnCosines: toNumber(columnCosines || [0, 0, -1]),
          imagePositionPatient: toNumber(
            instance.ImagePositionPatient || [0, 0, 0]
          ),
          sliceThickness: toNumber(instance.SliceThickness),
          sliceLocation: toNumber(instance.SliceLocation),
          pixelSpacing: toNumber(PixelSpacing || 1),
          rowPixelSpacing: toNumber(rowPixelSpacing || 1),
          columnPixelSpacing: toNumber(columnPixelSpacing || 1),
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.IMAGE_PIXEL_MODULE:
        metadata = {
          samplesPerPixel: toNumber(instance.SamplesPerPixel),
          photometricInterpretation: instance.PhotometricInterpretation,
          rows: toNumber(instance.Rows),
          columns: toNumber(instance.Columns),
          bitsAllocated: toNumber(instance.BitsAllocated),
          bitsStored: toNumber(instance.BitsStored),
          highBit: toNumber(instance.HighBit),
          pixelRepresentation: toNumber(instance.PixelRepresentation),
          planarConfiguration: toNumber(instance.PlanarConfiguration),
          pixelAspectRatio: toNumber(instance.PixelAspectRatio),
          smallestPixelValue: toNumber(instance.SmallestPixelValue),
          largestPixelValue: toNumber(instance.LargestPixelValue),
          redPaletteColorLookupTableDescriptor: toNumber(
            instance.RedPaletteColorLookupTableDescriptor
          ),
          greenPaletteColorLookupTableDescriptor: toNumber(
            instance.GreenPaletteColorLookupTableDescriptor
          ),
          bluePaletteColorLookupTableDescriptor: toNumber(
            instance.BluePaletteColorLookupTableDescriptor
          ),
          redPaletteColorLookupTableData: fetchPaletteColorLookupTableData(
            instance,
            'RedPaletteColorLookupTableData',
            'RedPaletteColorLookupTableDescriptor'
          ),
          greenPaletteColorLookupTableData: fetchPaletteColorLookupTableData(
            instance,
            'GreenPaletteColorLookupTableData',
            'GreenPaletteColorLookupTableDescriptor'
          ),
          bluePaletteColorLookupTableData: fetchPaletteColorLookupTableData(
            instance,
            'BluePaletteColorLookupTableData',
            'BluePaletteColorLookupTableDescriptor'
          ),
        };

        break;
      case WADO_IMAGE_LOADER_TAGS.VOI_LUT_MODULE:
        const { WindowCenter, WindowWidth, VOILUTFunction } = instance;
        if (WindowCenter === undefined || WindowWidth === undefined) {
          return;
        }
        const windowCenter = Array.isArray(WindowCenter)
          ? WindowCenter
          : [WindowCenter];
        const windowWidth = Array.isArray(WindowWidth)
          ? WindowWidth
          : [WindowWidth];

        metadata = {
          windowCenter: toNumber(windowCenter),
          windowWidth: toNumber(windowWidth),
          voiLUTFunction: VOILUTFunction,
        };

        break;
      case WADO_IMAGE_LOADER_TAGS.MODALITY_LUT_MODULE:
        const { RescaleIntercept, RescaleSlope } = instance;
        if (RescaleIntercept === undefined || RescaleSlope === undefined) {
          return;
        }

        metadata = {
          rescaleIntercept: toNumber(instance.RescaleIntercept),
          rescaleSlope: toNumber(instance.RescaleSlope),
          rescaleType: instance.RescaleType,
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.SOP_COMMON_MODULE:
        metadata = {
          sopClassUID: instance.SOPClassUID,
          sopInstanceUID: instance.SOPInstanceUID,
        };
        break;
      case WADO_IMAGE_LOADER_TAGS.PET_ISOTOPE_MODULE:
        const { RadiopharmaceuticalInformationSequence } = instance;

        if (RadiopharmaceuticalInformationSequence) {
          const RadiopharmaceuticalInformation = Array.isArray(
            RadiopharmaceuticalInformationSequence
          )
            ? RadiopharmaceuticalInformationSequence[0]
            : RadiopharmaceuticalInformationSequence;

          const {
            RadiopharmaceuticalStartTime,
            RadionuclideTotalDose,
            RadionuclideHalfLife,
          } = RadiopharmaceuticalInformation;

          const radiopharmaceuticalInfo = {
            radiopharmaceuticalStartTime: dicomParser.parseTM(
              RadiopharmaceuticalStartTime
            ),
            radionuclideTotalDose: RadionuclideTotalDose,
            radionuclideHalfLife: RadionuclideHalfLife,
          };
          metadata = {
            radiopharmaceuticalInfo,
          };
        }

        break;
      case WADO_IMAGE_LOADER_TAGS.OVERLAY_PLANE_MODULE:
        const overlays = [];

        for (
          let overlayGroup = 0x00;
          overlayGroup <= 0x1e;
          overlayGroup += 0x02
        ) {
          let groupStr = `60${overlayGroup.toString(16)}`;

          if (groupStr.length === 3) {
            groupStr = `600${overlayGroup.toString(16)}`;
          }

          const OverlayDataTag = `${groupStr}3000`;
          const OverlayData = instance[OverlayDataTag];

          if (!OverlayData) {
            continue;
          }

          const OverlayRowsTag = `${groupStr}0010`;
          const OverlayColumnsTag = `${groupStr}0011`;
          const OverlayType = `${groupStr}0040`;
          const OverlayOriginTag = `${groupStr}0050`;
          const OverlayDescriptionTag = `${groupStr}0022`;
          const OverlayLabelTag = `${groupStr}1500`;
          const ROIAreaTag = `${groupStr}1301`;
          const ROIMeanTag = `${groupStr}1302`;
          const ROIStandardDeviationTag = `${groupStr}1303`;
          const OverlayOrigin = instance[OverlayOriginTag];

          const overlay = {
            rows: instance[OverlayRowsTag],
            columns: instance[OverlayColumnsTag],
            type: instance[OverlayType],
            x: OverlayOrigin[0],
            y: OverlayOrigin[1],
            pixelData: OverlayData,
            description: instance[OverlayDescriptionTag],
            label: instance[OverlayLabelTag],
            roiArea: instance[ROIAreaTag],
            roiMean: instance[ROIMeanTag],
            roiStandardDeviation: instance[ROIStandardDeviationTag],
          };

          overlays.push(overlay);
        }

        metadata = {
          overlays,
        };

        break;

      case WADO_IMAGE_LOADER_TAGS.PATIENT_MODULE:
        const { PatientName } = instance;

        let patientName;
        if (PatientName) {
          patientName = PatientName.Alphabetic;
        }

        metadata = {
          patientName,
          patientId: instance.PatientID,
        };

        break;

      case WADO_IMAGE_LOADER_TAGS.GENERAL_IMAGE_MODULE:
        metadata = {
          sopInstanceUid: instance.SOPInstanceUID,
          instanceNumber: toNumber(instance.InstanceNumber),
          lossyImageCompression: instance.LossyImageCompression,
          lossyImageCompressionRatio: instance.LossyImageCompressionRatio,
          lossyImageCompressionMethod: instance.LossyImageCompressionMethod,
        };

        break;
      case WADO_IMAGE_LOADER_TAGS.GENERAL_STUDY_MODULE:
        metadata = {
          studyDescription: instance.StudyDescription,
          studyDate: instance.StudyDate,
          studyTime: instance.StudyTime,
          accessionNumber: instance.AccessionNumber,
        };

        break;
      case WADO_IMAGE_LOADER_TAGS.CINE_MODULE:
        metadata = {
          frameTime: instance.FrameTime,
        };

        break;
      default:
        return;
    }

    return metadata;
  }

  getUIDsFromImageID(imageId) {
    // TODO: adding csiv here is not really correct. Probably need to use
    // metadataProvider.addImageIdToUIDs(imageId, {
    //   StudyInstanceUID,
    //   SeriesInstanceUID,
    //   SOPInstanceUID,
    // })
    // somewhere else
    if (imageId.startsWith('wadors:')) {
      const strippedImageId = imageId.split('/studies/')[1];
      const splitImageId = strippedImageId.split('/');

      return {
        StudyInstanceUID: splitImageId[0], // Note: splitImageId[1] === 'series'
        SeriesInstanceUID: splitImageId[2], // Note: splitImageId[3] === 'instances'
        SOPInstanceUID: splitImageId[4],
        frameNumber: splitImageId[6],
      };
    } else if (imageId.includes('?requestType=WADO')) {
      const qs = queryString.parse(imageId);

      return {
        StudyInstanceUID: qs.studyUID,
        SeriesInstanceUID: qs.seriesUID,
        SOPInstanceUID: qs.objectUID,
        frameNumber: qs.frameNumber,
      };
    }

    // Maybe its a non-standard imageId
    // check if the imageId starts with http:// or https:// using regex
    // Todo: handle non http imageIds
    let imageURI;
    const urlRegex = /^(http|https):\/\//;
    if (urlRegex.test(imageId)) {
      imageURI = imageId;
    } else {
      imageURI = imageIdToURI(imageId);
    }

    const uids = this.imageURIToUIDs.get(imageURI);
    const frameNumber = imageId.split(/\/frames\//)[1];

    if (uids && frameNumber !== undefined) {
      return { ...uids, frameNumber };
    }
    return uids;
  }
}

const metadataProvider = new MetadataProvider();

export default metadataProvider;

const WADO_IMAGE_LOADER_TAGS = {
  // CornerstoneWADOImageLoader specific
  GENERAL_SERIES_MODULE: 'generalSeriesModule',
  PATIENT_STUDY_MODULE: 'patientStudyModule',
  IMAGE_PLANE_MODULE: 'imagePlaneModule',
  IMAGE_PIXEL_MODULE: 'imagePixelModule',
  VOI_LUT_MODULE: 'voiLutModule',
  MODALITY_LUT_MODULE: 'modalityLutModule',
  SOP_COMMON_MODULE: 'sopCommonModule',
  PET_ISOTOPE_MODULE: 'petIsotopeModule',
  OVERLAY_PLANE_MODULE: 'overlayPlaneModule',
  PATIENT_DEMOGRAPHIC_MODULE: 'patientDemographicModule',

  // react-cornerstone-viewport specifc
  PATIENT_MODULE: 'patientModule',
  GENERAL_IMAGE_MODULE: 'generalImageModule',
  GENERAL_STUDY_MODULE: 'generalStudyModule',
  CINE_MODULE: 'cineModule',
};

const INSTANCE = 'instance';
