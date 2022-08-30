import cloneDeep from 'lodash.clonedeep';

export const ApplicationSteps = {
  1: {
    step: 1,
    title: 'StudyLists ',
    href: '/studylist',
  },
  2: {
    step: 2,
    title: 'Viewer',
    href: '/view',
  },
  3: {
    step: 3,
    title: 'nnUnet',
    href: '/nnunet',
  },
  4: {
    step: 4,
    title: 'Edit Segmentation',
    href: '/edit',
  },
  5: {
    step: 5,
    title: 'Radionics Reports',
    href: '/radionics',
  },
};
const defaultState = {
  activeStep: {},
};

const steps = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_ACTIVE_STEP': {
      const activeStep = ApplicationSteps[action.step] || {};
      return Object.assign({}, state, { activeStep });
    }
    default:
      return state;
  }
};

export default steps;
