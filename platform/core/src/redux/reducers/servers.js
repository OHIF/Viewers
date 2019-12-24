import uniqBy from 'lodash/uniqBy';

export const defaultState = {
  servers: [],
};

const servers = (state = defaultState, action) => {
  switch (action.type) {
    case 'ADD_SERVER':
      let servers = uniqBy([...state.servers, action.server], 'id');
      servers.forEach(s => (s.active = true));
      return { ...state, servers };

    case 'SET_SERVERS':
      return { ...state, servers: action.servers };

    default:
      return state;
  }
};

export default servers;
