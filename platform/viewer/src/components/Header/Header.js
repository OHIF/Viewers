import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import ConnectedUserPreferencesModal from '../../connectedComponents/ConnectedUserPreferencesModal';
import { Dropdown } from '@ohif/ui';
import { AboutContent } from '@ohif/ui';
import { withModal } from '@ohif/ui';
import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import { hotkeysManager } from './../../App.js';
import './Header.css';

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
    user: PropTypes.object,
    modalContext: PropTypes.object,
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
          show(AboutContent, {
            title: t('OHIF Viewer - About'),
            customClassName: 'AboutContent',
          }),
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

    if (user && userManager) {
      this.options.push({
        title: t('Logout'),
        icon: { name: 'power-off' },
        onClick: () => userManager.signoutRedirect(),
      });
    }
  }

  toggleUserPreferences() {
    this.setState({ isUserPreferencesOpen: !this.state.isUserPreferencesOpen });
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
        <div className={`entry-header ${home ? 'header-big' : ''}`}>
          <div className="header-left-box">
            {location && location.studyLink && (
              <Link
                to={location.studyLink}
                className="header-btn header-viewerLink"
              >
                {t('Back to Viewer')}
              </Link>
            )}

            {children}

            {showStudyList && !home && (
              <Link
                className="header-btn header-studyListLinkSection"
                to={{
                  pathname: '/',
                  state: { studyLink: location.pathname },
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
          </div>
        </div>
      </>
    );
  }
}

export default withTranslation(['Header', 'AboutModal'])(
  withRouter(withModal(Header))
);
