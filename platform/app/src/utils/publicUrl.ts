const publicUrl = (window as any).PUBLIC_URL || '/';
const routerBasename = (window as any).config?.routerBasename || publicUrl;

export { publicUrl, routerBasename };

export default publicUrl;
