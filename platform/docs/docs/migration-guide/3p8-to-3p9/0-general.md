---
id: 0-general
title: General
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# React 18 Migration Guide
As we upgrade to React 18, we're making some exciting changes to improve performance and developer experience. This guide will help you navigate the key updates and ensure your custom extensions and modes are compatible with the new version.
What's Changing?

<Tabs>
  <TabItem value="Before" label="Before" default>

```md
- React 17
- Using `defaultProps`
- `babel-inline-svg` for SVG imports
```

  </TabItem>
  <TabItem value="After" label="After">

```md
- React 18
- Default parameters for props
- `svgr` for SVG imports
```

  </TabItem>
</Tabs>


## Update React version:
In your custom extensions and modes, change the version of react and react-dom to ^18.3.1.

## Replace defaultProps with default parameters:

<Tabs>
  <TabItem value="Before" label="Before" default>

```jsx
const MyComponent = ({ prop1, prop2 }) => {
  return <div>{prop1} {prop2}</div>
}

MyComponent.defaultProps = {
  prop1: 'default value',
  prop2: 'default value'
}
```

  </TabItem>
  <TabItem value="After" label="After">

```jsx
const MyComponent = ({ prop1 = 'default value', prop2 = 'default value' }) => {
  return <div>{prop1} {prop2}</div>
}
```
  </TabItem>
</Tabs>

## Update SVG imports:

You might need to update your SVG imports to use the `ReactComponent` syntax, if you want to use the old Icon component. However, we have made a significant change to how we handle Icons, read the UI Migration Guide for more information.

<Tabs>
  <TabItem value="Before" label="Before" default>

```javascript
import arrowDown from './../../assets/icons/arrow-down.svg';
```

  </TabItem>
  <TabItem value="After" label="After">

```javascript
import { ReactComponent as arrowDown } from './../../assets/icons/arrow-down.svg';
```

  </TabItem>
</Tabs>

---

## Polyfill.io

We have removed the Polyfill.io script from the Viewer. If you require polyfills, you can add them to your project manually. This change primarily affects Internet Explorer, which Microsoft has already [ended support for](https://learn.microsoft.com/en-us/lifecycle/faq/internet-explorer-microsoft-edge#is-internet-explorer-11-the-last-version-of-internet-explorer-).



---

## Crosshairs

They now have new colors in their associated viewports in the MPR view. However, you can turn this feature off.

To disable it, remove the configuration from the `initToolGroups` in your mode.

```
{
  configuration: {
    viewportIndicators: true,
    viewportIndicatorsConfig: {
      circleRadius: 5,
      xOffset: 0.95,
      yOffset: 0.05,
    },
  }
}
```
