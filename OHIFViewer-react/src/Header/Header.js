import React from 'react'
import { Link } from 'react-router-dom'
import { Dropdown } from "../components"
import Icons from "../images/icons.svg"
import './Header.css'
import list from './HeaderMenuList.json'

function Header({ home }) {
  return (
    <div className={`entry-header ${home ? 'header-big' : ''}`}>
      <a target="_blank" rel="noopener noreferrer" className="header-brand" href="http://ohif.org">
        <svg className="header-logo-image">
          <use xlinkHref={`${Icons}#icon-ohif-logo`} />
        </svg>
        <div className="header-logo-text">Open Health Imaging Foundation</div>
      </a>

      {!home && <Link className='header-btn header-studyListLinkSection' to="/">Study list</Link>}

      <div className="header-menu">
        {/* TODO: research-use */}

        <Dropdown
          title='Options'
          list={list}
          align='right'
        />
      </div>

    </div>
  )
}

export default Header
