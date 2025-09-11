import React from 'react';

import { ReactComponent as clipboard } from './../../assets/icons/clipboard.svg';

import { ReactComponent as eyeVisible } from './../../assets/icons/eye-visible.svg';
import { ReactComponent as eyeHidden } from './../../assets/icons/eye-hidden.svg';
import { ReactComponent as logoXylexa } from './../../../../ui/src/assets/svgs/logo-full-white.svg';
import { ReactComponent as saveIcon } from './../../assets/icons/save-icon.svg';
import { ReactComponent as chevronLeft } from './../../assets/icons/chevron-left.svg';
import { ReactComponent as dottedCircle } from './../../assets/icons/dotted-circle.svg';
import { ReactComponent as writeReport } from './../../assets/icons/write-report.svg';
import { ReactComponent as iconChevronPatient } from './../../assets/icons/icon-chevron-patient.svg';
import { ReactComponent as iconPatient } from './../../assets/icons/icon-patient.svg';

const ICONS = {
  clipboard: clipboard,
  'save-icon': saveIcon,
  'eye-visible': eyeVisible,
  'eye-hidden': eyeHidden,
  'logo-xylexa': logoXylexa,
  'chevron-left': chevronLeft,
  'dotted-circle': dottedCircle,
  'write-report': writeReport,
  'icon-chevron-patient': iconChevronPatient,
  'icon-patient': iconPatient,
};
function addIcon(iconName, iconSVG) {
  if (ICONS[iconName]) {
    console.warn(`Icon ${iconName} already exists.`);
  }

  ICONS[iconName] = iconSVG;
}

/**
 * Return the matching SVG Icon as a React Component.
 * Results in an inlined SVG Element. If there's no match,
 * return `null`
 */
export default function getIcon(key, props) {
  const icon = ICONS[key];

  if (!key || !icon) {
    return React.createElement('div', null, 'Missing Icon ' + key);
  }

  if (typeof icon === 'string' && icon.endsWith('.png')) {
    return React.createElement('img', { src: icon, ...props });
  } else {
    return React.createElement(icon, props);
  }
}

export { getIcon, ICONS, addIcon };
