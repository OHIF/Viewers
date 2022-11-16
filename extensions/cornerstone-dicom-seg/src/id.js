import packageJson from '../package.json';

const id = packageJson.name;
const SOPClassHandlerName = 'dicom-seg';
const SOPClassHandlerId = `${id}.sopClassHandlerModule.${SOPClassHandlerName}`;

export { id, SOPClassHandlerId, SOPClassHandlerName };
