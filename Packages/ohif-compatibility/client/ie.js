import { $ } from 'meteor/jquery';

/* jshint -W060 */
// Check if browser is IE and add the polyfill scripts
if (navigator && /MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
    const writeScript = fileName => {
        const src = `/packages/ohif_compatibility/public/js/${fileName}`;
        document.write(`<script src="${src}"><\/script>`);
    };

    writeScript('svgxuse.min.js');
    writeScript('typedarray.js');

    window.addEventListener('click', event => {
        if (!window.SVGElementInstance || !(event.target instanceof SVGElementInstance)) return;
        $(event.target.correspondingUseElement).trigger('click');
    }, true);
}
