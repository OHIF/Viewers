import './Header.css';

import { Link, withRouter } from 'react-router-dom';
import React, { Component } from 'react';

import { Dropdown } from 'react-viewerbase';
import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import PropTypes from 'prop-types';
// import { UserPreferencesModal } from 'react-viewerbase';
import { hotkeysManager } from './../../App.js';

class Header extends Component {
  static propTypes = {
    home: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    children: PropTypes.node,
  };

  static defaultProps = {
    home: true,
    children: OHIFLogo(),
  };

  // onSave: data => {
  //   const contextName = window.store.getState().commandContext.context;
  //   const preferences = cloneDeep(window.store.getState().preferences);
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
    this.state = { isUserPreferencesOpen: false };

    // const onClick = this.toggleUserPreferences.bind(this);

    this.options = [
      // {
      //   title: 'Preferences ',
      //   icon: {
      //     name: 'user',
      //   },
      //   onClick: onClick,
      // },
      {
        title: 'About',
        icon: {
          name: 'info',
        },
        link: 'http://ohif.org',
      },
    ];

    this.hotKeysData = hotkeysManager.hotkeyDefinitions;
  }

  toggleUserPreferences() {
    const isOpen = this.state.isUserPreferencesOpen;

    this.setState({
      isUserPreferencesOpen: !isOpen,
    });
  }

  onUserPreferencesSave({ windowLevelData, hotKeysData }) {
    // console.log(windowLevelData);
    // console.log(hotKeysData);
    // TODO: Update hotkeysManager
    // TODO: reset `this.hotKeysData`
  }

  render() {
    return (
      <div className={`entry-header ${this.props.home ? 'header-big' : ''}`}>
        <div className="header-left-box">
          {this.props.location && this.props.location.studyLink && (
            <Link
              to={this.props.location.studyLink}
              className="header-btn header-viewerLink"
            >
              Back to Viewer
            </Link>
          )}

          {this.props.children}

          {!this.props.home && (
            <Link
              className="header-btn header-studyListLinkSection"
              to={{
                pathname: '/',
                state: { studyLink: this.props.location.pathname },
              }}
            >
              Study list
            </Link>
          )}
        </div>

        <div className="header-menu">
          <span className="research-use">INVESTIGATIONAL USE ONLY</span>
          <Dropdown title="Options" list={this.options} align="right" />
          {/* <UserPreferencesModal
            isOpen={this.state.isUserPreferencesOpen}
            onCancel={this.toggleUserPreferences.bind(this)}
            onSave={this.toggleUserPreferences.bind(this)}
            onResetToDefaults={this.toggleUserPreferences.bind(this)}
            windowLevelData={{}}
            hotKeysData={this.hotKeysData}
          /> */}
        </div>
      </div>
    );
  }
}

export default withRouter(Header);
