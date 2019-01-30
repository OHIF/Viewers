import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { Dropdown } from 'react-viewerbase';
import './Header.css';
import list from './HeaderMenuList.json';
import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
//import Icons from "../../images/icons.svg";

//const Icons = '/icons.svg';

function Header({ home, location, children }) {
  const { state } = location;

  if (!children) {
    children = OHIFLogo();
  }

  return (
    <div className={`entry-header ${home ? 'header-big' : ''}`}>
      <div className="header-left-box">
        {state && state.studyLink && (
          <Link to={state.studyLink} className="header-btn header-viewerLink">
            Back to Viewer
          </Link>
        )}

        {children}

        {!home && (
          <Link
            className="header-btn header-studyListLinkSection"
            to={{
              pathname: '/',
              state: { studyLink: location.pathname }
            }}
          >
            Study list
          </Link>
        )}
      </div>

      <div className="header-menu">
        <span className="research-use">INVESTIGATIONAL USE ONLY</span>
        <Dropdown title="Options" list={list} align="right" />
      </div>
    </div>
  );
}

Header.propTypes = {
  home: PropTypes.bool.isRequired,
  location: PropTypes.object.isRequired,
  children: PropTypes.node
};

Header.defaultProps = {
  home: true
};

export default withRouter(Header);
