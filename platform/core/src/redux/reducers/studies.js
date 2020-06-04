import cloneDeep from 'lodash.clonedeep';

const defaultState = {
  studyData: {},
};

const servers = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_STUDY_DATA': {
      const updatedStudyData = cloneDeep(state.studyData);
      updatedStudyData[action.StudyInstanceUID] = cloneDeep(action.data);

      return Object.assign({}, state, { studyData: updatedStudyData });
    }
    default:
      return state;
  }
};

export default servers;
