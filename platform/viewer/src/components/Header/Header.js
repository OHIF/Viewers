import './Header.css';
import './Header.css';

import { Link, withRouter } from 'react-router-dom';
import React, { Component } from 'react';

import { Dropdown } from '@ohif/ui';
import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import PropTypes from 'prop-types';
import { AboutModal } from '@ohif/ui';
import { hotkeysManager } from './../../App.js';
import { withTranslation } from 'react-i18next';

class Header extends Component {
  static propTypes = {
    home: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    children: PropTypes.node,
    t: PropTypes.func.isRequired,
    userManager: PropTypes.object
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
    const { t } = this.props;
    this.options = [
      {
        title: t('About'),
        icon: { name: 'info' },
        onClick: () => {
          this.setState({
            isOpen: true,
          });
        },
      },
    ];

    if (this.props.user && this.props.userManager) {
      this.options.push({
        title: t('Logout'),
          icon: { name: 'power-off' },
          onClick: () => {
            this.props.userManager.signoutRedirect();
          },
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

  render() {
    const { t } = this.props;
    const showStudyList =
      window.config.showStudyList !== undefined
        ? window.config.showStudyList
        : true;
    return (
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
          <span className="research-use">{t('INVESTIGATIONAL USE ONLY')}</span>
          <Dropdown title={t('Options')} list={this.options} align="right" />
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
    );
  }
}

export default withTranslation('Header')(withRouter(Header));
