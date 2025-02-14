import { connect } from 'react-redux';
import StandaloneRouting from '../routes/StandaloneRouting';

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

const ConnectedStandaloneRouting = connect(
  null,
  mapDispatchToProps
)(StandaloneRouting);

export default ConnectedStandaloneRouting;
