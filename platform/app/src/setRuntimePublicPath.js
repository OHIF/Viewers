/* global __webpack_public_path__ */

import {
  normalizePublicUrl,
  toRouterBasename,
  resolveRuntimeBasePathFromWindow,
} from '../../core/src/utils/publicUrl';

const runtimePublicUrl = resolveRuntimeBasePathFromWindow();

window.__OHIF_BASE_PATH__ = runtimePublicUrl;
window.PUBLIC_URL = runtimePublicUrl;

if (window.config && !window.config.routerBasename) {
  window.config.routerBasename = toRouterBasename(runtimePublicUrl);
}

__webpack_public_path__ = runtimePublicUrl;

export {
  normalizePublicUrl,
  toRouterBasename,
  resolveRuntimeBasePathFromWindow as resolveRuntimeBasePath,
  runtimePublicUrl,
};

export default runtimePublicUrl;
