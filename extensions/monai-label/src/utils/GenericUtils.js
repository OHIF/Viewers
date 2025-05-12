/*
Copyright (c) MONAI Consortium
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { GenericAnatomyColors, GenericNames } from './GenericAnatomyColors';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function randomRGB(toHex = false) {
  const o = Math.round,
    r = Math.random,
    s = 255;
  const x = o(r() * s);
  const y = o(r() * s);
  const z = o(r() * s);
  return toHex ? rgbToHex(x, y, z) : { r: x, g: y, b: z };
}

function randomName() {
  return GenericNames[getRandomInt(0, GenericNames.length)];
}

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function fixedRGBForLabel(str, toHex = false) {
  const r = generateIntForString(str);
  const x = (2 * r) % 256;
  const y = (3 * r) % 256;
  const z = (5 * r) % 256;
  return toHex ? rgbToHex(x, y, z) : { r: x, g: y, b: z };
}

function generateIntForString(str) {
  let hash = str.length * 4;
  for (let i = 0; i < str.length; ++i) {
    hash += str.charCodeAt(i);
  }
  return hash;
}

function getLabelColor(label, rgb = true, random = true) {
  const name = label.toLowerCase();
  for (const i of GenericAnatomyColors) {
    if (i.label === name) {
      return rgb ? hexToRgb(i.value) : i.value;
    }
  }
  if (random) {
    return fixedRGBForLabel(label, !rgb);
  }
  return null;
}

function hideNotification(nid, notification) {
  if (!nid) {
    window.snackbar.hideAll();
  } else {
    notification.hide(nid);
  }
}

export class CookieUtils {
  static setCookie(name, value, exp_y, exp_m, exp_d, path, domain, secure) {
    let cookie_string = name + '=' + escape(value);
    if (exp_y) {
      let expires = new Date(exp_y, exp_m, exp_d);
      cookie_string += '; expires=' + expires.toGMTString();
    }
    if (path) {
      cookie_string += '; path=' + escape(path);
    }
    if (domain) {
      cookie_string += '; domain=' + escape(domain);
    }
    if (secure) {
      cookie_string += '; secure';
    }
    document.cookie = cookie_string;
  }

  static getCookie(cookie_name) {
    let results = document.cookie.match(
      '(^|;) ?' + cookie_name + '=([^;]*)(;|$)'
    );
    // console.log('Cookie results: ', results);
    if (results) {
      return unescape(results[2]);
    } else {
      return null;
    }
  }

  static getCookieString(name, defaultVal = '') {
    const val = CookieUtils.getCookie(name);
    // console.log(name + ' = ' + val + ' (default: ' + defaultVal + ' )');
    if (!val || val === 'undefined' || val === 'null' || val === '') {
      CookieUtils.setCookie(name, defaultVal);
      return defaultVal;
    }
    return val;
  }

  static getCookieBool(name, defaultVal = false) {
    const val = CookieUtils.getCookieString(name, defaultVal);
    return !!JSON.parse(String(val).toLowerCase());
  }

  static getCookieNumber(name, defaultVal = 0) {
    const val = CookieUtils.getCookieString(name, defaultVal);
    return Number(val);
  }
}

export {
  getRandomInt,
  randomRGB,
  randomName,
  rgbToHex,
  hexToRgb,
  getLabelColor,
  hideNotification,
};
