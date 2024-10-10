import packageJson from '../package.json';

const id = packageJson.name;

const SOPClassHandlerName = 'dicom-sr';
const SOPClassHandlerId = `${id}.sopClassHandlerModule.${SOPClassHandlerName}`;

const SOPClassHandlerName3D = 'dicom-sr-3d';
const SOPClassHandlerId3D = `${id}.sopClassHandlerModule.${SOPClassHandlerName3D}`;

export { SOPClassHandlerName, SOPClassHandlerId, SOPClassHandlerName3D, SOPClassHandlerId3D, id };
