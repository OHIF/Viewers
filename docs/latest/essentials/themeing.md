# Themeing

Themeing is currently accomplished with color variables that are defined within
the [`:root`](https://css-tricks.com/almanac/selectors/r/root/) selector
(allowing them to cascade across all elements). This repository's components,
and the ones we consume from our
[React Viewerbase component library](https://react.ohif.org/styling-and-theming)
utilize them. We are interested in pursuing more robust themeing options, and
open to pull requests and discussion issues.

```css
:root {
  /* Interface UI Colors */
  --default-color: #9ccef9;
  --hover-color: #ffffff;
  --active-color: #20a5d6;
  --ui-border-color: #44626f;
  --ui-border-color-dark: #3c5d80;
  --ui-border-color-active: #00a4d9;
  --primary-background-color: #000000;
  --box-background-color: #3e5975;

  --text-primary-color: #ffffff;
  --text-secondary-color: #91b9cd;
  --input-background-color: #2c363f;
  --input-placeholder-color: #d3d3d3;

  --table-hover-color: #2c363f;
  --table-text-primary-color: #ffffff;
  --table-text-secondary-color: #91b9cd;

  --large-numbers-color: #6fbde2;

  --state-error: #ffcccc;
  --state-error-border: #ffcccc;
  --state-error-text: #ffcccc;

  /* Common palette */
  --ui-yellow: #e29e4a;
  --ui-sky-blue: #6fbde2;

  /* State palette */
  --ui-state-error: #ffcccc;
  --ui-state-error-border: #993333;
  --ui-state-error-text: #661111;
  --ui-gray-lighter: #436270;
  --ui-gray-light: #516873;
  --ui-gray: #263340;
  --ui-gray-dark: #16202b;
  --ui-gray-darker: #151a1f;
  --ui-gray-darkest: #14202a;

  --calendar-day-color: #d3d3d3;
  --calendar-day-border-color: #d3d3d3;
  --calendar-day-active-hover-background-color: #516873;
  --calendar-main-color: #263340;
  --viewport-border-thickness: 1px;
}
```
