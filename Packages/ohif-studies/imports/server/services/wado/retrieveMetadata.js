import { OHIF } from 'meteor/ohif:core';
import { parseFloatArray } from '../../lib/parseFloatArray';

/**
 * Simple cache schema for retrieved color palettes.
 */
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
 * Creates a URL for a WADO search
 *
 * @param server
 * @param studyInstanceUid
 * @returns {string}
 */
function buildUrl(server, studyInstanceUid) {
    return server.wadoRoot + '/studies/' + studyInstanceUid + '/metadata';
}

/** Returns a WADO url for an instance
 *
 * @param studyInstanceUid
 * @param seriesInstanceUid
 * @param sopInstanceUid
 * @returns  {string}
 */
function buildInstanceWadoUrl(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid) {
    const params = [];

    params.push('requestType=WADO');
    params.push(`studyUID=${studyInstanceUid}`);
    params.push(`seriesUID=${seriesInstanceUid}`);
    params.push(`objectUID=${sopInstanceUid}`);
    params.push('contentType=application%2Fdicom');
    params.push('transferSyntax=*');

    return `${server.wadoUriRoot}?${params.join('&')}`;
}

function buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid) {
    return `${server.wadoRoot}/studies/${studyInstanceUid}/series/${seriesInstanceUid}/instances/${sopInstanceUid}`
}

function buildInstanceFrameWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid, frame) {
    const baseWadoRsUri = buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
    frame = frame != null || 1;

    return `${baseWadoRsUri}/frames/${frame}`
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

function getPaletteColor(server, instance, tag, lutDescriptor) {
    const lut = [];
    const numLutEntries = lutDescriptor[0];
    const bits = lutDescriptor[2];
    const uri = WADOProxy.convertURL(instance[tag].BulkDataURI, server)
    const data = DICOMWeb.getBulkData(uri);

    for (var i = 0; i < numLutEntries; i++) {
        if(bits === 16) {
            lut[i] = data.readUInt16LE(i*2);
        } else {
            lut[i] = data.readUInt8(i);
        }
    }

    return lut;
}

/**
 * Fetch palette colors for instances with "PALETTE COLOR" photometricInterpretation.
 *
 * @param server {Object} Current server;
 * @param instance {Object} The retrieved instance metadata;
 * @returns {String} The ReferenceSOPInstanceUID
 */
function getPaletteColors(server, instance, lutDescriptor) {

    let entry = null,
        paletteUID = DICOMWeb.getString(instance['00281199']);

    if (paletteColorCache.isValidUID(paletteUID)) {
        entry = paletteColorCache.get(paletteUID);
    } else {
        paletteUID = null;
    }

    if (!entry) {
        // no entry on cache... Fetch remote data.
        try {
            let r, g, b;
            r = getPaletteColor(server, instance, '00281201', lutDescriptor);
            g = getPaletteColor(server, instance, '00281202', lutDescriptor);;
            b = getPaletteColor(server, instance, '00281203', lutDescriptor);;

            entry = { red: r, green: g, blue: b };
            if (paletteUID !== null) {
                // when paletteUID is present, the entry can be cached...
                entry.uid = paletteUID;
                paletteColorCache.add(entry);
            }
        } catch (error) {
            OHIF.log.error(`(${error.name}) ${error.message}`);
        }
    }

    return entry;

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

function getRadiopharmaceuticalInfo(instance) {
    const modality = DICOMWeb.getString(instance['00080060']);

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

/**
 * Parses result data from a WADO search into Study MetaData
 * Returns an object populated with study metadata, including the
 * series list.
 *
 * @param server
 * @param studyInstanceUid
 * @param resultData
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */
function resultDataToStudyMetadata(server, studyInstanceUid, resultData) {
    var seriesMap = {};
    var seriesList = [];

    if (!resultData.length) {
        return;
    }

    var anInstance = resultData[0];
    if (!anInstance) {
        return;
    }

    var studyData = {
        seriesList: seriesList,
        patientName: DICOMWeb.getName(anInstance['00100010']),
        patientId: DICOMWeb.getString(anInstance['00100020']),
        patientAge: DICOMWeb.getNumber(anInstance['00101010']),
        patientSize: DICOMWeb.getNumber(anInstance['00101020']),
        patientWeight: DICOMWeb.getNumber(anInstance['00101030']),
        accessionNumber: DICOMWeb.getString(anInstance['00080050']),
        studyDate: DICOMWeb.getString(anInstance['00080020']),
        modalities: DICOMWeb.getString(anInstance['00080061']),
        studyDescription: DICOMWeb.getString(anInstance['00081030']),
        imageCount: DICOMWeb.getString(anInstance['00201208']),
        studyInstanceUid: DICOMWeb.getString(anInstance['0020000D']),
        institutionName: DICOMWeb.getString(anInstance['00080080'])
    };

    resultData.forEach(function(instance) {
        var seriesInstanceUid = DICOMWeb.getString(instance['0020000E']);
        var series = seriesMap[seriesInstanceUid];
        if (!series) {
            series = {
                seriesDescription: DICOMWeb.getString(instance['0008103E']),
                modality: DICOMWeb.getString(instance['00080060']),
                seriesInstanceUid: seriesInstanceUid,
                seriesNumber: DICOMWeb.getNumber(instance['00200011']),
                seriesDate: DICOMWeb.getString(instance['00080021']),
                seriesTime: DICOMWeb.getString(instance['00080031']),
                instances: []
            };
            seriesMap[seriesInstanceUid] = series;
            seriesList.push(series);
        }

        var sopInstanceUid = DICOMWeb.getString(instance['00080018']);

        const wadouri = buildInstanceWadoUrl(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
        const baseWadoRsUri = buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
        const wadorsuri = buildInstanceFrameWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);

        var instanceSummary = {
            imageType: DICOMWeb.getString(instance['00080008']),
            sopClassUid: DICOMWeb.getString(instance['00080016']),
            modality: DICOMWeb.getString(instance['00080060']),
            sopInstanceUid: sopInstanceUid,
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
            baseWadoRsUri: baseWadoRsUri,
            wadouri: WADOProxy.convertURL(wadouri, server),
            wadorsuri: WADOProxy.convertURL(wadorsuri, server),
            imageRendering: server.imageRendering,
            thumbnailRendering: server.thumbnailRendering
        };

        // Get additional information if the instance uses "PALETTE COLOR" photometric interpretation
        if (instanceSummary.photometricInterpretation === 'PALETTE COLOR') {
            const redPaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281101']));
            const greenPaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281102']));
            const bluePaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281103']));
            const palettes = getPaletteColors(server, instance, redPaletteColorLookupTableDescriptor);

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

        series.instances.push(instanceSummary);

    });

    return studyData;
}

/**
 * Retrieved Study MetaData from a DICOM server using a WADO call
 * @param server
 * @param studyInstanceUid
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */
OHIF.studies.services.WADO.RetrieveMetadata = function(server, studyInstanceUid) {
    var url = buildUrl(server, studyInstanceUid);

    try {
        var result = DICOMWeb.getJSON(url, server.requestOptions);

        var study = resultDataToStudyMetadata(server, studyInstanceUid, result.data);
        if (!study) {
            study = {};
        }

        study.wadoUriRoot = server.wadoUriRoot;
        study.studyInstanceUid = studyInstanceUid;

        return study;
    } catch (error) {
        OHIF.log.trace();

        throw error;
    }
};
