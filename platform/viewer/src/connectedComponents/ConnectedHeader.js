import Header from '../components/Header/Header.js';
import { connect } from 'react-redux';
import { hotkeysManager } from '../App.js';
import cloneDeep from 'lodash.clonedeep';

const mapStateToProps = state => {
  const isEmpty = obj => Object.keys(obj).length === 0;
  const newHotKeysData =
    state.preferences && !isEmpty(state.preferences.hotKeysData)
      ? state.preferences.hotKeysData
      : hotkeysManager.hotkeyDefinitions;
  hotkeysManager.setHotkeys(hotkeysManager.format(cloneDeep(newHotKeysData)));

  return {
    user: state.oidc && state.oidc.user,
  };
};

const ConnectedHeader = connect(mapStateToProps)(Header);

export default ConnectedHeader;
