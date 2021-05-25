# Viewer: Theming


`OHIF-v3` has introduced the [`LayoutTemplateModule`](../extensions/modules/layout-template.md) which enables addition of custom layouts. You can easily design your custom components inside an extension and consume it via the layoutTemplate module you write.




## Tailwind CSS
[Tailwind CSS](https://tailwindcss.com/) is a utility-first CSS framework for creating custom user interfaces.


Below you can see a compiled version of the tailwind configs.
Each section can be edited accordingly. For instance screen size break points, primary
and secondary colors, etc.



```js
module.exports = {
  prefix: '',
  important: false,
  separator: ':',
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    colors: {
      overlay: 'rgba(0, 0, 0, 0.8)',
      transparent: 'transparent',
      black: '#000',
      white: '#fff',
      initial: 'initial',
      inherit: 'inherit',

      indigo: {
        dark: '#0b1a42',
      },
      aqua: {
        pale: '#7bb2ce',
      },

      primary: {
        light: '#5acce6',
        main: '#0944b3',
        dark: '#090c29',
        active: '#348cfd',
      },

      secondary: {
        light: '#3a3f99',
        main: '#2b166b',
        dark: '#041c4a',
        active: '#1f1f27',
      },

      common: {
        bright: '#e1e1e1',
        light: '#a19fad',
        main: '#fff',
        dark: '#726f7e',
        active: '#2c3074',
      },

      customgreen: {
        100: '#05D97C',
      },

      customblue: {
        100: '#c4fdff',
        200: '#38daff',
      },
    },
  },
}
```


You can also use the color variable like before. For instance:


```js
primary: {
  default: ‘var(--default-color)‘,
  light: ‘#5ACCE6’,
  main: ‘#0944B3’,
  dark: ‘#090C29’,
  active: ‘#348CFD’,
}
```


## White Labeling

coming soon

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[wikipedia]: https://en.wikipedia.org/wiki/White-label_product
<!-- prettier-ignore-end -->
