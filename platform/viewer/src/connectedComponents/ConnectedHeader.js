import Header from '../components/Header/Header.js';
import { connect } from 'react-redux';
import { hotkeysManager } from '../App.js';

const mapStateToProps = state => {
  const hotkeyDefinitions =
    state.preferences.hotkeyDefinitions.length > 0
      ? state.preferences.hotkeyDefinitions
      : hotkeysManager.hotkeyDefaults;
  hotkeysManager.setHotkeys(hotkeyDefinitions);

  return {
    user: state.oidc && state.oidc.user,
  };
};

const ConnectedHeader = connect(mapStateToProps)(Header);

export default ConnectedHeader;
