# Extensions

Extensions are a way to add powerful They do this through An extension can be added through the `ExtensionManager` exposed by `ohif-core`. Common

## Custom Extensions

At a glance, an extension is a class or object that has a `getExtensionId()` method, and one or more "module" methods that are used to register a specific kind of functionality. You can read more about each kind of "module" below.

```js
class myCustomExtension {

    /** Required */
    getExtensionId: () => 'my-extension-id';

    /** React component that receives props from ConnectLayoutManager
     *  If more than one viewport module is registered, SopClassHandler
     *  is used to help determine which component is used */
    getViewportModule: () => reactViewportComponent;

    /** React component that adds buttons/behavior to the viewer Toolbar */ 
    getToolbarModule: () => reactToolbarComponent;

    /** Provides a whitelist of SOPClassUIDs the viewport is capable of rendering.
     *  Can modify default behavior for methods like `getDisplaySetFromSeries` */
    getSopClassHandler: () => {
        id: 'some-other-unique-id',
        type: PLUGIN_TYPES.SOP_CLASS_HANDLER,
        sopClassUids: ['string'],
        getDisplaySetFromSeries: (series, study, dicomWebClient, authorizationHeaders) => ...
    };

    // Not yet used
    getPanelModule: () => null;
}
```

### Modules

#### Viewport

...

#### Toolbar

...

#### SopClassHandler

...

#### Panel

...


## OHIF Maintained Extensions

A small number of powerful extensions for popular use cases are maintained by OHIF. They're co-located in the [`OHIF/Viewers`](https://github.com/OHIF/Viewers/tree/react/) repository, in the top level [`extensions/`](https://github.com/OHIF/Viewers/tree/react/extensions) directory. 


{% include "./_maintained-extensions-table.md" %}

[extension types](https://github.com/OHIF/ohif-core/blob/master/src/plugins.js#L1-L6)

Interface:
- getExtensionId()
- "types" (modules on extension)
    - getViewport()
    - getToolbar()
    - getPanel()
    - getSop_Class_Handler()

calls: (for each module on extension)
```
store.dispatch(addPlugin({
    id: extensionId,
    type: PLUGIN_TYPE,
    component: getViewport() --> Viewport Component
}))
```

({
    type: 'ADD_PLUGIN',
    plugin
})

https://github.com/OHIF/ohif-core/blob/43c08a29eff3fb646a0e83a03a236ddd84f4a6e8/src/redux/reducers/plugins.js#L7-L30

- Connected Layout Manager
    - AvailablePlugins that match Viewport type

ToolbarRow
    - AvailablePlugins that match Toolbar type

