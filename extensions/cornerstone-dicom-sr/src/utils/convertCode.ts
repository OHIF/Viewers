/**
 * Converts a DICOM code value into an object with more information such
 * as whether the code is a key value, any colouring etc.
 *
 * @param codingValues - map from string codes to code information
 * @param code - the code we want more inofrmation about
 * @returns An enhanced code value that includes the DICOM coding information
 *   as well as other information.
 */
const convertCode = (codingValues, code) => {
  if (!code || code.CodingSchemeDesignator === 'CORNERSTONEJS') return;
  const ref = `${code.CodingSchemeDesignator}:${code.CodeValue}`;
  const codeLookup = codingValues[ref];
  const ret = {
    ref,
    ...code,
    ...codeLookup,
    CodeMeaning: codeLookup?.text || code.codeMeaning,
    text: codeLookup?.text || code.CodeMeaning,
  };
  return ret;
};

export default convertCode;
