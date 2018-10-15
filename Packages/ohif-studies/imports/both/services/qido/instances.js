import { OHIF } from 'meteor/ohif:core';
import { DICOMWeb } from 'meteor/ohif:dicomweb-client';
import {parseFloatArray} from "../../lib/parseFloatArray";

/**
 * Creates a QIDO URL given the server settings and a study instance UID
 * @param server
 * @param studyInstanceUid
 * @returns {string} URL to be used for QIDO calls
 */
function buildUrl(server, studyInstanceUid) {
    return server.qidoRoot + '/studies/' + studyInstanceUid + '/instances?includefield=all';
}


const paletteColorCache = {
    count: 0,
    maxAge: 24 * 60 * 60 * 1000, // 24h cache?
    entries: {},
    isValidUID: function (paletteUID) {
        return typeof paletteUID === 'string' && paletteUID.length > 0;
    },
    get: function (paletteUID) {
        let entry = null;
        if (this.entries.hasOwnProperty(paletteUID)) {
            entry = this.entries[paletteUID];
            // check how the entry is...
            if ((Date.now() - entry.time) > this.maxAge) {
                // entry is too old... remove entry.
                delete this.entries[paletteUID];
                this.count--;
                entry = null;
            }
        }
        return entry;
    },
    add: function (entry) {
        if (this.isValidUID(entry.uid)) {
            let paletteUID = entry.uid;
            if (this.entries.hasOwnProperty(paletteUID) !== true) {
                this.count++; // increment cache entry count...
            }
            entry.time = Date.now();
            this.entries[paletteUID] = entry;
            // @TODO: Add logic to get rid of old entries and reduce memory usage...
        }
    }
};
/**
 * Parses data returned from a QIDO search and transforms it into
 * an array of series that are present in the study
 *
 * @param server The DICOM server
 * @param studyInstanceUid
 * @param resultData
 * @returns {Array} Series List
 */
function resultDataToStudyMetadata(server, studyInstanceUid, resultData) {
    var seriesMap = {};
    var seriesList = [];

    resultData.forEach(function(instance) {
        // Use seriesMap to cache series data
        // If the series instance UID has already been used to
        // process series data, continue using that series
        var seriesInstanceUid = DICOMWeb.getString(instance['0020000E']);
        var series = seriesMap[seriesInstanceUid];

        // If no series data exists in the seriesMap cache variable,
        // process any available series data
        if (!series) {
            series = {
                seriesInstanceUid: seriesInstanceUid,
                seriesNumber: DICOMWeb.getString(instance['00200011']),
                seriesDescription: DICOMWeb.getString(instance['0008103E']),
                modality: DICOMWeb.getString(instance['00080060']),
                seriesDate: DICOMWeb.getString(instance['00080021']),
                seriesTime: DICOMWeb.getString(instance['00080031']),
                instances: []
            };

            // Save this data in the seriesMap cache variable
            seriesMap[seriesInstanceUid] = series;
            seriesList.push(series);
        }

        // The uri for the dicomweb
        // NOTE: DCM4CHEE seems to return the data zipped
        // NOTE: Orthanc returns the data with multi-part mime which cornerstoneWADOImageLoader doesn't
        //       know how to parse yet
        //var uri = DICOMWeb.getString(instance['00081190']);
        //uri = uri.replace('wado-rs', 'dicom-web');

        // manually create a WADO-URI from the UIDs
        // NOTE: Haven't been able to get Orthanc's WADO-URI to work yet - maybe its not configured?
        var sopInstanceUid = DICOMWeb.getString(instance['00080018']);
       const instanceSummary = {
            sopClassUid: DICOMWeb.getString(instance['00080016']),
            sopInstanceUid: sopInstanceUid,
            seriesInstanceUid: seriesInstanceUid,
            imageType: DICOMWeb.getString(instance['00080008']),
            modality: DICOMWeb.getString(instance['00080060']),
            instanceNumber: DICOMWeb.getNumber(instance['00200013']),
            imagePositionPatient: DICOMWeb.getString(instance['00200032']),
            imageOrientationPatient: DICOMWeb.getString(instance['00200037']),
            frameOfReferenceUID: DICOMWeb.getString(instance['00200052']),
            sliceLocation: DICOMWeb.getNumber(instance['00201041']),
            samplesPerPixel: DICOMWeb.getNumber(instance['00280002']),
            photometricInterpretation: DICOMWeb.getString(instance['00280004']),
            planarConfiguration: DICOMWeb.getNumber(instance['00280006']),
            rows: DICOMWeb.getNumber(instance['00280010']),
            columns: DICOMWeb.getNumber(instance['00280011']),
            pixelSpacing: DICOMWeb.getString(instance['00280030']),
            pixelAspectRatio: DICOMWeb.getString(instance['00280034']),
            bitsAllocated: DICOMWeb.getNumber(instance['00280100']),
            bitsStored: DICOMWeb.getNumber(instance['00280101']),
            highBit: DICOMWeb.getNumber(instance['00280102']),
            pixelRepresentation: DICOMWeb.getNumber(instance['00280103']),
            smallestPixelValue: DICOMWeb.getNumber(instance['00280106']),
            largestPixelValue: DICOMWeb.getNumber(instance['00280107']),
            windowCenter: DICOMWeb.getString(instance['00281050']),
            windowWidth: DICOMWeb.getString(instance['00281051']),
            rescaleIntercept: DICOMWeb.getNumber(instance['00281052']),
            rescaleSlope: DICOMWeb.getNumber(instance['00281053']),
            rescaleType: DICOMWeb.getNumber(instance['00281054']),
            sourceImageInstanceUid: getSourceImageInstanceUid(instance),
            laterality: DICOMWeb.getString(instance['00200062']),
            viewPosition: DICOMWeb.getString(instance['00185101']),
            acquisitionDateTime: DICOMWeb.getString(instance['0008002A']),
            numberOfFrames: DICOMWeb.getNumber(instance['00280008']),
            frameIncrementPointer: getFrameIncrementPointer(instance['00280009']),
            frameTime: DICOMWeb.getNumber(instance['00181063']),
            frameTimeVector: parseFloatArray(DICOMWeb.getString(instance['00181065'])),
            sliceThickness: DICOMWeb.getNumber(instance['00180050']),
            lossyImageCompression: DICOMWeb.getString(instance['00282110']),
            derivationDescription: DICOMWeb.getString(instance['00282111']),
            lossyImageCompressionRatio: DICOMWeb.getString(instance['00282112']),
            lossyImageCompressionMethod: DICOMWeb.getString(instance['00282114']),
            echoNumber: DICOMWeb.getString(instance['00180086']),
            contrastBolusAgent: DICOMWeb.getString(instance['00180010']),
            radiopharmaceuticalInfo: getRadiopharmaceuticalInfo(instance),
        };
        if (instanceSummary.photometricInterpretation === 'PALETTE COLOR') {
            const redPaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281101']));
            const greenPaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281102']));
            const bluePaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281103']));
            const palettes = getPaletteColors(server, instance);

            if (palettes) {
                if (palettes.uid) {
                    instanceSummary.paletteColorLookupTableUID = palettes.uid;
                }

                instanceSummary.redPaletteColorLookupTableData = palettes.red;
                instanceSummary.greenPaletteColorLookupTableData = palettes.green;
                instanceSummary.bluePaletteColorLookupTableData = palettes.blue;
                instanceSummary.redPaletteColorLookupTableDescriptor = redPaletteColorLookupTableDescriptor;
                instanceSummary.greenPaletteColorLookupTableDescriptor = greenPaletteColorLookupTableDescriptor;
                instanceSummary.bluePaletteColorLookupTableDescriptor = bluePaletteColorLookupTableDescriptor;
            }
        }
        // Add this instance to the current series
        series.instances.push(instanceSummary);
    });
    return seriesList;
}

function getFrameIncrementPointer(element) {
    const frameIncrementPointerNames = {
        '00181065': 'frameTimeVector',
        '00181063': 'frameTime'
    };

    if(!element || !element.Value || !element.Value.length) {
        return;
    }

    const value = element.Value[0];
    return frameIncrementPointerNames[value];
}

/**
 * Parses the SourceImageSequence, if it exists, in order
 * to return a ReferenceSOPInstanceUID. The ReferenceSOPInstanceUID
 * is used to refer to this image in any accompanying DICOM-SR documents.
 *
 * @param instance
 * @returns {String} The ReferenceSOPInstanceUID
 */
function getSourceImageInstanceUid(instance) {
    // TODO= Parse the whole Source Image Sequence
    // This is a really poor workaround for now.
    // Later we should probably parse the whole sequence.
    var SourceImageSequence = instance['00082112'];
    if (SourceImageSequence && SourceImageSequence.Value && SourceImageSequence.Value.length) {
        return SourceImageSequence.Value[0]['00081155'].Value[0];
    }
}

/**
 * Retrieve a set of instances using a QIDO call
 * @param server
 * @param studyInstanceUid
 * @throws ECONNREFUSED
 * @returns {{wadoUriRoot: String, studyInstanceUid: String, seriesList: Array}}
 */
OHIF.studies.services.QIDO.Instances = function(server, studyInstanceUid) {
    var url = buildUrl(server, studyInstanceUid);
    return new Promise((resolve, reject) => {
        DICOMWeb.getJSON(url, server.requestOptions).then(result => {
            const instances = {
                wadoUriRoot: server.wadoUriRoot,
                studyInstanceUid: studyInstanceUid,
                seriesList: resultDataToStudyMetadata(server, studyInstanceUid, result)
            };
            resolve(instances);
        }, reject);
    });
};

/**
 * Fetch palette colors for instances with "PALETTE COLOR" photometricInterpretation.
 *
 * @param server {Object} Current server;
 * @param instance {Object} The retrieved instance metadata;
 * @returns {String} The ReferenceSOPInstanceUID
 */
async function getPaletteColors(server, instance, lutDescriptor) {
    let entry = null;
    let paletteUID = DICOMWeb.getString(instance['00281199']);

    return new Promise((resolve, reject) => {
        if (paletteColorCache.isValidUID(paletteUID)) {
            entry = paletteColorCache.get(paletteUID);
            return resolve(entry);
        }

        // no entry in cache... Fetch remote data.
        const r = getPaletteColor(server, instance, '00281201', lutDescriptor);
        const g = getPaletteColor(server, instance, '00281202', lutDescriptor);;
        const b = getPaletteColor(server, instance, '00281203', lutDescriptor);;

        const promises = [r, g, b];

        Promise.all(promises).then((args) => {
            entry = { red: r, green: g, blue: b };

            // when paletteUID is present, the entry can be cached...
            entry.uid = paletteUID;
            paletteColorCache.add(entry);

            resolve(entry);
        });
    });
}

function getRadiopharmaceuticalInfo(instance) {
    const modality = "CR";

    if (modality !== 'PT') {
        return;
    }

    const radiopharmaceuticalInfo = instance['00540016'];
    if ((radiopharmaceuticalInfo === undefined) || !radiopharmaceuticalInfo.Value || !radiopharmaceuticalInfo.Value.length) {
        return;
    }

    const firstPetRadiopharmaceuticalInfo = radiopharmaceuticalInfo.Value[0];
    return {
        radiopharmaceuticalStartTime: DICOMWeb.getString(firstPetRadiopharmaceuticalInfo['00181072']),
        radionuclideTotalDose: DICOMWeb.getNumber(firstPetRadiopharmaceuticalInfo['00181074']),
        radionuclideHalfLife: DICOMWeb.getNumber(firstPetRadiopharmaceuticalInfo['00181075'])
    };
}


function getPaletteColor(server, instance, tag, lutDescriptor) {
    const lut = [];
    const numLutEntries = lutDescriptor[0];
    const bits = lutDescriptor[2];
    const uri = WADOProxy.convertURL(instance[tag].BulkDataURI, server)
    const bulkDataPromise = DICOMWeb.getBulkData(uri);

    return bulkDataPromise.then(data => {
        for (var i = 0; i < numLutEntries; i++) {
            if(bits === 16) {
                lut[i] = data[i * 65536] + data[i + 1];
            } else {
                lut[i] = data[i];
            }
        }

        return lut;
    })
}