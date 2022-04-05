import packageJson from '../package.json';

const id = packageJson.name;
const version = packageJson.version;
const SOPClassHandlerId = `${id}.sopClassHandlerModule.dicom-video`;

export { SOPClassHandlerId, id, version };
