---
sidebar_position: 2
sidebar_label: Theming
---

# Viewer: Theming

`OHIF-v3` has introduced the
[`LayoutTemplateModule`](./extensions/modules/layout-template.md) which enables
addition of custom layouts. You can easily design your custom components inside
an extension and consume it via the layoutTemplate module you write.

## Tailwind CSS

[Tailwind CSS](https://tailwindcss.com/) is a utility-first CSS framework for
creating custom user interfaces.

Below you can see a compiled version of the tailwind configs. Each section can
be edited accordingly. For instance screen size break points, primary and
secondary colors, etc.

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
        dark: '#2a2a2a',
      },
      aqua: {
        pale: '#8c8c8c',
      },

      primary: {
        light: '#8c8c8c',
        main: '#2a2a2a',
        dark: '#1a1a1a',
        active: '#999999',
      },

      secondary: {
        light: '#666666',
        main: '#4d4d4d',
        dark: '#1a1a1a',
        active: '#333333',
      },

      common: {
        bright: '#e1e1e1',
        light: '#8c8c8c',
        main: '#fff',
        dark: '#7f7f7f',
        active: '#4d4d4d',
      },

      customgreen: {
        100: '#7f7f7f',
      },

      customblue: {
        100: '#bfbfbf',
        200: '#8c8c8c',
      },
    },
  },
};
```

You can also use the color variable like before. For instance:

```js
primary: {
  default: ‘var(--default-color)‘,
  light: ‘#8c8c8c’,
  main: ‘#2a2a2a’,
  dark: ‘#1a1a1a’,
  active: ‘#7f7f7f’,
}
```

## White Labeling

A white-label product is a product or service produced by one company (the
producer) that other companies (the marketers) rebrand to make it appear as if
they had made it -
[Wikipedia: White-Label Product](https://en.wikipedia.org/wiki/White-label_product)

Current white-labeling options are limited. We expose the ability to replace the
"Logo" section of the application with a custom "Logo" component. You can do
this by adding a whiteLabeling key to your configuration file.

```js
window.config = {
  /** .. **/
  whiteLabeling: {
    createLogoComponentFn: function(React) {
      return React.createElement(
        'a',
        {
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'text-white underline',
          href: 'http://radicalimaging.com',
        },
        React.createElement('h5', {}, 'RADICAL IMAGING')
      );
    },
  },
  /** .. **/
};
```

> You can simply use the stylings from tailwind CSS in the whiteLabeling

In addition to text, you can also add your custom logo

```js
window.config = {
  /** .. **/
  whiteLabeling: {
    createLogoComponentFn: function(React) {
      return React.createElement(
        'a',
        {
          target: '_self',
          rel: 'noopener noreferrer',
          className: 'text-purple-600 line-through',
          href: '/',
        },
        React.createElement('img', {
          src: './customLogo.svg',
          // className: 'w-8 h-8',
        })
      );
    },
  },
  /** .. **/
};
```

The output will look like

![custom-logo](../assets/img/custom-logo.png)

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[wikipedia]: https://en.wikipedia.org/wiki/White-label_product
<!-- prettier-ignore-end -->
