/* jshint -W060 */
import absoluteUrl from './absoluteUrl';

export default function(fileName) {
    const src = absoluteUrl(`/packages/ohif_polyfill/public/js/${fileName}`);
    document.write(`<script src="${src}"><\/script>`);
}
