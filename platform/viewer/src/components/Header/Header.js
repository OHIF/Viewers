import './Header.css';

import { Link, withRouter } from 'react-router-dom';
import React, { Component } from 'react';

import ConnectedUserPreferencesModal from '../../connectedComponents/ConnectedUserPreferencesModal';
import { Dropdown } from '@ohif/ui';
import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import PropTypes from 'prop-types';
import { AboutModal } from '@ohif/ui';
import { withTranslation } from 'react-i18next';

// Context
import AppContext from './../../context/AppContext';

class Header extends Component {
  static contextType = AppContext;
  static propTypes = {
    home: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    children: PropTypes.node,
    t: PropTypes.func.isRequired,
    userManager: PropTypes.object,
  };

  static defaultProps = {
    home: true,
    children: OHIFLogo(),
  };

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
      {
        title: 'Preferences ',
        icon: {
          name: 'user',
        },
        onClick: () => {
          this.setState({
            isUserPreferencesOpen: true,
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
  }

  toggleUserPreferences() {
    this.setState({ isUserPreferencesOpen: !this.state.isUserPreferencesOpen });
  }

  // ANTD -- Hamburger, Drawer, Menu
  render() {
    const { t } = this.props;
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

            <ConnectedUserPreferencesModal
              isOpen={this.state.isUserPreferencesOpen}
              onCancel={this.toggleUserPreferences.bind(this)}
              onSave={this.toggleUserPreferences.bind(this)}
              onResetToDefaults={this.toggleUserPreferences.bind(this)}
            />

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

export default withTranslation('Header')(withRouter(Header));
