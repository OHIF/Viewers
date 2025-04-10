/* eslint-disable prettier/prettier */
import log from "loglevelnext";
import dcmjs from 'dcmjs';

const { DicomMetaDictionary } = dcmjs.data;
const { DerivedImage } = dcmjs.derivations;

class Normalizer {
    constructor(datasets) {
        this.datasets = datasets; // one or more dicom-like object instances
        this.dataset = undefined; // a normalized multiframe dicom object instance
    }

    static consistentSOPClassUIDs(datasets) {
        // return sopClassUID if all exist and match, otherwise undefined
        let sopClassUID;
        datasets.forEach(function(dataset) {
            if (!dataset.SOPClassUID) {
                return undefined;
            }
            if (!sopClassUID) {
                sopClassUID = dataset.SOPClassUID;
            }
            if (dataset.SOPClassUID !== sopClassUID) {
                log.error(
                    "inconsistent sopClassUIDs: ",
                    dataset.SOPClassUID,
                    sopClassUID
                );
                return undefined;
            }
        });
        return sopClassUID;
    }

    static normalizerForSOPClassUID(sopClassUID) {
        sopClassUID = sopClassUID.replace(/[^0-9.]/g, ""); // TODO: clean all VRs as part of normalizing
        let toUID = DicomMetaDictionary.sopClassUIDsByName;
        let sopClassUIDMap = {};
        sopClassUIDMap[toUID.CTImage] = CTImageNormalizer;
        sopClassUIDMap[toUID.ParametricMapStorage] = PMImageNormalizer;
        sopClassUIDMap[toUID.MRImage] = MRImageNormalizer;
        sopClassUIDMap[toUID.EnhancedCTImage] = EnhancedCTImageNormalizer;
        sopClassUIDMap[
            toUID.LegacyConvertedEnhancedCTImage
        ] = EnhancedCTImageNormalizer;
        sopClassUIDMap[toUID.EnhancedMRImage] = EnhancedMRImageNormalizer;
        sopClassUIDMap[
            toUID.LegacyConvertedEnhancedMRImage
        ] = EnhancedMRImageNormalizer;
        sopClassUIDMap[toUID.EnhancedUSVolume] = EnhancedUSVolumeNormalizer;
        sopClassUIDMap[toUID.USImage] = USImageNormalizer;
        sopClassUIDMap[toUID.USMultiframeImage] = USMultiframeImageNormalizer;
        sopClassUIDMap[toUID.PETImage] = PETImageNormalizer;
        sopClassUIDMap[toUID.EnhancedPETImage] = PETImageNormalizer;
        sopClassUIDMap[
            toUID.LegacyConvertedEnhancedPETImage
        ] = PETImageNormalizer;
        sopClassUIDMap[toUID.Segmentation] = SEGImageNormalizer;
        sopClassUIDMap[toUID.DeformableSpatialRegistration] = DSRNormalizer;
        return sopClassUIDMap[sopClassUID];
    }

    static isMultiframeSOPClassUID(sopClassUID) {
        const toUID = DicomMetaDictionary.sopClassUIDsByName;
        const multiframeSOPClasses = [
            toUID.EnhancedMRImage,
            toUID.LegacyConvertedEnhancedMRImage,
            toUID.EnhancedCTImage,
            toUID.LegacyConvertedEnhancedCTImage,
            toUID.EnhancedUSVolume,
            toUID.USMultiframeImage,
            toUID.EnhancedPETImage,
            toUID.LegacyConvertedEnhancedPETImage,
            toUID.Segmentation,
            toUID.ParametricMapStorage
        ];
        return multiframeSOPClasses.indexOf(sopClassUID) !== -1;
    }

    static isMultiframeDataset(ds = this.dataset) {
        const sopClassUID = ds.SOPClassUID.replace(/[^0-9.]/g, ""); // TODO: clean all VRs as part of normalizing
        return Normalizer.isMultiframeSOPClassUID(sopClassUID);
    }

    normalize() {
        return "No normalization defined";
    }

    static normalizeToDataset(datasets) {
        let sopClassUID = Normalizer.consistentSOPClassUIDs(datasets);
        let normalizerClass = Normalizer.normalizerForSOPClassUID(sopClassUID);

        if (!normalizerClass) {
            log.error("no normalizerClass for ", sopClassUID);
            return undefined;
        }
        let normalizer = new normalizerClass(datasets);
        normalizer.normalize();
        return normalizer.dataset;
    }
}

class ImageNormalizer extends Normalizer {
    normalize() {
        this.convertToMultiframe();
        this.normalizeMultiframe();
    }

    static vec3CrossProduct(a, b) {
        let ax = a[0],
            ay = a[1],
            az = a[2],
            bx = b[0],
            by = b[1],
            bz = b[2];
        let out = [];
        out[0] = ay * bz - az * by;
        out[1] = az * bx - ax * bz;
        out[2] = ax * by - ay * bx;
        return out;
    }

    static vec3Subtract(a, b) {
        let out = [];
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        return out;
    }

    static vec3Dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    convertToMultiframe() {
        if (
            this.datasets.length === 1 &&
            Normalizer.isMultiframeDataset(this.datasets[0])
        ) {
            // already a multiframe, so just use it
            this.dataset = this.datasets[0];
            return;
        }
        this.derivation = new DerivedImage(this.datasets);
        this.dataset = this.derivation.dataset;
        let ds = this.dataset;
        // create a new multiframe from the source datasets
        // fill in only those elements required to make a valid image
        // for volumetric processing
        let referenceDataset = this.datasets[0];
        ds.NumberOfFrames = this.datasets.length;

        // TODO: develop sets of elements to copy over in loops
        ds.SOPClassUID = referenceDataset.SOPClassUID;
        ds.Rows = referenceDataset.Rows;
        ds.Columns = referenceDataset.Columns;
        ds.BitsAllocated = referenceDataset.BitsAllocated;
        ds.PixelRepresentation = referenceDataset.PixelRepresentation;
        ds.RescaleSlope = referenceDataset.RescaleSlope || "1";
        ds.RescaleIntercept = referenceDataset.RescaleIntercept || "0";
        //ds.BurnedInAnnotation = referenceDataset.BurnedInAnnotation || "YES";

        // sort
        // https://github.com/pieper/Slicer3/blob/master/Base/GUI/Tcl/LoadVolume.tcl
        // TODO: add spacing checks:
        // https://github.com/Slicer/Slicer/blob/master/Modules/Scripted/DICOMPlugins/DICOMScalarVolumePlugin.py#L228-L250
        // TODO: put this information into the Shared and PerFrame functional groups
        // TODO: sorting of frames could happen in normalizeMultiframe instead, since other
        // multiframe converters may not sort the images
        // TODO: sorting can be seen as part of generation of the Dimension Multiframe Dimension Module
        // and should really be done in an acquisition-specific way (e.g. for DCE)
        let referencePosition = referenceDataset.ImagePositionPatient;
        let rowVector = referenceDataset.ImageOrientationPatient.slice(0, 3);
        let columnVector = referenceDataset.ImageOrientationPatient.slice(3, 6);
        let scanAxis = ImageNormalizer.vec3CrossProduct(
            rowVector,
            columnVector
        );
        let distanceDatasetPairs = [];
        this.datasets.forEach(function(dataset) {
            let position = dataset.ImagePositionPatient.slice();
            let positionVector = ImageNormalizer.vec3Subtract(
                position,
                referencePosition
            );
            let distance = ImageNormalizer.vec3Dot(positionVector, scanAxis);
            distanceDatasetPairs.push([distance, dataset]);
        });
        // Multiframe is stored in descending order
        distanceDatasetPairs.sort(function(a, b) {
            return b[0] - a[0];
        });

        // assign array buffers
        if (ds.Modality !== 'US') {
            if (ds.BitsAllocated !== 16) {
                log.error(
                  'Only works with 16 bit data, not ' +
                  String(this.dataset.BitsAllocated),
                );
            }
        }
        if (referenceDataset._vrMap && !referenceDataset._vrMap.PixelData) {
            log.warn("No vr map given for pixel data, using OW");
            ds._vrMap = { PixelData: "OW" };
        } else {
            ds._vrMap = { PixelData: referenceDataset._vrMap.PixelData };
        }
        let frameSize = referenceDataset.PixelData.byteLength;
        ds.PixelData = new ArrayBuffer(ds.NumberOfFrames * frameSize);
        let frame = 0;
        distanceDatasetPairs.forEach(function(pair) {
            let dataset = pair[1];
            let pixels = new Uint16Array(dataset.PixelData);
            let frameView = new Uint16Array(
                ds.PixelData,
                frame * frameSize,
                frameSize / 2
            );
            try {
                frameView.set(pixels);
            } catch (e) {
                if (e instanceof RangeError) {
                    log.error("Error inserting pixels in PixelData");
                    log.error("frameSize", frameSize);
                    log.error("NumberOfFrames", ds.NumberOfFrames);
                    log.error("pair", pair);
                    log.error(
                        "dataset PixelData size",
                        dataset.PixelData.length
                    );
                }
            }
            frame++;
        });

        if (ds.Modality !== 'US') {
            if (ds.NumberOfFrames < 2) {
                // TODO
                log.error(
                  'Cannot populate shared groups uniquely without multiple frames',
                );
            }
        }
        let [distance0, dataset0] = distanceDatasetPairs[0];
        let distance1 = distanceDatasetPairs[1] ? distanceDatasetPairs[1][0] : 1;

        //
        // make the functional groups
        //
        // shared
        const SpacingBetweenSlices = Math.abs(distance1 - distance0);

        ds.SharedFunctionalGroupsSequence = {
            PlaneOrientationSequence: {
                ImageOrientationPatient: dataset0.ImageOrientationPatient
            },
            PixelMeasuresSequence: {
                PixelSpacing: dataset0.PixelSpacing,
                SpacingBetweenSlices: SpacingBetweenSlices,
                SliceThickness: SpacingBetweenSlices
            }
        };

        ds.ReferencedSeriesSequence = {
            SeriesInstanceUID: dataset0.SeriesInstanceUID,
            ReferencedInstanceSequence: []
        };

        // per-frame
        ds.PerFrameFunctionalGroupsSequence = [];

        // copy over each datasets window/level into the per-frame groups
        // and set the referenced series uid
        distanceDatasetPairs.forEach(function(pair) {
            const dataset = pair[1];

            ds.PerFrameFunctionalGroupsSequence.push({
                PlanePositionSequence: {
                    ImagePositionPatient: dataset.ImagePositionPatient
                },
                FrameVOILUTSequence: {
                    WindowCenter: dataset.WindowCenter,
                    WindowWidth: dataset.WindowWidth
                }
            });

            ds.ReferencedSeriesSequence.ReferencedInstanceSequence.push({
                ReferencedSOPClassUID: dataset.SOPClassUID,
                ReferencedSOPInstanceUID: dataset.SOPInstanceUID
            });
        });

        let dimensionUID = DicomMetaDictionary.uid();
        this.dataset.DimensionOrganizationSequence = {
            DimensionOrganizationUID: dimensionUID
        };
        this.dataset.DimensionIndexSequence = [
            {
                DimensionOrganizationUID: dimensionUID,
                DimensionIndexPointer: 2097202,
                FunctionalGroupPointer: 2134291, // PlanePositionSequence
                DimensionDescriptionLabel: "ImagePositionPatient"
            }
        ];
    }

    normalizeMultiframe() {
        let ds = this.dataset;

        if (!ds.NumberOfFrames) {
            log.error("Missing number or frames not supported");
            return;
        }

        if (!ds.PixelRepresentation) {
            // Required tag: guess signed
            ds.PixelRepresentation = 1;
        }

        if (!ds.StudyID || ds.StudyID === "") {
            // Required tag: fill in if needed
            ds.StudyID = "No Study ID";
        }

        let validLateralities = ["R", "L"];
        if (validLateralities.indexOf(ds.Laterality) === -1) {
            delete ds.Laterality;
        }

        if (!ds.PresentationLUTShape) {
            ds.PresentationLUTShape = "IDENTITY";
        }

        if (!ds.SharedFunctionalGroupsSequence) {
            log.error(
                "Can only process multiframe data with SharedFunctionalGroupsSequence"
            );
        }

        // TODO: special case!
        if (ds.BodyPartExamined === "PROSTATE") {
            ds.SharedFunctionalGroupsSequence.FrameAnatomySequence = {
                AnatomicRegionSequence: {
                    CodeValue: "T-9200B",
                    CodingSchemeDesignator: "SRT",
                    CodeMeaning: "Prostate"
                },
                FrameLaterality: "U"
            };
        }

        let rescaleIntercept = ds.RescaleIntercept || 0;
        let rescaleSlope = ds.RescaleSlope || 1;
        ds.SharedFunctionalGroupsSequence.PixelValueTransformationSequence = {
            RescaleIntercept: rescaleIntercept,
            RescaleSlope: rescaleSlope,
            RescaleType: "US"
        };
        let frameNumber = 1;
        this.datasets.forEach(dataset => {
            // ToDo: Why to assign PerFrameFunctionalGroupsSequence into array for 1 frame?
            // if (ds.NumberOfFrames === 1)
            //     ds.PerFrameFunctionalGroupsSequence = [
            //         ds.PerFrameFunctionalGroupsSequence
            //     ];
            ds.PerFrameFunctionalGroupsSequence[
                frameNumber - 1
            ].FrameContentSequence = {
                FrameAcquisitionDuration: 0,
                StackID: 1,
                InStackPositionNumber: frameNumber,
                DimensionIndexValues: frameNumber
            };
            let frameTime = dataset.AcquisitionDate + dataset.AcquisitionTime;
            if (!isNaN(frameTime)) {
                let frameContentSequence =
                    ds.PerFrameFunctionalGroupsSequence[frameNumber - 1]
                        .FrameContentSequence;
                frameContentSequence.FrameAcquisitionDateTime = frameTime;
                frameContentSequence.FrameReferenceDateTime = frameTime;
            }

            frameNumber++;
        });

        //
        // TODO: convert this to shared functional group not top level element
        //
        if (ds.WindowCenter && ds.WindowWidth) {
            // if they exist as single values, make them lists for consistency
            if (!Array.isArray(ds.WindowCenter)) {
                ds.WindowCenter = [ds.WindowCenter];
            }
            if (!Array.isArray(ds.WindowWidth)) {
                ds.WindowWidth = [ds.WindowWidth];
            }
        }
        if (!ds.WindowCenter || !ds.WindowWidth) {
            // if they don't exist, make them empty lists and try to initialize them
            ds.WindowCenter = []; // both must exist and be the same length
            ds.WindowWidth = [];
            // provide a volume-level window/level guess (mean of per-frame)
            if (ds.PerFrameFunctionalGroupsSequence) {
                let wcww = { center: 0, width: 0, count: 0 };
                ds.PerFrameFunctionalGroupsSequence.forEach(function(
                    functionalGroup
                ) {
                    if (functionalGroup.FrameVOILUT) {
                        let wc =
                            functionalGroup.FrameVOILUTSequence.WindowCenter;
                        let ww =
                            functionalGroup.FrameVOILUTSequence.WindowWidth;
                        if (functionalGroup.FrameVOILUTSequence && wc && ww) {
                            if (Array.isArray(wc)) {
                                wc = wc[0];
                            }
                            if (Array.isArray(ww)) {
                                ww = ww[0];
                            }
                            wcww.center += Number(wc);
                            wcww.width += Number(ww);
                            wcww.count++;
                        }
                    }
                });
                if (wcww.count > 0) {
                    ds.WindowCenter.push(String(wcww.center / wcww.count));
                    ds.WindowWidth.push(String(wcww.width / wcww.count));
                }
            }
        }
        // last gasp, pick an arbitrary default
        if (ds.WindowCenter.length === 0) {
            ds.WindowCenter = [300];
        }
        if (ds.WindowWidth.length === 0) {
            ds.WindowWidth = [500];
        }
    }
}

class MRImageNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
        // TODO: make specialization for LegacyConverted vs normal EnhanceMRImage
        //let toUID = DicomMetaDictionary.sopClassUIDsByName;
        this.dataset.SOPClassUID = "LegacyConvertedEnhancedMRImage";
        //this.dataset.SOPClassUID = toUID.EnhancedMRImage;
    }

    normalizeMultiframe() {
        super.normalizeMultiframe();
        let ds = this.dataset;

        if (
            !ds.ImageType ||
            !ds.ImageType.constructor ||
            ds.ImageType.constructor.name != "Array" ||
            ds.ImageType.length != 4
        ) {
            ds.ImageType = ["ORIGINAL", "PRIMARY", "OTHER", "NONE"];
        }

        ds.SharedFunctionalGroupsSequence.MRImageFrameTypeSequence = {
            FrameType: ds.ImageType,
            PixelPresentation: "MONOCHROME",
            VolumetricProperties: "VOLUME",
            VolumeBasedCalculationTechnique: "NONE",
            ComplexImageComponent: "MAGNITUDE",
            AcquisitionContrast: "UNKNOWN"
        };
    }
}

class EnhancedCTImageNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
    }
}

class EnhancedMRImageNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
    }
}

class EnhancedUSVolumeNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
    }
}

class USImageNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
        // TODO: provide option at export to swap in LegacyConverted UID
        let toUID = DicomMetaDictionary.sopClassUIDsByName;
        //this.dataset.SOPClassUID = "LegacyConvertedEnhancedCTImage";
        this.dataset.SOPClassUID = toUID.USMultiframeImage;
    }
}

class USMultiframeImageNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
    }
}

class CTImageNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
        // TODO: provide option at export to swap in LegacyConverted UID
        let toUID = DicomMetaDictionary.sopClassUIDsByName;
        //this.dataset.SOPClassUID = "LegacyConvertedEnhancedCTImage";
        this.dataset.SOPClassUID = toUID.EnhancedCTImage;
    }
}

class PETImageNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
        // TODO: provide option at export to swap in LegacyConverted UID
        let toUID = DicomMetaDictionary.sopClassUIDsByName;
        //this.dataset.SOPClassUID = "LegacyConvertedEnhancedPETImage";
        this.dataset.SOPClassUID = toUID.EnhancedPETImage;
    }
}

class SEGImageNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
    }
}

class PMImageNormalizer extends ImageNormalizer {
    normalize() {
        super.normalize();
        let ds = this.datasets[0];
        if (ds.BitsAllocated !== 32) {
            log.error(
                "Only works with 32 bit data, not " + String(ds.BitsAllocated)
            );
        }
    }
}

class DSRNormalizer extends Normalizer {
    normalize() {
        this.dataset = this.datasets[0]; // only one dataset per series and for now we assume it is normalized
    }
}

export { Normalizer };
export { ImageNormalizer };
export { MRImageNormalizer };
export { EnhancedCTImageNormalizer };
export { EnhancedMRImageNormalizer };
export { EnhancedUSVolumeNormalizer };
export { CTImageNormalizer };
export { PETImageNormalizer };
export { SEGImageNormalizer };
export { PMImageNormalizer };
export { DSRNormalizer };
