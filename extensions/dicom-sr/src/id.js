import packageJson from '../package.json';

const id = packageJson.name;
const version = packageJson.version;

const SOPClassHandlerName = 'dicom-sr';
const SOPClassHandlerId = `${id}.sopClassHandlerModule.${SOPClassHandlerName}`;

export { SOPClassHandlerName, SOPClassHandlerId, version, id };
