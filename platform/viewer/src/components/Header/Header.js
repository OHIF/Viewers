import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import { Dropdown } from '@ohif/ui';
import { AboutModal } from '@ohif/ui';

import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import { hotkeysManager } from './../../App.js';
import './Header.css';
// Context
import AppContext from './../../context/AppContext';
import { withModal } from '../../../../ui/src/utils/ModalProvider.js';

class Header extends Component {
  static contextType = AppContext;
  static propTypes = {
    home: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    children: PropTypes.node,
    t: PropTypes.func.isRequired,
    userManager: PropTypes.object,
    user: PropTypes.object,
    modalContext: PropTypes.object,
  };

  static defaultProps = {
    home: true,
    children: OHIFLogo(),
  };

  // onSave: data => {
  //   const contextName = store.getState().commandContext.context;
  //   const preferences = cloneDeep(store.getState().preferences);
  //   preferences[contextName] = data;
  //   dispatch(setUserPreferences(preferences));
  //   dispatch(setUserPreferencesModalOpen(false));
  //   OHIF.hotkeysUtil.setHotkeys(data.hotKeysData);
  // },
  // onResetToDefaults: () => {
  //   dispatch(setUserPreferences());
  //   dispatch(setUserPreferencesModalOpen(false));
  //   OHIF.hotkeysUtil.setHotkeys();
  // },

  constructor(props) {
    super(props);
    this.state = { isUserPreferencesOpen: false, isOpen: false };

    this.loadOptions();
  }

  loadOptions() {
    const {
      t,
      user,
      userManager,
      modalContext: { show },
    } = this.props;
    this.options = [
      {
        title: t('About'),
        icon: { name: 'info' },
        onClick: () =>
          show(AboutModal, {
            className: 'AboutModal modal fade themed in',
            title: t('OHIF Viewer - About'),
          }),
      },
    ];

    if (user && userManager) {
      this.options.push({
        title: t('Logout'),
        icon: { name: 'power-off' },
        onClick: () => userManager.signoutRedirect(),
      });
    }

    this.hotKeysData = hotkeysManager.hotkeyDefinitions;
  }

  onUserPreferencesSave({ windowLevelData, hotKeysData }) {
    // console.log(windowLevelData);
    // console.log(hotKeysData);
    // TODO: Update hotkeysManager
    // TODO: reset `this.hotKeysData`
  }

  // ANTD -- Hamburger, Drawer, Menu
  render() {
    const { t, home, location, children } = this.props;
    const { appConfig = {} } = this.context;
    const showStudyList =
      appConfig.showStudyList !== undefined ? appConfig.showStudyList : true;
    return (
      <>
        <div className="notification-bar">{t('INVESTIGATIONAL USE ONLY')}</div>
        <div className={`entry-header ${this.props.home ? 'header-big' : ''}`}>
          <div className="header-left-box">
            {this.props.location && this.props.location.studyLink && (
              <Link
                to={this.props.location.studyLink}
                className="header-btn header-viewerLink"
              >
                {t('Back to Viewer')}
              </Link>
            )}

            {this.props.children}

            {showStudyList && !this.props.home && (
              <Link
                className="header-btn header-studyListLinkSection"
                to={{
                  pathname: '/',
                  state: { studyLink: this.props.location.pathname },
                }}
              >
                {t('Study list')}
              </Link>
            )}
          </div>

          <div className="header-menu">
            <span className="research-use">
              {t('INVESTIGATIONAL USE ONLY')}
            </span>
            <Dropdown title={t('Options')} list={this.options} align="right" />

            {/* TODO: We need a Modal service */}
            <AboutModal
              {...this.state}
              onCancel={() =>
                this.setState({
                  isOpen: false,
                })
              }
            />
          </div>
        </div>
      </>
    );
  }
}

export default withTranslation('Header')(withRouter(withModal(Header)));
