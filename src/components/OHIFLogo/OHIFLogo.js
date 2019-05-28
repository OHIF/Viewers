import React from 'react'
import './OHIFLogo.css'

import { Icon } from 'react-viewerbase'

function OHIFLogo() {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="header-brand"
      href="http://ohif.org"
    >
      <Icon name="ohif-log" className="header-logo-image" />
      <div className="header-logo-text">Open Health Imaging Foundation</div>
    </a>
  )
}

export default OHIFLogo
