import { connect } from 'react-redux';
import DicomStorePickerModal from './DicomStorePickerModal.js';

const isActive = a => a.active === true;

const mapStateToProps = state => {
  const activeServer = state.servers.servers.find(isActive);

  return {
    user: state.oidc && state.oidc.user,
    url: activeServer && activeServer.qidoRoot,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setServers: servers => {
      const action = {
        type: 'SET_SERVERS',
        servers,
      };
      dispatch(action);
    },
  };
};

const ConnectedDicomStorePicker = connect(
  mapStateToProps,
  mapDispatchToProps
)(DicomStorePickerModal);

export default ConnectedDicomStorePicker;
