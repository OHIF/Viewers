# Module: Toolbar

An extension can register a Toolbar Module by providing a `getToolbarModule()`
method that returns a React Component. The component does not receive any props.
If you want to modify or react to state, you will need to connect to the redux
store. The given toolbar must determine its set of elements and the context of
them. The set of elements will be listed on toolbar `definitions`.

![Toolbar Extension](../assets/img/extensions-toolbar.gif)

<center><i>A toolbar extension example</i></center>

Toolbar components are rendered in the `ToolbarRow` component.

For a complete example implementation,
[check out the OHIFCornerstoneViewport's Toolbar Module](https://github.com/OHIF/Viewers/blob/master/extensions/cornerstone/src/toolbarModule.js).

## Toolbar Custom Component

Toolbar elements can define its own custom react component to be consumed when
rendering it. So far, it accepts `Functional` and `Class` Components. For that,
you just need to expose your `CustomToolbarComponent` as the value of key
`CustomComponent`. In case the property `CustomComponent` is not present, a
default toolbar component will be used to render it. See bellow

```js
definitions: [
...
    {
        id: 'Custom',
        label: 'Custom',
        icon: 'custom-icon',
        CustomComponent: CustomToolbarComponent,
    }
...
]

```

`CustomComponent` components will receive the following props:

- parentContext: parent context. (In most of the cases it will be a ToolbarRow
  instance)
- toolbarClickCallback: callback method when clicking on toolbar
- button: its own definition object
- key: react key prop
- activeButtons: list of active elements
- isActive: if current
