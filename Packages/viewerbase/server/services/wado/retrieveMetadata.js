function buildUrl(server, studyInstanceUid) {

  var url = server.wadoRoot + '/studies/' + studyInstanceUid + '/metadata';

  return url;
}

function resultDataToStudyMetadata(server, studyInstanceUid, resultData) {
  var seriesMap = {};
  var seriesList = [];
  resultData.forEach(function(instance) {
    var seriesInstanceUid = DICOMWeb.getString(instance['0020000E']);
    var series = seriesMap[seriesInstanceUid];
    if(!series) {
      series = {
        seriesDescription: DICOMWeb.getString(instance['0008103E']),
        modality: DICOMWeb.getString(instance['00080060']),
        seriesInstanceUid : seriesInstanceUid,
        seriesNumber : DICOMWeb.getNumber(instance['00200011']),
        instances: []
      };
      seriesMap[seriesInstanceUid] = series;
      seriesList.push(series);
    }

    var sopInstanceUid = DICOMWeb.getString(instance['00080018']);

    var instanceSummary = {
      // -----------
      // TODO = Fix this
      // This doesn't seem like the best place to put this, but otherwise we have no study info
      patientName: DICOMWeb.getName(instance['00100010']),
      patientId: DICOMWeb.getString(instance['00100020']),
      accessionNumber : DICOMWeb.getString(instance['00080050']),
      studyDate: DICOMWeb.getString(instance['00080020']),
      modalities: DICOMWeb.getString(instance['00080061']),
      studyDescription: DICOMWeb.getString(instance['00081030']),
      imageCount: DICOMWeb.getString(instance['00201208']),
      studyInstanceUid: DICOMWeb.getString(instance['0020000D']),
      // -----------
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

    if(server.imageRendering === 'wadouri') {
      instanceSummary.wadouri = server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + "&contentType=application%2Fdicom";
    } else {
      instanceSummary.wadorsuri = server.wadoRoot + '/studies/' + studyInstanceUid + '/series/' + seriesInstanceUid + '/instances/' + sopInstanceUid + '/frames/1';
    }

    series.instances.push(instanceSummary);
  });
  return seriesList;
}

Services.WADO.RetrieveMetadata = function(server, studyInstanceUid) {

  var url = buildUrl(server, studyInstanceUid);

  var result = DICOMWeb.getJSON(url, server.requestOptions);

  var study = {
    wadoUriRoot: server.wadoUriRoot,
    studyInstanceUid: studyInstanceUid,
    seriesList: resultDataToStudyMetadata(server, studyInstanceUid, result.data)
  };

  return study;
};