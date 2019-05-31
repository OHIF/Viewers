import Header from '../components/Header/Header.js';
import { connect } from 'react-redux';
import { setUserPreferencesModalOpen } from '../store/layout/actions.js';

const mapStateToProps = state => {
  return {
    isOpen: state.ui.userPreferencesModalOpen,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    openUserPreferencesModal: () => {
      dispatch(setUserPreferencesModalOpen(true));
    },
  };
};

const ConnectedHeader = connect(
  mapStateToProps,
  mapDispatchToProps
)(Header);

export default ConnectedHeader;
