import React from 'react'
import { Link } from 'react-router-dom'
import { Dropdown } from "../components"
import Icons from "../images/icons.svg"
import './Header.css'
import list from './HeaderMenuList.json'

function Header() {
  return (
    <div className='header'>
      <a target="_blank" rel="noopener noreferrer" className="brand" href="http://ohif.org">
        <svg className="logo-image">
          <use xlinkHref={`${Icons}#icon-ohif-logo`} />
        </svg>
        <div className="logo-text">Open Health Imaging Foundation</div>
      </a>

      <Link className='btn studyListLinkSection' to="/">Study list</Link>

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
