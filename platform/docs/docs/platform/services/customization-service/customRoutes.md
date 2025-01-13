---
sidebar_label: Custom Routes
sidebar_position: 2
---

# customRoutes

* Name: `customRoutes`  global
* Attributes:
** `routes` of type List of route objects (see `route/index.tsx`) is a set of route objects to add.
** Should any element of routes match an existing baked in element, the baked in one will be replaced.
** `notFoundRoute` is the route to display when nothing is found (this has to be at the end of the overall list, so can't be added to routes)

### Example

```js
{
  id: 'customRoutes',
  routes: [
    {
      path: '/myroute',
      children: MyRouteReactFunction,
    }
  ],
}
```

There is a usage of this example commented out in config/default.js that
looks like the code below.  This example is provided by the default extension,
again with commented out code.  Uncomment the getCustomizationModule customRoutes
code in the default module to activate this, and then go to: `http://localhost:3000/custom`
to see the custom route.

Note the name of this is the customization module name, which usually won't match
the id, and in fact there can be multiple customization objects defined for a single
customization module, to allow for customizing sets of related values.

```js
customizationService: [
    // Shows a custom route -access via http://localhost:3000/custom
    '@ohif/extension-default.customizationModule.helloPage',
],
```
