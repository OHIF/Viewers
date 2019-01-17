import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { Dropdown } from "react-viewerbase";
import './Header.css';
import list from './HeaderMenuList.json';
//import Icons from "../../images/icons.svg";

const Icons = '/icons.svg';

function Header({ home, location }) {
  const { state } = location

  return (
    <div className={`entry-header ${home ? 'header-big' : ''}`}>
      <div className='header-left-box'>
        {
          state && state.studyLink &&
          <Link to={state.studyLink} className="header-btn header-viewerLink">
            Back to Viewer
          </Link>
        }

        <a target="_blank" rel="noopener noreferrer" className="header-brand" href="http://ohif.org">
          <svg className="header-logo-image">
            <use xlinkHref={`${Icons}#icon-ohif-logo`} />
          </svg>
          <div className="header-logo-text">Open Health Imaging Foundation</div>
        </a>

        {!home &&
          <Link className='header-btn header-studyListLinkSection' to={{
            pathname: "/",
            state: { studyLink: location.pathname }
          }}>Study list</Link>
        }
      </div>


      <div className="header-menu">
        <span className="research-use">
                INVESTIGATIONAL USE ONLY
        </span>
        <Dropdown
          title='Options'
          list={list}
          align='right'
        />
      </div>

    </div>
  )
}

Header.propTypes = {
    home: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired
};

Header.defaultProps = {
    home: true
};

export default withRouter(Header)
