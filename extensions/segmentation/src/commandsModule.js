// "actions" doesn't really mean anything
// these are basically ambigous sets of implementation(s)
const actions = {
  doGoofyStuff: () => {
    console.log('~~ GOOFY');
  },
};

const definitions = {
  doGoofyStuff: {
    commandFn: actions.doGoofyStuff,
    storeContexts: [],
    // options: { rotation: 90 },
  },
};

export default {
  actions,
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
