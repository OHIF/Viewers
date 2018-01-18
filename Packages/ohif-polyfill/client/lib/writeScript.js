/* jshint -W060 */
import absoluteUrl from './absoluteUrl';

export default function(fileName, callback) {
    const script = document.createElement('script');
    script.src = absoluteUrl(`/packages/ohif_polyfill/public/js/${fileName}`);
    script.onload = () => {
        if (typeof callback === 'function') {
            callback(script);
        }
    };

    document.body.appendChild(script);
}
