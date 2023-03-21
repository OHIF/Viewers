/**
 * Coding values is a map of simple string coding values to a set of
 * attributes associated with the coding value.
 *
 * The simple string is in the format `<codingSchemeDesignator>:<codingValue>`
 * That allows extracting the DICOM attributes from the designator/value, and
 * allows for passing around the simple string.
 * The additional attributes contained in the object include:
 *       * text - this is the coding scheme text display value, and may be language specific
 *       * type - this defines a named type, typically 'site'.  Different names can be used
 *                to allow setting different findingSites values in order to define a hierarchy.
 *       * color - used to apply annotation color
 * It is also possible to define additional attributes here, used by custom
 * extensions.
 *
 * See https://dicom.nema.org/medical/dicom/current/output/html/part16.html
 * for definitions of SCT and other code values.
 */
const codingValues = {
  id: 'codingValues',

  // Sites
  'SCT:69536005': {
    text: 'Head',
    type: 'site',
  },
  'SCT:45048000': {
    text: 'Neck',
    type: 'site',
  },
  'SCT:818981001': {
    text: 'Abdomen',
    type: 'site',
  },
  'SCT:816092008': {
    text: 'Pelvis',
    type: 'site',
  },

  // Findings
  'SCT:371861004': {
    text: 'Mild intimal coronary irregularities',
    color: 'green',
  },
  'SCT:194983005': {
    text: 'Aortic insufficiency',
    color: 'darkred',
  },
  'SCT:399232001': {
    text: '2-chamber',
  },
  'SCT:103340004': {
    text: 'SAX',
  },
  'SCT:91134007': {
    text: 'MV',
  },
  'SCT:122972007': {
    text: 'PV',
  },

  // Orientations
  'SCT:24422004': {
    text: 'Axial',
    color: '#000000',
    type: 'orientation',
  },
  'SCT:81654009': {
    text: 'Coronal',
    color: '#000000',
    type: 'orientation',
  },
  'SCT:30730003': {
    text: 'Sagittal',
    color: '#000000',
    type: 'orientation',
  },
};

export default codingValues;
