const defaultState = {
  mask: {},
};

const SelectionMask = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_SELECTION_MASK': {
      return { ...state, mask: action.mask };
    }
    default:
      return state;
  }
};

export default SelectionMask;
