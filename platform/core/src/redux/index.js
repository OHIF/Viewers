import actions from './actions.js';
import reducers from './reducers';
import localStorage from './localStorage.js';
import sessionStorage from './sessionStorage.js';

const redux = {
  reducers,
  actions,
  localStorage,
  sessionStorage,
};

export default redux;
