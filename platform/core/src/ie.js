import writeScript from './lib/writeScript';

// Check if browser is IE and add the polyfill scripts
if (navigator && /MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
  window.onload = () => {
    // Fix SVG+USE issues by calling the SVG polyfill
    writeScript('svgxuse.min.js');
  };
}
