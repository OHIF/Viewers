import packageJson from '../package.json';

const id = packageJson.name;
const SOPClassHandlerId = `${id}.sopClassHandlerModule.dicom-pdf`;

export { id, SOPClassHandlerId };
