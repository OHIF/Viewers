export const attributeDefaults = {
  abstractPriorValue: 0,
};

export const displaySettings = {
  invert: {
    id: 'invert',
    text: 'Show Grayscale Inverted',
    defaultValue: 'NO',
    options: ['YES', 'NO'],
  },
};

// @TODO Fix abstractPriorValue comparison
export const studyAttributes = [
  {
    id: 'x00100020',
    text: '(x00100020) Patient ID',
  },
  {
    id: 'x0020000d',
    text: '(x0020000d) Study Instance UID',
  },
  {
    id: 'x00080020',
    text: '(x00080020) Study Date',
  },
  {
    id: 'x00080030',
    text: '(x00080030) Study Time',
  },
  {
    id: 'x00081030',
    text: '(x00081030) Study Description',
  },
  {
    id: 'abstractPriorValue',
    text: 'Abstract Prior Value',
  },
];

export const protocolAttributes = [
  {
    id: 'x00100020',
    text: '(x00100020) Patient ID',
  },
  {
    id: 'x0020000d',
    text: '(x0020000d) Study Instance UID',
  },
  {
    id: 'x00080020',
    text: '(x00080020) Study Date',
  },
  {
    id: 'x00080030',
    text: '(x00080030) Study Time',
  },
  {
    id: 'x00081030',
    text: '(x00081030) Study Description',
  },
  {
    id: 'anatomicRegion',
    text: 'Anatomic Region',
  },
];

export const seriesAttributes = [
  {
    id: 'x0020000e',
    text: '(x0020000e) Series Instance UID',
  },
  {
    id: 'x00080060',
    text: '(x00080060) Modality',
  },
  {
    id: 'x00200011',
    text: '(x00200011) Series Number',
  },
  {
    id: 'x0008103e',
    text: '(x0008103e) Series Description',
  },
  {
    id: 'numImages',
    text: 'Number of Images',
  },
];

export const instanceAttributes = [
  {
    id: 'x00080016',
    text: '(x00080016) SOP Class UID',
  },
  {
    id: 'x00080018',
    text: '(x00080018) SOP Instance UID',
  },
  {
    id: 'x00185101',
    text: '(x00185101) View Position',
  },
  {
    id: 'x00200013',
    text: '(x00200013) Instance Number',
  },
  {
    id: 'x00080008',
    text: '(x00080008) Image Type',
  },
  {
    id: 'x00181063',
    text: '(x00181063) Frame Time',
  },
  {
    id: 'x00200060',
    text: '(x00200060) Laterality',
  },
  {
    id: 'x00541330',
    text: '(x00541330) Image Index',
  },
  {
    id: 'x00280004',
    text: '(x00280004) Photometric Interpretation',
  },
  {
    id: 'x00180050',
    text: '(x00180050) Slice Thickness',
  },
];
