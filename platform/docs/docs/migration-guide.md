---
sidebar_position: 10
sidebar_label: Migration Guide
---

# Migration Guide

On this page, we will provide a guide to migrating from OHIF v2 to v3. Please note
that this document is a work in progress and will be updated as we move forward.


## Summary of Changes

OHIF v3 is a complete re-architecture of the OHIF v2 to make it more modular and
easier to maintain. The main differences are:

- Extensions don't inject their modules into the viewer, they will make them available
  to be used by the viewer.
- To use the modules provided by the extensions, you need to write a [Modes](./platform/modes/index.md). Modes
are configuration objects that will be used by the viewer to load the modules.
- App configuration structure is different, mainly the `servers` is renamed to `dataSources`.
- The viewer UI is completely re-written in tailwindcss for better maintainability.
- cornerstone-core and cornerstone-tools are deprecated and OHIF v3 is using the new Cornerstone3D rendering library and tools
- A new CLI tool to help you create extensions and modes.

New significant additions that might be useful for you that weren't available in OHIF v2:
- [OHIF CLI](./development/ohif-cli.md)
- [New Rendering Engine and Toolings](https://www.cornerstonejs.org/)
- [Modes](./platform/modes/index.md)
- [Mode Gallery](https://ohif.org/modes)
- [Layouts](./platform/extensions/modules/layout-template.md)
- [Data Sources](./platform/extensions/modules/data-source.md)
- [Hanging Protocols](./platform/services/data/HangingProtocolService.md)
- [URL Params](./configuration/url.md)


## Configuration

OHIF v3 has a new configuration structure. The main difference is that the `servers` is renamed to `dataSources`
and the configuration is now asynchronous.

- `StudyPrefetcher` is not currently supported in OHIF v3.
- The `servers` object has been replaced with a `dataSources` array containing objects representing different data sources.
- The cornerstoneExtensionConfig property has been removed, you should use `customizationService` instead.
- The maxConcurrentMetadataRequests property has been removed in favor of `maxNumRequests`
- The hotkeys array has been updated with different command names and options, and some keys have been removed.
- New properties have been added, including `maxNumberOfWebWorkers`, `omitQuotationForMultipartRequest`, `showWarningMessageForCrossOrigin`, `showCPUFallbackMessage`, `showLoadingIndicator`, `strictZSpacingForVolumeViewport`.

## Modes

As mentioned briefly above, modes are configuration objects that will be used by the viewer to load extensions.
This lets users to be able to use common extensions with different configurations. So as OHIF developers can focus on creating extensions while
you as the user can focus on creating modes having your own use case and configuration/initialization logic in mind.

Separating the configuration from the extensions also makes it so that you can
have multiple modes in a single application each focusing on certain tasks. For example, you can have a mode for segmentation which uses specific panels and tools which you don't need
for a mode that will be used for reading.

Upon entering a mode, the Viewer will register its declared extensions and load them. And you
can specify which modules you need from each extension in the mode configuration. For instance

```js

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  measurements: '@ohif/extension-default.panelModule.measure',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

const cs3d = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const tmtv = {
  hangingProtocol: '@ohif/extension-tmtv.hangingProtocolModule.ptCT',
  petSUV: '@ohif/extension-tmtv.panelModule.petSUV',
  ROIThresholdPanel: '@ohif/extension-tmtv.panelModule.ROIThresholdSeg',
};

function modeFactory({ modeConfiguration }) {
  routes: [
    {
      path: 'tmtv',
      layoutTemplate: ({ location, servicesManager }) => {
        return {
          id: ohif.layout,
          props: {
            // leftPanels: [ohif.thumbnailList],
            rightPanels: [tmtv.ROIThresholdPanel, tmtv.petSUV],
            viewports: [
              {
                namespace: cs3d.viewport,
                displaySetsToDisplay: [ohif.sopClassHandler],
              },
            ],
          },
        };
      },
    },
  ],
}
```

In the example above, we are using the `tmtv` mode which is a mode for reading PET/CT scans
and as you can see we are specifying the layout, the panels and the viewports that we need
for this mode. The `tmtv` mode is using the `cs3d` extension for rendering and the `ohif` extension. As you see you can reference the modules from the extensions using the `namespace` via strings. So for instance, if you need to use the `viewportModule` from the `cornerstone` extension you can use `@ohif/extension-cornerstone.viewportModule.cornerstone` as the namespace.

## Routes

In OHIF v2 a study was loaded and mounted on `/viewer/:studyInstanceUID` route. In OHIF v3
we have reworked the route registration to enable more sophisticated routing. Now, Modes are tied to specific routes in the viewer, and multiple modes/routes can be present within a single application, making "routes" configuration the most important part of mode configuration.

- Routes with a dataSourceName: ${mode.id}/${dataSourceName}
- Routes without a dataSourceName: ${mode.id} which uses the default dataSourceName

This makes a mode flexible enough to be able to connect to multiple datasources
without rebuild of the app for use cases such as reading from one PACS and
writing to another.

## LifeCycle Hooks

OHIF v2 had `preRegistration` hook for extensions for initialization. In OHIF v3 you have
even more control using `onModeEnter` and `onModeExit` hooks on the extensions and on the modes.

## Extensions

Since extensions in OHIF v2 were the main way of customizing the viewer, we will spend some time
below to explain how you can migrate your extensions to OHIF v3.

### Default Extension

Lots of common functionalities in the platform/core has been moved inside
the `@ohif/extension-default` extension. This extension is loaded by default
in the viewer and it provides the following functionalities:

- common datasources such as DICOMWeb, DICOMLocal, and DICOMJSON datasource.
- default measurement panel and panel study browser
- common toolbar button layouts
- common hanging protocol configurations

### Cornerstone Extension

In OHIF v2, the Cornerstone extension provided modules like Cornerstone ViewportModule, ToolbarModule, and CommandsModule for controlling viewport actions.
It relied on `react-cornerstone-viewport` for rendering viewports, `cornerstone-tools` for tools, and `cornerstone-core` for core functionalities.

However, in OHIF v3, there have been significant changes. The rendering and tooling logic has been migrated to a new library called [`Cornerstone3D`](https://github.com/cornerstonejs/cornerstone3D-beta/). This means that all viewport rendering and tool functionalities are now handled by Cornerstone3D.

Additionally, in OHIF v3, the native support for 3D functionalities previously provided by the `vtk` extension has been integrated into Cornerstone3D. As a result, there is no longer a need to use the vtk extension.

To migrate from OHIF v2 to OHIF v3:

- Update your code to use Cornerstone3D for viewport rendering and tools. If you don't have any custom tools or commands, you most likely won't need to make any changes.
- If you have custom tools in `cornerstone-tools`, you will need to migrate them to Cornerstone3D. We have migrated various tools from `cornerstone-tools` to Cornerstone3D and you can
use them as a reference (the main difference for tools are that now all toolData are stored in the world coordinate system).
- Remove any dependencies on `react-cornerstone-viewport`, `cornerstone-tools`, and `cornerstone-core`.
- Replace any usages of 3D functionalities from the vtk extension with the native 3D support provided by Cornerstone3D using its `VolumeViewport` component.

By following these steps, you can leverage the improved rendering and tooling capabilities of Cornerstone3D and eliminate the need for the vtk extension in OHIF v3.

### DICOM Segmentation & DICOM RT

In OHIF v3, the equivalent extensions for RT and SEG exists with similar logic, but with various bug fixes and improvements.
Additionally, OHIF v3 introduces new functionalities with the SEG Viewport and RT Viewport.

When loading a series that contains SEG (Segmentation) or RT (RT Structure Set) data, the viewport will automatically
switch to the corresponding SEG or RT viewport. The user will then be prompted to decide whether to load the segmentation
or RT structure set into the viewer. This new feature addresses a common use case in which there are multiple segmentation
series in a study, and the user only wants to load specific ones. In OHIF v3, the Segmentations are all loaded
as 3D volumes and as a result a volume viewport is used to display them. (Stack Segmentation in Cornerstone3D is still a
work in progress.)

In OHIF v2, the user had to load all the segmentation series and then manually delete the ones they didn't want to see.
However, in OHIF v3, the user has more control. The temporary SEG or RT viewport does not immediately load (hydrate)
the segmentation or RT structure set. Instead, the user can decide which ones to load, reducing unnecessary
loading and providing a more efficient workflow.

This enhancement in OHIF v3 allows users to selectively load specific segmentations or RT structure sets,
improving the usability and efficiency of the viewer when working with multiple SEG or RT series.

### DICOM SR

In OHIF v2, DICOM SR functionality was integrated into the Cornerstone extension. However, in OHIF v3, DICOM SR is now a separate extension. The DICOM SR extension in OHIF v3 retains the same loading and hydrating logic using dcmjs adapters. Additionally, it introduces a new type of viewport called the SR Viewport, which is used to display SR data.

Similar to the temporary SEG and RT viewports, when a SR display set is selected in OHIF v3, the user is prompted to decide whether to load the SR data into the viewer and initiate the tracking. The SR viewport allows the user to switch between different measurements within the SR instance by utilizing the arrow buttons located at the top of the viewport.

This separation of DICOM SR into its own extension in OHIF v3 provides a dedicated viewport type for SR data and offers enhanced functionality for interacting with SR measurements within the viewer.


### DICOM Tag Browser

In OHIF v2, the DICOM Tag Browser was a separate extension that provided a dedicated user interface for exploring DICOM tags. However, in OHIF v3, we have integrated the DICOM Tag Browser functionality into the `default` extension.

The DICOM Tag Browser is a powerful tool for debugging and inspecting DICOM metadata, and we wanted to make it easily accessible to users. As a result, it is now available as a toolbar icon within the `default` extension. This allows users to conveniently access the DICOM Tag Browser directly from the toolbar, eliminating the need for a separate extension.


### DICOM HTML

Since we have added graphical overlay of DICOM SR in OHIF v3, we have temporarily downgraded the priority of displaying DICOM HTML within the viewer. While DICOM HTML support is not available in the current version of OHIF v3, we acknowledge its importance and plan to reintroduce this functionality in future updates.

### DICOM Microscopy

In OHIF v2, the DICOM microscopy engine was based on an older version of the [DICOM microscopy viewer](https://github.com/ImagingDataCommons/dicom-microscopy-viewer) maintained by our friends at IDC (Imaging Data Commons). However, in OHIF v3, we have upgraded to the latest version of the DICOM microscopy viewer. This new version offers significant improvements in terms of robustness and performance, providing users with an enhanced microscopy viewing experience.

One notable addition in the latest DICOM microscopy viewer is the support for annotations within the whole slide images (SM images). This feature allows users to annotate and mark specific regions of interest directly within the microscopy images.

Looking ahead, our future plans include adding DICOM SR (Structured Reporting) support for export of annotations in microscopy images. While we will enhance our support for SM images (color profiles etc.), we recommend utilizing the [SLIM Viewer](https://github.com/ImagingDataCommons/slim) developed by IDC for more sophisticated microscopy use cases.



## Extension Modules


The way you write extensions is the same as before. Extensions can (like before) have
modules exported via `get{ModuleName}Module` (e.g., `getViewportModule`). There are new
types of modules that can be exported from extensions.

In OHIF v2, exported modules were represented as a single object, whereas in OHIF v3, they are
represented as an array of objects, each having a name property. This change was implemented to
enable extensions to export multiple named submodules, providing more flexibility and modularity.

To access these modules in OHIF v3, you can use the namespace provided by the `ExtensionManager`. For example, consider the following code snippet


```js
getUtilityModule({ servicesManager }) {
  return [
    {
      name: 'common',
      exports: {
        getCornerstoneLibraries: () => {
          return { cornerstone, cornerstoneTools };
        },
        getEnabledElement,
        dicomLoaderService,
        registerColormap,
      },
    },
    {
      name: 'core',
      exports: {
        Enums: cs3DEnums,
      },
    },
    {
      name: 'tools',
      exports: {
        toolNames,
        Enums: cs3DToolsEnums,
      },
    },
  ];
},
```


In this example, the extension is exporting multiple submodules named 'common',
'core', and 'tools'. To access the 'common' submodule provided by the @ohif/extension-cornerstone extension,
you can use the following code:

```js
extensionManager.getModuleEntry(
  '@ohif/extension-cornerstone.utilityModule.common'
);
```

This allows you to access the specific submodule provided by the extension and utilize its functionalities within your application.



### ToolbarModule

In OHIF v2, the toolbarModule was used to add buttons to the toolbar. For example, the following code snippet demonstrates adding a zoom tool button to the toolbar:


```js
{
    id: 'Zoom',
    label: 'Zoom',
    icon: 'search-plus',
    //
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'setToolActive',
    commandOptions: { toolName: 'Zoom' },
},
```

However, in OHIF v3, the toolbarModule has been repurposed to define different button types. For instance, OHIF v3 introduces the ohif.radioGroup and ohif.splitButton button types, which provide more flexibility in defining toolbar buttons for each mode.

To use these button types within your modes, you can define the buttons in your mode's configuration. For example:


```js
{
  name: 'ohif.radioGroup',
  defaultComponent: ToolbarButton,
  clickHandler: () => {},
},
{
  name: 'ohif.splitButton',
  defaultComponent: ToolbarSplitButton,
  clickHandler: () => {},
},
```

In the onModeEnter hook, you can add the defined buttons to the toolbar using the toolbarService. Here's an example of how to add buttons to the toolbar:



```js
// toolbar button
{
  id: 'Zoom',
  type: 'ohif.radioGroup',
  props: {
    type: 'tool',
    icon: 'tool-zoom',
    label: 'Zoom',
    commands: _createSetToolActiveCommands('Zoom'),
  },
},
```

and in `onModeEnter`

```js
onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
  const {
    toolbarService,
    toolGroupService,
  } = servicesManager.services;

  // Init tool groups (see cornerstone3D for more details)
  initToolGroups(extensionManager, toolGroupService, commandsManager);

  toolbarService.init(extensionManager);
  toolbarService.addButtons(toolbarButtons);
  toolbarService.createButtonSection('primary', [
    'MeasurementTools',
    'Zoom',
    'WindowLevel',
    'Pan',
    'Capture',
    'Layout',
    'MPR',
    'Crosshairs',
    'MoreTools',
  ]);
},
```

By using the updated toolbarModule in OHIF v3, you can define and add toolbar buttons specific to each mode, providing greater flexibility and customization options for the toolbar configuration.



### CommandsModule

The structure of the commands module is the same as before. The only difference is that
we use Cornerstone3D for rendering and tools. So, if you have a custom command that you were
using in the v2, you need to migrate it to the new Cornerstone3D API.

You can visit the migration guide for cornerstone  [here](https://www.cornerstonejs.org/docs/migrationGuides).

### PanelModule

Previously in OHIF v2 you had

```js
return {
  menuOptions: [
    {
      icon: 'list',
      label: 'Segmentations',
      target: 'segmentation-panel',
      stateEvent: SegmentationPanelTabUpdatedEvent,
    },
  ],
  components: [
    {
      id: 'segmentation-panel',
      component: ExtendedSegmentationPanel,
    },
  ],
  defaultContext: ['VIEWER'],
};
```

but in OHIF v3 you have

```js
return [
  {
    name: 'panelSegmentation',
    iconName: 'tab-segmentation',
    iconLabel: 'Segmentation',
    label: 'Segmentation',
    component: wrappedPanelSegmentation,
  },
];
```

### SopClassHandlerModule

By far the least changed module is the SopClassHandlerModules. The purpose of this
module is to create a displaySet based on the metadata.


### ViewportModule

In OHIF v3, viewports are tied to series of SOP Class UIDs (sopClassUIDs). Each extension provides its own viewport for specific SOP Class UIDs, and you can choose which viewports and SOP Class UIDs your mode can handle in the mode configuration.

For example, in the longitudinal mode configuration, there are multiple viewports specified along with their associated SOP Class Handler Modules:


```js
viewports: [
  {
    namespace: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
    displaySetsToDisplay: [ '@ohif/extension-default.sopClassHandlerModule.stack'],
  },
  {
    namespace: '@ohif/extension-cornerstone-dicom-sr.viewportModule.dicom-sr',
    displaySetsToDisplay: [ '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr'],
  },
  // additional viewports
],
```

In this example, there are six viewports specified, each identified by a unique namespace. Each viewport is associated with a specific SOP Class Handler Module through the displaySetsToDisplay property.

To add a new viewport, you would need to create a new SOP Class Handler Module and a new Viewport Module. The SOP Class Handler Module handles the logic for loading and handling specific SOP Class UIDs, while the Viewport Module defines the rendering and behavior of the viewport.

In addition to the viewports, the mode configuration should include and register each SOP Class Handler Module that your mode can handle:


```js
sopClassHandlers: [
  '@ohif/extension-default.sopClassHandlerModule.stack',
  '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr',
  '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
  '@ohif/extension-cornerstone-dicom-rt.sopClassHandlerModule.dicom-rt',
]
```

Here, each SOP Class Handler Module is specified with its namespace.

By configuring the viewports and SOP Class Handler Modules in your mode, you can define how your mode interacts with different types of DICOM data and specify the appropriate rendering and behavior for each SOP Class UID.

## Metadata Store and Provider

In OHIF v2, we utilized the `platform/core/classes/metadata` module, which included the classes StudyeMetadata, SeriesMetadata, and InstanceMetadata for storing metadata. However, in OHIF v3, we have replaced these classes with a more versatile metadata store called `DICOMMetadataStore`. This new metadata store is used by each datasource to store the metadata associated with studies, series, and instances. The DICOMMetadataStore API allows you to add study/series/instance metadata to the store and retrieve metadata from it.

Although we have transitioned to using DICOMMetadataStore as the primary metadata storage mechanism, you still have access to OHIF's MetadataProvider. The MetadataProvider can be found in the same `platform/core/classes` location. The MetadataProvider is internally used to retrieve instance-based metadata based on UIDs, perform queries, and includes some legacy support for older versions of the loading logic.


## Build

We have recently transitioned from bundling all the extensions and the viewer into a single bundle to a more modular approach. In this new approach, the required extensions are dynamically loaded inside a mode as needed. This change brings several advantages, including:

- Faster build time: Bundling only the necessary extensions reduces the build time, as you no longer need to bundle all extensions upfront.
- Smaller bundle size: By loading extensions on-demand, the initial bundle size is reduced, resulting in faster page load times for users.
- Faster reload for development: During development, the incremental build process allows for faster reloads, improving developer productivity.

This new approach does not impact the deployment process of the viewer. You can continue to follow our deployment guides, such as the [Build for Production](./deployment/build-for-production.md) guide, to deploy the viewer effectively.


### Script tag usage of the OHIF viewer

With the transition to more advanced visualization, loading, and rendering techniques using WebWorkers, WASM, and WebGL, the script tag usage of the OHIF viewer has been deprecated. However, if you still prefer to use the script tag usage, it is theoretically possible to bundle all the required dependencies and utilize the script tag approach.

An alternative option for script tag usage is to employ an `iframe`. You can utilize the iframe element to load the OHIF viewer and establish communication with it using the postMessage API. This allows you to exchange messages and data between the parent window and the iframe, enabling interaction and coordination with the OHIF viewer embedded within the iframe.

Please note that while these alternatives exist, we recommend utilizing modern development practices and incorporating OHIF viewer within your application using a more modular and integrated approach, such as leveraging bundlers, and import statements to ensure better maintainability, extensibility, and compatibility with the OHIF ecosystem.

## UI Components

Migrating to Tailwind CSS, OHIF v3 is now able to have a component-oriented styling approach, speeding up development, ensuring consistent styling, making responsive design easier, and enabling extensibility

We have gone through extensive re-design of each part of the UI, and we have also added new components to the OHIF viewer.



## Redux store


In OHIF v3, we made the decision to move away from the Redux store and adopt a new approach utilizing React context providers and services with a pub/sub pattern. This shift was driven by the need for a more flexible and scalable architecture that better aligns with the plugin and extension system of OHIF. This offers

- Modularity and Scalability: Context providers and services enable a modular architecture for easy addition and removal of plugins and extensions.
- Reduced Boilerplate: eliminate Redux boilerplate for simpler development.
- Flexible Pub/Sub Pattern: Services provide a pub/sub pattern for inter-component communication.
