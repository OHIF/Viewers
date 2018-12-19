import React from 'react'
import './Header.css'
import Icons from "../images/icons.svg"

export default function Header() {
  return (
    <div className='header'>
      <a target="_blank" rel="noopener noreferrer" className="brand" href="http://ohif.org">
        <svg className="logo-image">
          <use xlinkHref={`${Icons}#icon-ohif-logo`} />
        </svg>
        <div className="logo-text">Open Health Imaging Foundation</div>
      </a>
      <a href="#" class="btn studyListLinkSection pull-left js-toggle-studyList">
        Study list
      </a>
    </div>
  )
}
