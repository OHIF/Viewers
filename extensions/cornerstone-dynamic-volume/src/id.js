import packageJson from '../package.json';

const id = packageJson.name;
const SOPClassHandlerName = 'dynamic-volume';
const SOPClassHandlerId = `${id}.sopClassHandlerModule.${SOPClassHandlerName}`;

export { id, SOPClassHandlerId, SOPClassHandlerName };
