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

<b>Note:</b> Customization Service itself doesn't implement the actual customization,
but rather just provide mechanism to register reusable prototypes, to configure
those prototypes with actual configurations, and to use the configured objects
(components, data, whatever).
Actual implementation of the customization is totally up to the component that
supports customization. (for example, `CustomizableViewportOverlay` component uses
`CustomizationService` to implement viewport overlay that is easily customizable
from configuration.)

## Registering customizable modules (or defining customization prototypes)

Extensions and Modes can register customization templates they support.
It is done by adding `getCustomizationModule()` in the extension or mode definition.

Below is the protocol of the `getCustomizationModule()`, if defined in Typescript.

```typescript
  getCustomizationModule() : { name: string, value: any }[]
```

If the name is 'default', it is the Default customization, which is loaded
automatically when the extension or mode is loaded.

In the `value` of each customizations, you will define customization prototype(s).
These customization prototype(s) can be considered like "Prototype" in Javascript.
These can be used to extend the customization definitions from configurations.
Default customizations will be often used to define all the customization prototypes,
Default customizations will be often used to define all the customization prototypes,
as they will be loaded automatically along with the defining extension or mode.


For example, the `@ohif/extension-default` extension defines,

```js
  getCustomizationModule: () => [
    //...

    {
      name: 'default',
      value: [
        {
          id: 'ohif.overlayItem',
          content: function (props) {
            if (this.condition && !this.condition(props)) return null;

            const { instance } = props;
            const value =
              instance && this.attribute
                ? instance[this.attribute]
                : this.contentF && typeof this.contentF === 'function'
                ? this.contentF(props)
                : null;
            if (!value) return null;

            return (
              <span
                className="overlay-item flex flex-row"
                style={{ color: this.color || undefined }}
                title={this.title || ''}
              >
                {this.label && (
                  <span className="mr-1 shrink-0">{this.label}</span>
                )}
                <span className="font-light">{value}</span>
              </span>
            );
          },
        },
      ],
    },

    //...
  ],
```

And this `ohif.overlayItem` object will be used as a prototype (and template) to define items
to be displayed on `CustomizableViewportOverlay`. See how we use the `ohif.overlayItem` in
the example below.

## Configuring customizations

There are several ways to register customizations.  The
`APP_CONFIG.customizationService`
field is used as a per-configuration entry.  This object can list single
configurations by id, or it can list sets of customizations by referring to
the `customizationModule` in an extension.

NOTE that these definitions from APP_CONFIG will be loaded by default, just like
extension/modes default customization.

Below is the example configuration for `CustomizableViewportOverlay` component
customization, using the customization prototype `ohif.overlayItem` defined in
`ohif/extension-defaul` extension.:

```js
window.config = {
  //...

  // in the APP_CONFIG file set the top right area to show the patient name
  // using PN: as a prefix when the study has a non-empty patient name.
  customizationService: {
    cornerstoneOverlayTopRight: {
      id: 'cornerstoneOverlayTopRight',
      items: [
        {
          id: 'PatientNameOverlay',
          // Note below that here we are using the customization prototype of
          // `ohif.overlayItem` which was registered to the customization module in
          // `ohif/extension-default` extension.
          customizationType: 'ohif.overlayItem',
          // the following props are passed to the `ohif.overlayItem` prototype
          // which is used to render the overlay item based on the label, color,
          // conditions, etc.
          attribute: 'PatientName',
          label: 'PN:',
          title: 'Patient Name',
          color: 'yellow',
          condition: ({ instance }) =>
            instance &&
            instance.PatientName &&
            instance.PatientName.Alphabetic,
          contentF: ({ instance, formatters: { formatPN } }) =>
            formatPN(instance.PatientName.Alphabetic) +
            ' ' +
            (instance.PatientSex ? '(' + instance.PatientSex + ')' : ''),
        },
      ],
    },
  },

  //...
}
```

In the customization configuration, you can use `customizationType` fields to
define the prototype that customization object should inherit from.
The `customizationType` field is simply the id of another customization object.


## Implementing customization using CustomizationService

### Mode Customizations

Mode-specific customizations are no different from the global ones,
except that the mode customizations are specific to one mode and
are not globally applied. Mode-specific customizations are also cleared
before the mode `onModeEnter` is called, and they can have new values registered in the `onModeEnter`

Following on our example above to customize the overlay, we can now add a mode customization
with a bottom-right overlay.

```js
// Import the type from the extension itself
import OverlayUICustomization from "@ohif/cornerstone-extension";

// In the mode itself, customizations can be registered:
onModeEnter: {
  // Note how the object can be strongly typed
  const bottomRight: OverlayUICustomization =     {
      id: 'cornerstoneOverlayBottomRight',
      // Note the type is the previously registered ohif.cornerstoneOverlay
      customizationType: 'ohif.cornerstoneOverlay',
      // The cornerstoneOverlay definition requires an items list here.
      items: [
        // Custom definitions for the context menu here.
      ],
    };
  customizationService.addModeCustomizations(bottomRight);
}
```

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
const cornerstoneOverlay = customizationService.getModeCustomization(
  "cornerstoneOverlay",
  { customizationType: "ohif.cornerstoneOverlay" },
);

const { component: overlayComponent, props } =
  customizationService.getComponent(cornerstoneOverlay);

return (
  <defaultComponent {...props} overlay={cornerstoneOverlay}></defaultComponent>
);
```

This example shows fetching the default component to render this object.  The
returned object would be a sub-type of ohif.cornerstoneOverlay if defined.  This
object can be a React component or other object such as a commands list, for
example (this example comes from the context menu customizations as that one
uses commands lists):

```ts
cornerstoneContextMenu = customizationService.get(
  "cornerstoneContextMenu",
  defaultMenu,
);
commandsManager.run(cornerstoneContextMenu, extraProps);
```

### Global Customizations

Global customizations are retrieved in the same was as mode customizations, except
that the `getGlobalCustomization` is called instead of the mode call.

### Types

Some types for the customization service are provided by the `@ohif/ui` types
export.  Additionally, extensions can provide a Types export with custom
typing, allowing for better typing for the extension specific capabilities.
This allows for having strong typing when declaring customizations, for example:

```ts
import { Types } from '@ohif/ui';

const customContextMenu: Types.ContextMenu.Menu =
    {
      id: 'cornerstoneContextMenu',
      customizationType: 'ohif.contextMenu',
      // items will be type checked to be in accordance with UIContextMenu.items
      items: [ ... ]
    },
```

### Inheritance

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
This can then be used by specifying a `customizationType` of `ohif.overlayItem`, for example:

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
** `false` for the is active false text color.
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

## Customizable Viewport Overlay

Below is the full example configuration of the customizable viewport overlay and the screenshot of the result overlay.

```javascript
// this is one of the configuration files in `platform/app/public/config/*.js`
window.config = {
  // ...

  customizationService: {
    cornerstoneOverlayTopLeft: {
      id: 'cornerstoneOverlayTopLeft',
      items: [
        {
          id: 'WindowLevel',
          customizationType: 'ohif.overlayItem.windowLevel',
        },
        {
          id: 'PatientName',
          customizationType: 'ohif.overlayItem',
          label: '',
          color: 'green',
          background: 'white',
          condition: ({ instance }) =>
            instance && instance.PatientName && instance.PatientName.Alphabetic,
          contentF: ({ instance, formatters: { formatPN } }) =>
            formatPN(instance.PatientName.Alphabetic) +
            ' ' +
            (instance.PatientSex ? '(' + instance.PatientSex + ')' : ''),
        },
        {
          id: 'Species',
          customizationType: 'ohif.overlayItem',
          label: 'Species:',
          condition: ({ instance }) =>
            instance && instance.PatientSpeciesDescription,
          contentF: ({ instance }) =>
            instance.PatientSpeciesDescription +
            '/' +
            instance.PatientBreedDescription,
        },
        {
          id: 'PID',
          customizationType: 'ohif.overlayItem',
          label: 'PID:',
          title: 'Patient PID',
          condition: ({ instance }) => instance && instance.PatientID,
          contentF: ({ instance }) => instance.PatientID,
        },
        {
          id: 'PatientBirthDate',
          customizationType: 'ohif.overlayItem',
          label: 'DOB:',
          title: "Patient's Date of birth",
          condition: ({ instance }) => instance && instance.PatientBirthDate,
          contentF: ({ instance }) => instance.PatientBirthDate,
        },
        {
          id: 'OtherPid',
          customizationType: 'ohif.overlayItem',
          label: 'Other PID:',
          title: 'Other Patient IDs',
          condition: ({ instance }) => instance && instance.OtherPatientIDs,
          contentF: ({ instance, formatters: { formatPN } }) =>
            formatPN(instance.OtherPatientIDs),
        },
      ],
    },
    cornerstoneOverlayTopRight: {
      id: 'cornerstoneOverlayTopRight',

      items: [
        {
          id: 'InstanceNmber',
          customizationType: 'ohif.overlayItem.instanceNumber',
        },
        {
          id: 'StudyDescription',
          customizationType: 'ohif.overlayItem',
          label: '',
          title: ({ instance }) =>
            instance &&
            instance.StudyDescription &&
            `Study Description: ${instance.StudyDescription}`,
          condition: ({ instance }) => instance && instance.StudyDescription,
          contentF: ({ instance }) => instance.StudyDescription,
        },
        {
          id: 'StudyDate',
          customizationType: 'ohif.overlayItem',
          label: '',
          title: 'Study date',
          condition: ({ instance }) => instance && instance.StudyDate,
          contentF: ({ instance, formatters: { formatDate } }) =>
            formatDate(instance.StudyDate),
        },
        {
          id: 'StudyTime',
          customizationType: 'ohif.overlayItem',
          label: '',
          title: 'Study time',
          condition: ({ instance }) => instance && instance.StudyTime,
          contentF: ({ instance, formatters: { formatTime } }) =>
            formatTime(instance.StudyTime),
        },
      ],
    },
    cornerstoneOverlayBottomLeft: {
      id: 'cornerstoneOverlayBottomLeft',

      items: [
        {
          id: 'SeriesNumber',
          customizationType: 'ohif.overlayItem',
          label: 'Ser:',
          title: 'Series Number',
          condition: ({ instance }) => instance && instance.SeriesNumber,
          contentF: ({ instance }) => instance.SeriesNumber,
        },
        {
          id: 'SliceLocation',
          customizationType: 'ohif.overlayItem',
          label: 'Loc:',
          title: 'Slice Location',
          condition: ({ instance }) => instance && instance.SliceLocation,
          contentF: ({ instance, formatters: { formatNumberPrecision } }) =>
            formatNumberPrecision(instance.SliceLocation, 2) + ' mm',
        },
        {
          id: 'SliceThickness',
          customizationType: 'ohif.overlayItem',
          label: 'Thick:',
          title: 'Slice Thickness',
          condition: ({ instance }) => instance && instance.SliceThickness,
          contentF: ({ instance, formatters: { formatNumberPrecision } }) =>
            formatNumberPrecision(instance.SliceThickness, 2) + ' mm',
        },
      ],
    },
  },

  // ...
}
```

<img src="../../../assets/img/customizable-overlay.png" />

## Context Menus

Context menus can be created by defining the menu structure and click
interaction, as defined in the `ContextMenu/types`.  There are examples
below specific to the cornerstone context, because the actual click
handler and attributes used to decide when and how to display the menu
are specific to the context used for where the menu is displayed.

##  Cornerstone Context Menu

The default cornerstone context menu can be customized by setting the
`cornerstoneContextMenu`.  For a full example, see `findingsContextMenu`.

## Customizable Cornerstone Viewport Click Behaviour

The behaviour on clicking on the cornerstone viewport can be customized
by setting the `cornerstoneViewportClickCommands`.  This is intended to
support both the cornerstone 3D internal commands as well as things like
context menus.  Currently it supports buttons 1-3, as well as modifier keys
by associating a commands list with the button to click.  See `initContextMenu`
for more details.

## Please add additional customizations above this section
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
