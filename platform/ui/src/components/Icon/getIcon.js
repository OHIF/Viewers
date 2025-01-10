import React from 'react';

const ICONS = {};
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
