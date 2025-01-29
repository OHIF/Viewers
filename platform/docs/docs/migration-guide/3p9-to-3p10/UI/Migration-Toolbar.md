---
title: Toolbar
---

# Toolbar

## New Toolbar uiType

We have two new toolbar button types: `ohif.toolButtonList` and `ohif.toolButton`, which are intended to replace the `ohif.radioGroup` and `ohif.splitButton` types.

Note that these are backward compatible, so if you are not ready to pick up the new ui types (which are more flexible and powerful), you can continue using the old types.


```js
// Old type
{
  uiType: 'ohif.radioGroup',
}

// New type
{
  uiType: 'ohif.toolButton',
}
```

and

```js
// Old type
{
  uiType: 'ohif.splitButton',
}

// New type
{
  uiType: 'ohif.toolButtonList',
}
```

The `ohif.buttonGroup` and `ohif.radioGroup` types used in the Toolbox have been replaced with `ohif.toolBoxButtonGroup` and `ohif.toolBoxButton` to reflect their usage in the Toolbox, which has distinct styling.

```js
// Old type
{
  uiType: 'ohif.buttonGroup',
}

// New type
{
  uiType: 'ohif.toolBoxButtonGroup',
}
```


```js
// Old type
{
  uiType: 'ohif.radioGroup',
}

// New type
{
  uiType: 'ohif.toolBoxButton',
}
```



## getToolbarModule


The `getToolbarModule` function previously returned `disabled`, `disabledText`, and `className` as part of its evaluation process for the button state. These properties will still be returned, but common class names are now handled internally by the new UI button components, including `ToolButton`, `ToolButtonList`, `Toolbox`, and `ToolBoxGroup`. You can override the `className` if you need to.


## ToolBox

Previously, the segmentation toolbox was not using an `evaluator` property. This is now taken into account


```js
// old
{
  id: 'BrushTools',
  uiType: 'ohif.buttonGroup',
  props: {
    groupId: 'BrushTools',
    items: []
  }
}

// now
{
  id: 'BrushTools',
  uiType: 'ohif.buttonGroup',
  props: {
    groupId: 'BrushTools',
    evaluate: 'evaluate.cornerstone.hasSegmentation',
    items: []
  }
}
```
