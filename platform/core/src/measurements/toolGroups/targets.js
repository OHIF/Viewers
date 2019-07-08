import { bidirectional, targetCR, targetUN, targetNE } from '../tools';

export const targets = {
  id: 'targets',
  name: 'Targets',
  childTools: [bidirectional, targetCR, targetUN, targetNE],
  options: {
    caseProgress: {
      include: true,
      evaluate: true,
    },
  },
};
