---
sidebar_position: 10
sidebar_label: Migration Guide
---

# Migration Guide

In this page, we will provide a guide to migrate from OHIF v2 to v3. Please note
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

As mentioned briefly above, modes are configuration objects that will be used by the viewer to load extensions. This let users to be able to use common extensions with different configurations. So us as OHIF developers can focus on creating extensions while
you as the user can focus on creating modes having your own use case and configuraiton/initialization logic in mind.

Separating the configuration from the extensions also makes it so that you can
have multiple modes in a single application each focusing on certain tasks. For example, you can have a mode for segmentation which uses specific panel and tools which you don't need
for a mode that will be used for reading.

Upon entering a mode, the Viewer will register its declared extensions and load them. And you
can specify which modules you need from each extensions in the mode configuration. For instance

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


The way you write extensions is the same as before. Extensions can (like before) have
modules exported via `get{ModuleName}Module` (e.g., `getViewportModule`). There are new
types of modules that can be exported from extensions.

### CommandsModule

The structure of the commands module is the same as before. The only difference is that
we use Cornerstone3D for rendering and tools. So, if you have a custom command that you were
using in the v2, you need to migrate it to the new Cornerstone3D API.

You can visit the migration guide for cornerstone  [here](https://www.cornerstonejs.org/docs/migrationGuides).

### ViewportModule




## Build

We have recently moved from bundling all the extensions and the viewer into a single
bundle to a more modular approach by dynamically loading the required extensions inside a mode. This
approach has many advantages, such as:

- Faster build time
- Smaller bundle size
- Faster reload for development

This new approach should not affect the way you deploy the viewer. You can visit our
[deployment guides](./deployment/build-for-production.md) to learn more.



## Metadata Store and Provider

In OHIF v2 we used to have `platform/core/classes/metadata` which included the StudyeMetadata,
SeriesMetadata and InstanceMetadata classes to store the metadata. However, in OHIF v3
we have removed them in favor of a more generic metadata store called `DICOMMetadataStore`, which
each datasource will use to store the metadata. The DICOMMetadataStore API will let you
to add study/series/instance metadata to the store and also get the metadata from the store.

However, you still have access to the OHIF's MetadataProvider from the same
`platform/core/classes` path. The MetadataProvider is used internally to grab
instance based metadata based on the UIDs, query and has some legacy support for
older version of the loading logic.


## Script tag usage of the OHIF viewer

As we have moved to more advanced visualization, loading and rendering using
WebWorkers, WASM and WebGL, we have decided to deprecate the script tag usage of the OHIF viewer.
However, if you still want to use the script tag usage, you can theoretically bundle
all the required dependencies and use the script tag usage.

Another alternative for script tag usage is to use an iframe. You can use the iframe
to load the OHIF viewer and communicate with it using the [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).
