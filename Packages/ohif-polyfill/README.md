## ohif:polyfill

This package provides polyfills for older browsers which make them compatible with the application.

#### Creating assets

Every polyfill shall be added as an asset JS file in the Meteor package definition file (**package.js**) and its file shall be placed inside the **public/js** directory. Adding these files as assets will prevent them from being loaded on all browsers without need.
These files are exposed to the client and can be accessed through the application's **/packages/ohif_polyfill/public/js/** URI.

#### Enabling polyfills

In order to enable a polyfill for a specific browser, a JS file shall be created inside the package's **client** directory with the browser name.
We must check the current browser to include the polyfills, and to enable a polyfill we need something like this:
````js
import { absoluteUrl } from './lib/absoluteUrl';

if (navigator && /BrowserID/.test(navigator.userAgent)) {
    const src = absoluteUrl('/packages/ohif_polyfill/public/js/mypolyfill.min.js');
    document.write(`<script src="${src}"><\/script>`);
}
````
