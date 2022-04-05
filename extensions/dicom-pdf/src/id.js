import packageJson from '../package.json';

const id = packageJson.name;
const version = packageJson.version;
const SOPClassHandlerId = `${id}.sopClassHandlerModule.dicom-pdf`;

export { id, SOPClassHandlerId, version };
