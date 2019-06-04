import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { Dropdown } from 'react-viewerbase';
import { withTranslation } from 'react-i18next';
import './Header.css';
import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import ConnectedUserPreferencesModal from '../../connectedComponents/ConnectedUserPreferencesModal.js';

class Header extends Component {
  static propTypes = {
    home: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    openUserPreferencesModal: PropTypes.func,
    children: PropTypes.node,
    t: PropTypes.func,
    i18n: PropTypes.object,
  };

  static defaultProps = {
    home: true,
    children: OHIFLogo(),
  };

  constructor(props) {
    super(props);

    this.state = {
      userPreferencesOpen: false,
    };

    this.loadOptions();
  }

  loadOptions() {
    const { t } = this.props;
    this.options = [
      {
        title: t('preferences'),
        icon: 'fa fa-user',
        onClick: this.props.openUserPreferencesModal,
      },
      {
        title: t('about'),
        icon: 'fa fa-info',
        link: 'http://ohif.org',
      },
    ];
  }

  changeLanguage(language) {
    const { i18n } = this.props;
    i18n.init({
      lng: language
    });
    this.loadOptions();
  }

  render() {
    const { t } = this.props;
    return (
      <div className={`entry-header ${this.props.home ? 'header-big' : ''}`}>
        <div className="header-left-box">
          {this.props.location && this.props.location.studyLink && (
            <Link
              to={this.props.location.studyLink}
              className="header-btn header-viewerLink"
            >
              {t('back_to_viewer')}
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
              {t('study_list')}
            </Link>
          )}
        </div>

        <div className="header-menu">
          <span className="research-use">{t('research_use')}</span>
          <button
            className="research-use"
            onClick={() => this.changeLanguage('en-US')}
          >
            EN-US
          </button>
          <button
            className="research-use"
            onClick={() => this.changeLanguage('en-UK')}
          >
            EN-UK
          </button>
          <button
            className="research-use"
            onClick={() => this.changeLanguage('es-AR')}
          >
            ES-AR
          </button>
          <button
            className="research-use"
            onClick={() => this.changeLanguage('es-MX')}
          >
            ES-MX
          </button>
          <Dropdown
            title={t('options')}
            list={this.options}
            align="right"
          />
          <ConnectedUserPreferencesModal />
        </div>
      </div>
    );
  }
}

export default withTranslation('Header')(withRouter(Header));
