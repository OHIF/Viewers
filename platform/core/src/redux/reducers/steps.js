import cloneDeep from 'lodash.clonedeep';

export const BrainApplicationSteps = {
  1: {
    step: 1,
    title: 'StudyLists ',
    href: '/studylist',
    icon: 'studylist',
  },
  2: {
    step: 2,
    title: 'Viewer',
    href: '/view',
    icon: 'view',
  },
  3: {
    step: 3,
    title: 'nnUnet',
    href: '/nnunet',
    icon: 'nnunet',
  },
  4: {
    step: 4,
    title: 'Segmentations',
    href: '/edit',
    icon: 'segmentation',
  },
  5: {
    step: 5,
    title: 'Mask Selection',
    href: '/selectmask',
    icon: 'mask',
  },
  6: {
    step: 6,
    title: 'Radionics',
    href: '/radionics',
    icon: 'radiomic',
  },
};

export const LungApplicationSteps = {
  1: {
    step: 1,
    title: 'StudyLists ',
    href: '/studylist',
    icon: 'studylist',
  },
  2: {
    step: 2,
    title: 'Viewer',
    href: '/view',
    icon: 'view',
  },
  3: {
    step: 3,
    title: 'Segmentations',
    href: '/edit',
    icon: 'segmentation',
  },
  4: {
    step: 4,
    title: 'Mask Selection',
    href: '/selectmask',
    icon: 'mask',
  },
  5: {
    step: 5,
    title: 'Radionics',
    href: '/radionics',
    icon: 'radiomic',
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
