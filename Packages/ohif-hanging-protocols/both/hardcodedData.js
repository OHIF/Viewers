HP.attributeDefaults = {
    abstractPriorValue: 0
};

HP.displaySettings = {
    invert: {
        id: 'invert',
        text: 'Show Grayscale Inverted',
        defaultValue: 'NO',
        options: ['YES', 'NO']
    }
};

HP.studyAttributes = [{
    id: 'patientId',
    text: '(x00100020) Patient ID'
}, {
    id: 'studyInstanceUid',
    text: '(x0020000d) Study Instance UID'
}, {
    id: 'studyInstanceUid',
    text: '(x0020000d) Study Instance UID'
}, {
    id: 'studyDate',
    text: '(x00080020) Study Date'
}, {
    id: 'studyTime',
    text: '(x00080030) Study Time'
}, {
    id: 'studyDescription',
    text: '(x00081030) Study Description'
}, {
    id: 'abstractPriorValue',
    text: 'Abstract Prior Value'
}];

HP.protocolAttributes = [{
    id: 'patientId',
    text: '(x00100020) Patient ID'
}, {
    id: 'studyInstanceUid',
    text: '(x0020000d) Study Instance UID'
}, {
    id: 'studyDate',
    text: '(x00080020) Study Date'
}, {
    id: 'studyTime',
    text: '(x00080030) Study Time'
}, {
    id: 'studyDescription',
    text: '(x00081030) Study Description'
}, {
    id: 'anatomicRegion',
    text: 'Anatomic Region'
}];

HP.seriesAttributes = [{
    id: 'seriesInstanceUid',
    text: '(x0020000e) Series Instance UID'
}, {
    id: 'modality',
    text: '(x00080060) Modality'
}, {
    id: 'seriesNumber',
    text: '(x00080060) Series Number'
}, {
    id: 'seriesDescription',
    text: '(x0008103e) Series Description'
}, {
    id: 'numImages',
    text: 'Number of Images'
}];

HP.instanceAttributes = [{
    id: 'sopClassUid',
    text: 'SOP Class UID'
}, {
    id: 'sopInstanceUid',
    text: 'SOP Instance UID'
}, {
    id: 'viewPosition',
    text: 'View Position'
}, {
    id: 'instanceNumber',
    text: 'Instance Number'
}, {
    id: 'imageType',
    text: 'Image Type'
}, {
    id: 'frameTime',
    text: 'Frame Time'
}, {
    id: 'laterality',
    text: 'Laterality'
}, {
    id: 'index',
    text: 'Image Index'
}, {
    id: 'photometricInterpretation',
    text: 'Photometric Interpretation'
}, {
    id: 'sliceThickness',
    text: 'Slice Thickness'
}];
