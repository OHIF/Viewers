import packageJson from '../package.json';

const id = packageJson.name;
const SOPClassHandlerName = 'dicom-pmap';
const SOPClassHandlerId = `${id}.sopClassHandlerModule.${SOPClassHandlerName}`;

export { id, SOPClassHandlerId, SOPClassHandlerName };
