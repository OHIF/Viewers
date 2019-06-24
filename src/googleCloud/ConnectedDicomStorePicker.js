import { connect } from 'react-redux';
import DicomStorePickerWindow from './DicomStorePickerWindow.js';

const isActive = a => a.active === true;

const mapStateToProps = state => {
  const activeServer = state.servers.servers.find(isActive);
  const { authority, client_id } = window.config.oidc[0];
  const oidcStorageKey = `oidc.user:${authority}:${client_id}`;

  return {
    oidcStorageKey,
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
)(DicomStorePickerWindow);

export default ConnectedDicomStorePicker;
