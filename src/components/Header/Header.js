import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { Dropdown } from 'react-viewerbase';
import './Header.css';
import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import ConnectedUserPreferencesModal from '../../connectedComponents/ConnectedUserPreferencesModal.js';

class Header extends Component {
  static propTypes = {
    home: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    openUserPreferencesModal: PropTypes.func,
    children: PropTypes.node
  };

  static defaultProps = {
    home: true,
    children: OHIFLogo()
  };

  constructor(props) {
    super(props);

    this.state = {
      userPreferencesOpen: false
    };

    this.options = [
      {
        title: 'Preferences ',
        icon: 'fa fa-user',
        onClick: this.props.openUserPreferencesModal
      },
      {
        title: 'About',
        icon: 'fa fa-info',
        link: 'http://ohif.org'
      }
    ];
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
                state: { studyLink: this.props.location.pathname }
              }}
            >
              Study list
            </Link>
          )}
        </div>

        <div className="header-menu">
          <span className="research-use">INVESTIGATIONAL USE ONLY</span>
          <Dropdown title="Options" list={this.options} align="right" />
          <ConnectedUserPreferencesModal />
        </div>
      </div>
    );
  }
}

export default withRouter(Header);
