export default {
  customOnDropHandler: {
    $set: props => {
      return Promise.resolve({ handled: false });
    },
  },
};
