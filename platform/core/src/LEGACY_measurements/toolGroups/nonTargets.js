import { nonTarget } from '../tools';

export const nonTargets = {
  id: 'nonTargets',
  name: 'Non-Targets',
  childTools: [nonTarget],
  options: {
    caseProgress: {
      include: true,
      evaluate: true,
    },
  },
};
