import * as dcmjs from 'dcmjs';

export const isToolSupported = toolName => {
  const { adapter } = dcmjs.adapters.Cornerstone;
  return !!adapter[toolName];
};

export default isToolSupported;
