import { adaptersSR } from '@cornerstonejs/adapters';

/**
 *  Checks if dcmjs has support to determined tool
 *
 * @param {string} toolName
 * @returns {boolean}
 */
const isToolSupported = toolName => {
  const adapter = adaptersSR.Cornerstone3D;
  return !!adapter[toolName];
};

export default isToolSupported;
