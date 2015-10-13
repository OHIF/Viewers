function buildUrl(server, studyInstanceUid) {

  var url = server.qidoRoot + '/studies/' + studyInstanceUid + '/instances';

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
        seriesInstanceUid : seriesInstanceUid,
        seriesNumber : DICOMWeb.getString(instance['00200011']),
        instances: []
      };
      seriesMap[seriesInstanceUid] = series;
      seriesList.push(series);
    }

    // The uri for the dicomweb
    // NOTE: DCM4CHEE seems to return the data zipped
    // NOTE: Orthanc returns the data with multi-part mime which cornerstoneWADOImageLoader doesn't
    //       know how to parse yet
    //var uri = DICOMWeb.getString(instance['00081190']);
    //uri = uri.replace('wado-rs', 'dicom-web');

    // manually create a WADO-URI from the UID's
    // NOTE: Haven't been able to get Orthanc's WADO-URI to work yet - maybe its not configured?
    var sopInstanceUid = DICOMWeb.getString(instance['00080018']);
    var uri = server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + "&contentType=application%2Fdicom";

    series.instances.push({
      sopClassUid: DICOMWeb.getString(instance['00080016']),
      sopInstanceUid: sopInstanceUid,
      uri: uri,
      instanceNumber: DICOMWeb.getString(instance['00200013'])
    });
  });
  return seriesList;
}

Services.QIDO.Instances = function(server, studyInstanceUid) {

  var url = buildUrl(server, studyInstanceUid);

  var result = DICOMWeb.getJSON(url, server.requestOptions);
  
  var study = {
    wadoUriRoot: server.wadoUriRoot,
    studyInstanceUid: studyInstanceUid,
    seriesList: resultDataToStudyMetadata(server, studyInstanceUid, result.data)
  };

  return study;
};