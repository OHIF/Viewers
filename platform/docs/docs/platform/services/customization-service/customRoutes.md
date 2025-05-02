---
sidebar_label: Custom Routes
sidebar_position: 2
title: Custom Routes
summary: Documentation for creating custom routes in OHIF, allowing extensions to define new URL paths and React components to extend the application with additional pages and navigation options.
---

# customRoutes

* Name: `routes.customRoutes`  global
* Attributes:
** `routes` of type List of route objects (see `route/index.tsx`) is a set of route objects to add.
** Should any element of routes match an existing baked in element, the baked in one will be replaced.
** `notFoundRoute` is the route to display when nothing is found (this has to be at the end of the overall list, so can't be added to routes)

### Example

Since custom routes use React, they should be defined as modules inside the extension that is providing them. And cannot be
in the AppConfig (yet).


```js
export default function getCustomizationModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'helloPage',
      value: {
        'routes.customRoutes': {
          routes: {
            $push: [
              {
                path: '/custom',
                children: () => <h1 style={{ color: 'white' }}>Hello Custom Route</h1>,
              },
            ],
          },
        },
      },
    },
  ]
```

Then after you define the module, you can add it to the customizationService in the AppConfig and reference it by the name you provided.

```js
customizationService: [
    // Shows a custom route -access via http://localhost:3000/custom
    '@ohif/extension-default.customizationModule.helloPage',
],
```

You can provide multiple custom routes in the same module, for instance another extension can also push to the routes array.

```js
export default function getCustomizationModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'secondPage',
      value: {
        customRoutes: {
          routes: {
            $push: [
              {
                path: '/second',
                children: () => <h1 style={{ color: 'white' }}>Hello Second Route</h1>,
              },
            ],
          },
        },
      },
    },
  ]
}
```

Then you can add it to the customizationService in the AppConfig and reference it by the name you provided.

```js
customizationService: [
    // Shows a custom route -access via http://localhost:3000/custom
    '@ohif/extension-default.customizationModule.helloPage',
    // Shows a custom route -access via http://localhost:3000/second
    '@ohif/extension-default.customizationModule.secondPage',
],
```
