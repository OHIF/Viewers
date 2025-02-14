import { connect } from 'react-redux';
import XNATStandaloneRouting from '../routes/XNATStandaloneRouting';

const mapDispatchToProps = dispatch => {
  return {
    activateServer: server => {
      const action = {
        type: 'ACTIVATE_SERVER',
        server,
      };
      dispatch(action);
    },
  };
};

const ConnectedXNATStandaloneRouting = connect(
  null,
  mapDispatchToProps
)(XNATStandaloneRouting);

export default ConnectedXNATStandaloneRouting;
