import { connect } from 'react-redux';
import StandaloneRouting from '../routes/RadiomicsRouting';

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

const ConnectedRadiomicsRouting = connect(
  null,
  mapDispatchToProps
)(StandaloneRouting);

export default ConnectedRadiomicsRouting;
