const defaultState = {
  collections: [],
  isFetching: false,
  error: null,
};

const collections = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_COLLECTION_DATA': {
      return Object.assign({}, state, {
        collections: action.collections || [],
      });
    }
    default:
      return state;
  }
};

export default collections;
