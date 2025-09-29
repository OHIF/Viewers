// Playground entry: dynamically load a prototype based on URL path.
// Usage:
//  - Place a file in this folder, e.g. `playground/my-demo.tsx`
//  - Navigate to `http://localhost:3100/my-demo`
//  - Root `/` falls back to `patient-table-prototype.tsx`

const trimSlashes = (s: string) => s.replace(/^\/+|\/+$/g, '');
const route = trimSlashes(window.location.pathname);
const slug = route || 'patient-table-prototype';

// Attempt to import `<slug>.tsx` from this directory.
// Webpack will create a context for `./*.tsx` due to the dynamic import below.
// If not found, fall back to the default prototype.
(async () => {
  try {
    await import(
      /* webpackMode: "lazy-once" */
      /* webpackInclude: /\.tsx$/ */
      `./${slug}.tsx`
    );
  } catch (err) {
    console.warn(`Prototype "${slug}" not found. Falling back to default.`, err);
    await import('./patient-table-prototype');
  }
})();
