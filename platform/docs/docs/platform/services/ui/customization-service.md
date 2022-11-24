---
sidebar_position: 7
sidebar_label: Customization Service
---
# Customization Service

There are a lot of places where users may want to configure certain elements
differently between different modes or for different deployments.  A mode
example might be the use of a custom overlay showing mode related DICOM header
information such as radiation dose or patient age.

The use of this service enables these to be defined in a typed fashion by
providing an easy way to set default values for this, but to allow a
non-default value to be specified by the configuration or mode.

This service is a UI service in that part of the registration allows for registering
UI components and types to deal with, but it does not directly provide an UI
displayable elements unless customized to do so.

## Registering Customizations
There are several ways to register customizations.  The
`APP_CONFIG.customizationService`
field is used as a per-configuration entry.  This object can list single
configurations by id, or it can list sets of customizations by referring to
the `customizationModule` in an extension.  For example, the fictitious
customization 'customIcons' might be defined as below in the APP_CONFIG:

```js
window.config = {
  ...,
  customizationService: [
    {
      id: 'customIcons',
      backArrow: 'https://customIcons.org/backArrow.svg',
    },
  ],
  ...
}
```

As well, extensions can register default customizations by providing a 'default'
name key within the extension.  These are simply customizations loaded when
the extension is loaded.   For example, the previous customization could have
been added in an extension as:

```js
  getCustomizationModule: () => [
    {
      name: 'default',
      value: {
        id: 'customIcons',
        backArrow: 'https://customIcons.org/backArrow.svg',
      },
    },
  ],
```

Note the name of this is default (thus loaded automatically instead of by
reference), and the value is a customization of customIcons.

The type and parameters of a customization are defined by the user of the
customization, based on the customization id.  For example, `cornerstoneOverlay`
is a customization that is a React component, so it requires a react content,
and optionally contentProps which are used to supply values to the content.

The extension can also supply a default parent instance to inherit values from.
This allows the content or other parameters to be pre-filled, and only the
required values changed.  The parent to use is specified by the `customizationType` field,
and is simply the id of another customization object.  An example of this might
be a demographics overlay field, where the base version needs an actual component,
while the typed version just needs the attribute and label to use.

```js
   getCustomizationModule: () => [
    {
      name: 'default',
      value: [
        // This first value defines the base type
        {
          id: imageDemographicOverlay,
          content: function({image}) {
            return (<p>{image[this.attribute]}</p>);
          }
        },
        // The second one defines an instance.
        // It may or may not use the previous type definition - it will use it
        // if nothing replaces the previous definition, otherwise it will use the new one.
        {
          id: PatientIDOverlayItem,
          customizationType: 'imageDemographicOverlay',
          attribute: 'PatientID',
        },
      ]
    }
   ]
```

Mode-specific customizations are no different from the global ones,
except that the mode customizations are cleared before the mode `onModeEnter`
is called, and they can have new values registered in the `onModeEnter`

The following example shows first the registration of the default instances,
and then shows how they might be used.

```js
// In the cornerstone extension  getCustomizationModule:
const getCustomizationModule = () => ([
  {
    name: 'default',
    value: [
      {
        id: 'ohif.cornerstoneOverlay',
        content: CornerstoneOverlay,
        // Requires items on instances
       },
      {
        id: 'ohif.overlayItem',
        content: CornerstoneOverlayItem,
        // Requires attribute and label on instances
      },
    ],
  },
]);
```

Then, in the configuration file one might have a custom overlay definition:

```js
// in the APP_CONFIG file set the top right area to show the patient name
// using PN: as a prefix when the study has a non-empty patient name.
customizationService: {
  cornerstoneOverlayTopRight: {
    id: 'cornerstoneOverlayTopRight',
    customizationType: 'ohif.cornerstoneOverlay',
    items: [
      {
        id: 'PatientNameOverlay',
        // Note the ohif.overlayItem is a prototype instance for this object
        // The ohif.overlayItem is defined up above
        customizationType: 'ohif.overlayItem',
        attribute: 'PatientName',
        label: 'PN:',
      },
    ],
  },
},
```

In the mode customization, the overlay is then further customized
with a bottom-right overlay, which extends the customizationService configuration.

```js
// Import the type from the extension itself
import OverlayUICustomization from '@ohif/cornerstone-extension';


// In the mode itself, customizations can be registered:
onModeEnter() {
  ...
  // Note how the object can be strongly typed
  const bottomRight: OverlayUICustomization =     {
      id: 'cornerstoneOverlayBottomRight',
      // Note the type is the previously registered ohif.cornerstoneOverlay
      customizationType: 'ohif.cornerstoneOverlay',
      // The cornerstoneOverlay definition requires an items list here.
      items: [
        // Custom definitions for hte context menu here.
      ],
    };
  customizationService.addModeCustomizations(bottomRight);
```

## Mode Customizations
The mode customizations are retrieved via the `getModeCustomization` function,
providing an id, and optionally a default value.  The retrieval will return,
in order:

1. Global customization with the given id.
2. Mode customization with the id.
3. The default value specified.

The return value then inherits the `customizationType` instance, so that the
value can be typed and have default values and functionality provided.  The object
can then be used in a way defined by the extension provided that customization
point.

```ts
   cornerstoneOverlay = uiConfigurationService.getModeCustomization("cornerstoneOverlay", {customizationType: "ohif.cornerstoneOverlay", ...});
   const { component: overlayComponent, props} = uiConfigurationService.getComponent(cornerstoneOverlay);
   return (<defaultComponent {...props} overlay={cornerstoneOverlay}....></defaultComponent>);
```

This example shows fetching the default component to render this object.  The
returned object would be a sub-type of ohif.cornerstoneOverlay if defined.  This
object can be a React component or other object such as a commands list, for
example (this example comes from the context menu customizations as that one
uses commands lists):

```ts
   cornerstoneContextMenu = uiConfigurationService.getModeCustomization("cornerstoneContextMenu", defaultMenu);
   uiConfigurationService.recordInteraction(cornerstoneContextMenu, extraProps);
```

## Global Customizations
Global customizations are retrieved in the same was as mode customizations, except
that the `getGlobalCustomization` is called instead of the mode call.

## Types
Some types for the customization service are provided by the `@ohif/ui` types
export.  Additionally, extensions can provide a Types export with custom
typing, allowing for better typing for the extension specific capabilities.
This allows for having strong typing when declaring customizations, for example:

```ts
import { Types } from '@ohif/ui';

const customContextMenu: Types.UIContextMenu =
    {
      id: 'cornerstoneContextMenu',
      customizationType: 'ohif.contextMenu',
      // items will be type checked to be in accordance with UIContextMenu.items
      items: [ ... ]
    },
```

## Inheritance
JavaScript  property inheritance can be supplied by defining customizations
with id corresponding to the customizationType value.  For example:

```js
getCustomizationModule = () => ([
  {
    name: 'default',
    value: [
      {
        id: 'ohif.overlayItem',
        content: function (props) {
          return (<p><b>{this.label}</b> {props.instance[this.attribute]}</p>)
        },
      },
    ],
  }
])
```

defines an overlay item which has a React content object as the render value.
This can then be used by specifying a customizationType of `ohif.overlayItem`, for example:

```js
const overlayItem: Types.UIOverlayItem = {
  id: 'anOverlayItem',
  customizationType: 'ohif.overlayItem',
  attribute: 'PatientName',
  label: 'PN:',
};
```

# Customizations
This section can be used to specify various customization capabilities.


## Text color for StudyBrowser tabs
This is the recommended pattern for deep customization of class attributes,
making it fine grained, and have it apply a set of attributes, mostly from
tailwind.  In this case it is a double indirection, as the buttons class
uses it's own internal class names.

* Name: 'class:StudyBrowser'
* Attributes:
** `true` for the is active true text color
** `false` fo rhte is active false text color.
** Values are button colors, from the Button class, eg default, white, black

## customRoutes

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

> 3rd Party implementers may be added to this table via pull requests.

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[interface]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/UIModalService/index.js
[modal-provider]: https://github.com/OHIF/Viewers/blob/master/platform/ui/src/contextProviders/ModalProvider.js
[modal-consumer]: https://github.com/OHIF/Viewers/tree/master/platform/ui/src/components/ohifModal
[ux-article]: https://uxplanet.org/best-practices-for-modals-overlays-dialog-windows-c00c66cddd8c
<!-- prettier-ignore-end -->
