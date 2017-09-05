import writeScript from './lib/writeScript';

// Check if browser is IE and add the polyfill scripts
if (navigator && /MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
    writeScript('typedarray.min.js');
}
