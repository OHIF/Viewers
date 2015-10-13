function filterToQIDOURL(server, filter) {
  var parameters = {
    PatientName : filter.patientName,
    PatientID: filter.patientId,
    AccessionNumber : filter.accessionNumber,
    limit : filter.limit || 20,
    includefield : server.qidoSupportsIncludeField ? 'all' : undefined
  };
  var url = server.qidoRoot + '/studies?' + encodeQueryData(parameters);
  return url;
}

function resultDataToStudies(resultData) {
  var studies = [];
  resultData.forEach(function(study) {
    studies.push({
      patientName: DICOMWeb.getName(study['00100010']),
      patientId: DICOMWeb.getString(study['00100020']),
      accessionNumber : DICOMWeb.getString(study['00080050']),
      studyDate: DICOMWeb.getString(study['00080020']),
      modalities: DICOMWeb.getString(study['00080061']),
      studyDescription: DICOMWeb.getString(study['00081030']),
      imageCount: DICOMWeb.getString(study['00201208']),
      studyInstanceUid: DICOMWeb.getString(study['0020000D'])
      //url : server.wadoRoot + '/studies/' + DICOMWeb.getString(study['0020000D']) + '/metadata'
    });
  });
  return studies;
}

Services.QIDO.Studies = function(server, filter) {

  var url = filterToQIDOURL(server, filter);

  var result = DICOMWeb.getJSON(url, server.requestOptions);

  return resultDataToStudies(result.data);
};