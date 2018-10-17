import { cornerstoneMath } from 'meteor/ohif:cornerstone';
import { parsingUtils } from '../parsingUtils';

const FUNCTION = 'function';

export class MetadataProvider {

    constructor() {

        // Define the main "metadataLookup" private property as an immutable property.
        Object.defineProperty(this, 'metadataLookup', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: new Map()
        });

        // Local reference to provider function bound to current instance.
        Object.defineProperty(this, '_provider', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: null
        });

    }

    /**
     * Cornerstone Metadata provider to store image meta data
     * Data from instances, series, and studies are associated with
     * imageIds to facilitate usage of this information by Cornerstone's Tools
     *
     * e.g. the imagePlane metadata object contains instance information about
     * row/column pixel spacing, patient position, and patient orientation. It
     * is used in CornerstoneTools to position reference lines and orientation markers.
     *
     * @param {String} imageId The Cornerstone ImageId
     * @param {Object} data An object containing instance, series, and study metadata
     */
    addMetadata(imageId, data) {
        const instanceMetadata = data.instance;
        const seriesMetadata = data.series;
        const studyMetadata = data.study;
        const numImages = data.numImages;
        const metadata = {};

        metadata.frameNumber = data.frameNumber;

        metadata.study = {
            accessionNumber: studyMetadata.accessionNumber,
            patientId: studyMetadata.patientId,
            studyInstanceUid: studyMetadata.studyInstanceUid,
            studyDate: studyMetadata.studyDate,
            studyTime: studyMetadata.studyTime,
            studyDescription: studyMetadata.studyDescription,
            institutionName: studyMetadata.institutionName,
            patientHistory: studyMetadata.patientHistory
        };

        metadata.series = {
            seriesDescription: seriesMetadata.seriesDescription,
            seriesNumber: seriesMetadata.seriesNumber,
            seriesDate: seriesMetadata.seriesDate,
            seriesTime: seriesMetadata.seriesTime,
            modality: seriesMetadata.modality,
            seriesInstanceUid: seriesMetadata.seriesInstanceUid,
            numImages: numImages
        };

        metadata.instance = instanceMetadata;

        metadata.patient = {
            name: studyMetadata.patientName,
            id: studyMetadata.patientId,
            birthDate: studyMetadata.patientBirthDate,
            sex: studyMetadata.patientSex,
            age: studyMetadata.patientAge
        };

        // If there is sufficient information, populate
        // the imagePlane object for easier use in the Viewer
        metadata.imagePlane = this.getImagePlane(instanceMetadata);

        // Add the metadata to the imageId lookup object
        this.metadataLookup.set(imageId, metadata);
    }

    /**
     * Return the metadata for the given imageId
     * @param {String} imageId The Cornerstone ImageId
     * @returns image metadata
     */
    getMetadata(imageId) {
        return this.metadataLookup.get(imageId);
    }

    /**
     * Adds a set of metadata to the Cornerstone metadata provider given a specific
     * imageId, type, and dataset
     *
     * @param imageId
     * @param type (e.g. series, instance, tagDisplay)
     * @param data
     */
    addSpecificMetadata(imageId, type, data) {
        const metadata = {};
        metadata[type] = data;

        const oldMetadata = this.metadataLookup.get(imageId);
        this.metadataLookup.set(imageId, Object.assign(oldMetadata, metadata));
    }

    getFromImage(image, type, tag, attrName, defaultValue) {
        let value;

        if (image.data) {
            value = this.getFromDataSet(image.data, type, tag);
        } else {
            value = image.instance[attrName];
        }

        return value === null ? defaultValue : value;
    }

    getFromDataSet(dataSet, type, tag) {
        if (!dataSet) {
            return;
        }

        const fn = dataSet[type];
        if (!fn) {
            return;
        }

        return fn.call(dataSet, tag);
    }

    getFrameIncrementPointer(image) {
        const dataSet = image.data;
        let frameInstancePointer = '';

        if (parsingUtils.isValidDataSet(dataSet)) {
            const frameInstancePointerNames = {
                x00181063: 'frameTime',
                x00181065: 'frameTimeVector'
            };

            // (0028,0009) = Frame Increment Pointer
            const frameInstancePointerTag = parsingUtils.attributeTag(dataSet, 'x00280009');
            frameInstancePointer = frameInstancePointerNames[frameInstancePointerTag];
        } else {
            frameInstancePointer = image.instance.frameIncrementPointer;
        }

        return frameInstancePointer || '';
    }

    getFrameTimeVector(image) {
        const dataSet = image.data;

        if (parsingUtils.isValidDataSet(dataSet)) {
            // Frame Increment Pointer points to Frame Time Vector (0018,1065) field
            return parsingUtils.floatArray(dataSet, 'x00181065');
        }

        return image.instance.frameTimeVector;
    }

    getFrameTime(image) {
        const dataSet = image.data;

        if (parsingUtils.isValidDataSet(dataSet)) {
            // Frame Increment Pointer points to Frame Time (0018,1063) field or is not defined (for addtional flexibility).
            // Yet another value is possible for this field (5200,9230 for Multi-frame Functional Groups)
            // but that case is currently not supported.
            return dataSet.floatString('x00181063', -1);
        }

        return image.instance.frameTime;
    }

    /**
     * Updates the related metadata for missing fields given a specified image
     *
     * @param image
     */
    updateMetadata(image) {
        const imageMetadata = this.metadataLookup.get(image.imageId);
        if (!imageMetadata) {
            return;
        }

        imageMetadata.patient.age = imageMetadata.patient.age || this.getFromDataSet(image.data, 'string', 'x00101010');

        imageMetadata.instance.rows = imageMetadata.instance.rows || image.rows;
        imageMetadata.instance.columns = imageMetadata.instance.columns || image.columns;

        imageMetadata.instance.sopClassUid = imageMetadata.instance.sopClassUid || this.getFromDataSet(image.data, 'string', 'x00080016');
        imageMetadata.instance.sopInstanceUid = imageMetadata.instance.sopInstanceUid || this.getFromDataSet(image.data, 'string', 'x00080018');

        imageMetadata.instance.pixelSpacing = imageMetadata.instance.pixelSpacing || this.getFromDataSet(image.data, 'string', 'x00280030');
        imageMetadata.instance.frameOfReferenceUID = imageMetadata.instance.frameOfReferenceUID || this.getFromDataSet(image.data, 'string', 'x00200052');
        imageMetadata.instance.imageOrientationPatient = imageMetadata.instance.imageOrientationPatient || this.getFromDataSet(image.data, 'string', 'x00200037');
        imageMetadata.instance.imagePositionPatient = imageMetadata.instance.imagePositionPatient || this.getFromDataSet(image.data, 'string', 'x00200032');

        imageMetadata.instance.sliceThickness = imageMetadata.instance.sliceThickness || this.getFromDataSet(image.data, 'string', 'x00180050');
        imageMetadata.instance.sliceLocation = imageMetadata.instance.sliceLocation || this.getFromDataSet(image.data, 'string', 'x00201041');
        imageMetadata.instance.tablePosition = imageMetadata.instance.tablePosition || this.getFromDataSet(image.data, 'string', 'x00189327');
        imageMetadata.instance.spacingBetweenSlices = imageMetadata.instance.spacingBetweenSlices || this.getFromDataSet(image.data, 'string', 'x00180088');

        imageMetadata.instance.lossyImageCompression = imageMetadata.instance.lossyImageCompression || this.getFromDataSet(image.data, 'string', 'x00282110');
        imageMetadata.instance.lossyImageCompressionRatio = imageMetadata.instance.lossyImageCompressionRatio || this.getFromDataSet(image.data, 'string', 'x00282112');

        imageMetadata.instance.frameIncrementPointer = imageMetadata.instance.frameIncrementPointer || this.getFromDataSet(image.data, 'string', 'x00280009');
        imageMetadata.instance.frameTime = imageMetadata.instance.frameTime || this.getFromDataSet(image.data, 'string', 'x00181063');
        imageMetadata.instance.frameTimeVector = imageMetadata.instance.frameTimeVector || this.getFromDataSet(image.data, 'string', 'x00181065');

        if ((image.data || image.instance) && !imageMetadata.instance.multiframeMetadata) {
            imageMetadata.instance.multiframeMetadata = this.getMultiframeModuleMetadata(image);
        }

        imageMetadata.imagePlane = imageMetadata.imagePlane || this.getImagePlane(imageMetadata.instance);
    }

    /**
     * Constructs and returns the imagePlane given the metadata instance
     *
     * @param metadataInstance The metadata instance (InstanceMetadata class) containing information to construct imagePlane
     * @returns imagePlane The constructed imagePlane to be used in viewer easily
     */
    getImagePlane(instance) {
        if (!instance.rows || !instance.columns || !instance.pixelSpacing ||
            !instance.frameOfReferenceUID || !instance.imageOrientationPatient ||
            !instance.imagePositionPatient) {
            return;
        }

        const imageOrientation = instance.imageOrientationPatient.split('\\');
        const imagePosition = instance.imagePositionPatient.split('\\');

        let columnPixelSpacing = 1.0;
        let rowPixelSpacing = 1.0;
        if (instance.pixelSpacing) {
            const split = instance.pixelSpacing.split('\\');
            rowPixelSpacing = parseFloat(split[0]);
            columnPixelSpacing = parseFloat(split[1]);
        }

        return {
            frameOfReferenceUID: instance.frameOfReferenceUID,
            rows: instance.rows,
            columns: instance.columns,
            rowCosines:
                new cornerstoneMath.Vector3(parseFloat(imageOrientation[0]), parseFloat(imageOrientation[1]), parseFloat(imageOrientation[2])),
            columnCosines:
                new cornerstoneMath.Vector3(parseFloat(imageOrientation[3]), parseFloat(imageOrientation[4]), parseFloat(imageOrientation[5])),
            imagePositionPatient:
                new cornerstoneMath.Vector3(parseFloat(imagePosition[0]), parseFloat(imagePosition[1]), parseFloat(imagePosition[2])),
            rowPixelSpacing,
            columnPixelSpacing,
        };
    }

    /**
     * This function extracts miltiframe information from a dicomParser.DataSet object.
     *
     * @param dataSet {Object} An instance of dicomParser.DataSet object where multiframe information can be found.
     * @return {Object} An object containing multiframe image metadata (frameIncrementPointer, frameTime, frameTimeVector, etc).
     */
    getMultiframeModuleMetadata(image) {
        const imageInfo = {
            isMultiframeImage: false,
            frameIncrementPointer: null,
            numberOfFrames: 0,
            frameTime: 0,
            frameTimeVector: null,
            averageFrameRate: 0 // backwards compatibility only... it might be useless in the future
        };

        let frameTime;

        const numberOfFrames = this.getFromImage(image, 'intString', 'x00280008', 'numberOfFrames', -1);

        if (numberOfFrames > 0) {
            // set multi-frame image indicator
            imageInfo.isMultiframeImage = true;
            imageInfo.numberOfFrames = numberOfFrames;

            // (0028,0009) = Frame Increment Pointer
            const frameIncrementPointer = this.getFrameIncrementPointer(image);

            if (frameIncrementPointer === 'frameTimeVector') {
                // Frame Increment Pointer points to Frame Time Vector (0018,1065) field
                const frameTimeVector = this.getFrameTimeVector(image);

                if (frameTimeVector instanceof Array && frameTimeVector.length > 0) {
                    imageInfo.frameIncrementPointer = frameIncrementPointer;
                    imageInfo.frameTimeVector = frameTimeVector;
                    frameTime = frameTimeVector.reduce((a, b) => a + b) / frameTimeVector.length;
                    imageInfo.averageFrameRate = 1000 / frameTime;
                }
            } else if (frameIncrementPointer === 'frameTime' || frameIncrementPointer === '') {
                frameTime = this.getFrameTime(image);

                if (frameTime > 0) {
                    imageInfo.frameIncrementPointer = frameIncrementPointer;
                    imageInfo.frameTime = frameTime;
                    imageInfo.averageFrameRate = 1000 / frameTime;
                }
            }

        }

        return imageInfo;
    }

    /**
     * Get a bound reference to the provider function.
     */
    getProvider() {
        let provider = this._provider;
        if (typeof this._provider !== FUNCTION) {
            provider = this.provider.bind(this);
            this._provider = provider;
        }

        return provider;
    }

    /**
     * Looks up metadata for Cornerstone Tools given a specified type and imageId
     * A type may be, e.g. 'study', or 'patient', or 'imagePlane'. These types
     * are keys in the stored metadata objects.
     *
     * @param type
     * @param imageId
     * @returns {Object} Relevant metadata of the specified type
     */
    provider(type, imageId) {
        // TODO: Cornerstone Tools use 'imagePlaneModule', but OHIF use 'imagePlane'. It must be consistent.
        if (type === 'imagePlaneModule') {
            type = 'imagePlane';
        }

        const imageMetadata = this.metadataLookup.get(imageId);
        if (!imageMetadata) {
            return;
        }

        if (imageMetadata.hasOwnProperty(type)) {
            return imageMetadata[type];
        }
    }
}
