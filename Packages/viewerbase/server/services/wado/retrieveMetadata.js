function buildUrl(server, studyInstanceUid) {

    var url = server.wadoRoot + '/studies/' + studyInstanceUid + '/metadata';

    return url;
}

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
        };

        if (server.imageRendering === 'wadouri') {
            instanceSummary.wadouri = server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + "&contentType=application%2Fdicom";
        } else {
            instanceSummary.wadorsuri = server.wadoRoot + '/studies/' + studyInstanceUid + '/series/' + seriesInstanceUid + '/instances/' + sopInstanceUid + '/frames/1';
        }

        series.instances.push(instanceSummary);
    });

    return studyData;
}

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