import cornerstone from 'cornerstone-core';
import version from './version.js';

let homepage;
const { process } = window;
if (process && process.env && process.env.PUBLIC_URL) {
  homepage = process.env.PUBLIC_URL;
}

window.info = {
  version,
  homepage,
};

window.cornerstone = cornerstone;
