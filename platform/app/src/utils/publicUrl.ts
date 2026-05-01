import { normalizePublicUrl, toRouterBasename } from '../../../core/src/utils/publicUrl';

const publicUrl = normalizePublicUrl(
  (window as any).__OHIF_BASE_PATH__ || (window as any).PUBLIC_URL || '/'
);
const routerBasename = toRouterBasename((window as any).config?.routerBasename || publicUrl);

export { publicUrl, routerBasename };

export default publicUrl;
