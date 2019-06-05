import { connect } from 'react-redux';
//import OHIF from 'ohif-core';
import DicomStorePicker from './DicomStorePicker.js';

//const { actions } = OHIF.redux;

const isActive = a => a.active === true;

const mapStateToProps = state => {
  const activeServer = state.servers.servers.find(isActive);

  // TODO: Find a better place to store this and grab it from
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

      // TODO: We should add an action creation function to ohif-core instead of using the object above
      //dispatch(actions.setServers(servers));
    },
  };
};

const ConnectedDicomStorePicker = connect(
  mapStateToProps,
  mapDispatchToProps
)(DicomStorePicker);

export default ConnectedDicomStorePicker;
