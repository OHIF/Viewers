import redux from './../redux';

const addUserPreferences = ({ store, preferences }) => {
  store.dispatch(redux.actions.setUserPreferences(preferences));
};

export default addUserPreferences;
