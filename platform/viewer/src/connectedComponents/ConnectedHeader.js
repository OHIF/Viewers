import Header from '../components/Header/Header.js';
import { connect } from 'react-redux';

const isActive = a => a.active === true;

const mapStateToProps = state => {
  const activeServer = state.servers.servers.find(isActive);

  return {
    server: activeServer,
    user: state.oidc && state.oidc.user,
  };
};

const ConnectedHeader = connect(mapStateToProps)(Header);

export default ConnectedHeader;
