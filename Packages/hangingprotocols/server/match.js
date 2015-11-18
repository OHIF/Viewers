var tags = {
    sopClassUid: '00080016'
};

var tagValues = {
    HangingProtocolStorage: '1.2.840.10008.5.1.4.38.1'
};

/**
 * Finds appropriate hanging protocols given a studyInstanceUid
 *
 * This function retrieves all hanging protocols in storage
 * in order to find those that match the parameters of the given study
 *
 * @param studyInstanceUID
 * @returns {Array} An array of matching hanging protocols
 */
DICOMHP.match = function(studyInstanceUID) {
    // First, retrieve the metaData from the given study
    var studyInstance = Services.WADO.retrieveMetadata(studyInstanceUID);
    if (!studyInstance) {
        return;
    }

    // Note: It turns out Orthanc doesn't support hanging protocol storage yet,
    // so I will just stop here.
    var studyData = instanceDataToJsObject(studyInstance, TAG_DICT);

    /*var searchParameters = {
        tags['sopClassUid']: tagValues['HangingProtocolStorage']
    };


    var modalities = studyData.ModalitiesInStudy;
    

    var modalityMatch;
    
    if (modalities) {
        modalityMatch = [];

        modalities.split('\\').forEach(function(modality){
            if (modality && modality != 'SC') {
                modalityMatch.push(modality);
            }
        });
    }
    
    
    var firstInstance = Services.WADO..retrieveMetadata(studyInstanceUID, null, null, {limit : 1}),
        lateralityMatch;
    
    if (firstInstance.length > 0) {
        lateralityMatch = firstInstance[0]["00200060"].Value[0];
    }
    
    // since orthanc doesn't support sequence matching
    var allProtocols = Services.WADO..searchForInstances(null, null, params);

    if (allProtocols.length < 1) {
        return [];
    }

    var matchedProtocols = [];

    allProtocols.forEach(function(protocol) {

        var definitionSequence = protocol["0072000C"].Value;

        definitionSequence.forEach(function(definition){

            var defModality = definition["00080060"].Value[0];

            if (defModality && modalityMatch && modalityMatch.indexOf(defModality) != -1) {
                matchedProtocols.push(protocol);
                return;
            }

            var defLaterality = definition["00200060"].Value[0];
            if (defLaterality && (defLaterality == lateralityMatch)) {
                matchedProtocols.push(protocol);
            }
        });
    });
    
    return matchedProtocols;*/
};