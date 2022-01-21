const id = '@ohif/extension-dicom-sr';

export default id;

const SOPClassHandlerName = 'dicom-sr';
const SOPClassHandlerId = `${id}.sopClassHandlerModule.${SOPClassHandlerName}`;
export { SOPClassHandlerName, SOPClassHandlerId };
