import { connect } from 'react-redux';
import Header from '../components/Header/Header.js';
import { setUserPreferencesModalOpen } from '../redux/actions.js';

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
