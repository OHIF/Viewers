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
                instances: []
            };
            seriesMap[seriesInstanceUid] = series;
            seriesList.push(series);
        }

        var sopInstanceUid = DICOMWeb.getString(instance['00080018']);

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
            rows: DICOMWeb.getNumber(instance['00280010']),
            columns: DICOMWeb.getNumber(instance['00280011']),
            pixelSpacing: DICOMWeb.getString(instance['00280030']),
            bitsAllocated: DICOMWeb.getNumber(instance['00280100']),
            bitsStored: DICOMWeb.getNumber(instance['00280101']),
            highBit: DICOMWeb.getNumber(instance['00280102']),
            pixelRepresentation: DICOMWeb.getNumber(instance['00280103']),
            windowCenter: DICOMWeb.getString(instance['00281050']),
            windowWidth: DICOMWeb.getString(instance['00281051']),
            rescaleIntercept: DICOMWeb.getNumber(instance['00281052']),
            rescaleSlope: DICOMWeb.getNumber(instance['00281053']),
            sourceImageInstanceUid: getSourceImageInstanceUid(instance),
            laterality: DICOMWeb.getString(instance['00200062']),
            viewPosition: DICOMWeb.getString(instance['00185101']),
            numFrames: DICOMWeb.getNumber(instance['00280008']),
            frameTime: DICOMWeb.getNumber(instance['00181063']),
            sliceThickness: DICOMWeb.getNumber(instance['00180050']),
            lossyImageCompression: DICOMWeb.getString(instance['00282110']),
            derivationDescription: DICOMWeb.getString(instance['00282111']),
            lossyImageCompressionRatio: DICOMWeb.getString(instance['00282112']),
            lossyImageCompressionMethod: DICOMWeb.getString(instance['00282114']),
        };

        if (server.imageRendering === 'wadouri') {
            instanceSummary.wadouri = WADOProxy.convertURL(server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + '&contentType=application%2Fdicom');
        } else {
            instanceSummary.wadorsuri = server.wadoRoot + '/studies/' + studyInstanceUid + '/series/' + seriesInstanceUid + '/instances/' + sopInstanceUid + '/frames/1';
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
Services.WADO.RetrieveMetadata = function(server, studyInstanceUid) {
    var url = buildUrl(server, studyInstanceUid);

    var result = DICOMWeb.getJSON(url, server.requestOptions);

    var study = resultDataToStudyMetadata(server, studyInstanceUid, result.data);
    if (!study) {
        study = {};
    }

    study.wadoUriRoot = server.wadoUriRoot;
    study.studyInstanceUid = studyInstanceUid;

    return study;
};
