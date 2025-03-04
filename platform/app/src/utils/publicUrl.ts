const publicUrl = (window as any).PUBLIC_URL || '/';
console.log('publicUrl', publicUrl);
export default publicUrl;
export { publicUrl };
