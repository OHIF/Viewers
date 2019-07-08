import { length, ellipticalRoi } from '../tools';
import cloneDeep from 'lodash.clonedeep';

const childTools = cloneDeep([length, ellipticalRoi]);

// Exclude temp tools from case progress
childTools.forEach(childTool => {
  childTool.options = Object.assign({}, childTool.options, {
    caseProgress: {
      include: false,
      evaluate: false,
    },
  });
});

export const temp = {
  id: 'temp',
  name: 'Temporary',
  childTools,
  options: {
    caseProgress: {
      include: false,
      evaluate: false,
    },
  },
};
