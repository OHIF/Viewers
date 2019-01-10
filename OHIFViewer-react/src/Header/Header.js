import React, { Component } from "react";
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { Dropdown } from '../components';
import Icons from '../images/icons.svg';
import './Header.css';
import UserPreferences from '../UserPreferences/UserPreferences';

class Header extends Component {

  static propTypes = {
    home: PropTypes.bool.isRequired,
    location: []
  };

  static defaultProps = {
    home: true
  };

  constructor(props) {
    super(props);

    this.state = {
      userPreferencesOpen: false,
    };

    this.options = [
      {
        title: 'Preferences ',
        icon: 'fa fa-user',
        onClick: this.openPreferencesClick.bind(this),
      },
      {
        title: 'About',
        icon: 'fa fa-info',
        link: 'http://ohif.org',
      }
    ];
  }

  openPreferencesClick() {
    this.setState({ userPreferencesOpen: true });
  }

  render() {
    return (<div className={`entry-header ${this.props.home ? 'header-big' : ''}`}>
      <div className='header-left-box'>
        {
          this.props.location && this.props.location.studyLink &&
          <Link to={this.props.location.studyLink} className="header-btn header-viewerLink">
            Back to Viewer
          </Link>
        }

        <a target="_blank" rel="noopener noreferrer" className="header-brand" href="http://ohif.org">
          <svg className="header-logo-image">
            <use xlinkHref={`${Icons}#icon-ohif-logo`} />
          </svg>
          <div className="header-logo-text">Open Health Imaging Foundation</div>
        </a>

        {!this.props.home &&
          <Link className='header-btn header-studyListLinkSection' to={{
            pathname: "/",
            state: { studyLink: this.props.location.pathname }
          }}>Study list</Link>
        }
      </div>


      <div className="header-menu">
        <span className="research-use">
          INVESTIGATIONAL USE ONLY {this.state.userPreferencesOpen.toString()}
        </span>
        <Dropdown
          title='Options'
          list={this.options}
          align='right'
        />
        <UserPreferences modalOpen={this.state.userPreferencesOpen} closeModal={() => { this.setState({ userPreferencesOpen: false }) }} />
      </div>
    </div>
    );
  }
}


export default withRouter(Header)
