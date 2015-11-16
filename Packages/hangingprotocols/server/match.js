DICOMHP.match = function(studyInstanceUID) {
  var metadata = DICOMService.retrieveMetadata(studyInstanceUID);
  if (!metadata) {
    return [];
  }
  var params = {"00080016" : "1.2.840.10008.5.1.4.38.1"}, modalities = metadata["00080061"].Value[0],
      modalityMatch = null;

  if (modalities) {
    modalityMatch = [];
    modalities.split('\\').forEach(function(modality){
      if (modality && modality != 'SC') {
        modalityMatch.push(modality);
      }
    });
  }
  var firstInstance = DICOMService.retrieveMetadata(studyInstanceUID, null, null, {limit : 1}),
      lateralityMatch = null;

  if (firstInstance.length > 0) {
    lateralityMatch = firstInstance[0]["00200060"].Value[0];
  }

  // since orthanc doesn't support sequence matching
  var allProtocols = DICOMService.searchForInstances(null, null, params);
  if (allProtocols.length < 1) {
    return [];
  }
  var matchedPrtocols = [];
  allProtocols.forEach(function(protocol) {
    var definitionSequence = protocol["0072000C"].Value;
    definitionSequence.forEach(function(definition){
      var defModality = definition["00080060"].Value[0];
      if (defModality && modalityMatch && modalityMatch.indexOf(defModality) != -1) {
        matchedPrtocols.push(protocol);
        return;
      }
      var defLaterality = definition["00200060"].Value[0];
      if (defLaterality && (defLaterality == lateralityMatch)) {
        matchedPrtocols.push(protocol);
        return;
      }
    });
  });
  return matchedPrtocols;
};