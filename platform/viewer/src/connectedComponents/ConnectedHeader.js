import Header from '../components/Header/Header.js';
import { connect } from 'react-redux';
import { hotkeysManager } from '../App.js';

const mapStateToProps = state => {
  const { hotkeyDefinitions = [] } = state.preferences || {};

  const _hotkeyDefinitions =
    hotkeyDefinitions.length > 0
      ? hotkeyDefinitions
      : hotkeysManager.hotkeyDefaults;

  hotkeysManager.setHotkeys(_hotkeyDefinitions);

  return {
    user: state.oidc && state.oidc.user,
  };
};

const ConnectedHeader = connect(mapStateToProps)(Header);

export default ConnectedHeader;
