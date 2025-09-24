---
title: Toolbar
summary: Migration guide for toolbar components in OHIF 3.10, covering the new uiType values (ohif.toolButton and ohif.toolButtonList), section-based definitions replacing nested structures, ToolBox updates, and changes to tool option handlers.
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


## Tool Definitions: Moving to Section-Based Definitions

This migration represents a significant step toward a more extension-based toolbar system. We've moved away from the nested primary/items structure in favor of a flatter, more composable section-based approach.

### Deprecated: Nested Toolbar Structures

```diff
- {
-   id: 'MeasurementTools',
-   uiType: 'ohif.toolButtonList',
-   props: {
-     groupId: 'MeasurementTools',
-     evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
-     primary: createButton({
-       id: 'Length',
-       icon: 'tool-length',
-       label: 'Length',
-       tooltip: 'Length Tool',
-       commands: setToolActiveToolbar,
-       evaluate: 'evaluate.cornerstoneTool',
-     }),
-     secondary: {
-       icon: 'chevron-down',
-       tooltip: 'More Measure Tools',
-     },
-     items: [
-       createButton({ ... }),
-       createButton({ ... }),
-       // More nested buttons
-     ],
-   },
- }
```

### New Approach: Section-Based Definitions

```diff
+ // 1. Define the toolbar section container
+ {
+   id: 'MeasurementTools',
+   uiType: 'ohif.toolButtonList',
+   props: {
+     buttonSection: 'measurementSection',
+     groupId: 'MeasurementTools',
+   },
+ },
+ // 2. Register individual buttons separately
+ {
+   id: 'Length',
+   uiType: 'ohif.toolButton',
+   props: {
+     icon: 'tool-length',
+     label: 'Length',
+     tooltip: 'Length Tool',
+     commands: setToolActiveToolbar,
+     evaluate: 'evaluate.cornerstoneTool',
+   },
+ },
+ {
+   id: 'Bidirectional',
+   uiType: 'ohif.toolButton',
+   props: {
+     icon: 'tool-bidirectional',
+     label: 'Bidirectional',
+     tooltip: 'Bidirectional Tool',
+     commands: setToolActiveToolbar,
+     evaluate: 'evaluate.cornerstoneTool',
+   },
+ },
```

and then in your mode you can compose the section and associate buttons

```diff
+ // 3. In your mode, create the section and associate buttons
+ toolbarService.createButtonSection('primary', [
+   'MeasurementTools',
+   'Pan',
+   'Zoom',
+ ]);
+
+
+ toolbarService.createButtonSection('measurementSection', [
+   'Length',
+   'Bidirectional',
+   'ArrowAnnotate',
+   'EllipticalROI',
+ ]);
```

:::note
The `measurementSection` is defined in the tool button configuration of the `MeasurementTools` button.
:::


### Group Evaluators Deprecated

Group evaluator functions like `evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList` are now deprecated. Instead, the `uiType` component itself is responsible for grouping and displaying the buttons from a section as needed. This allows for more flexible UI implementations that aren't tied to specific evaluation logic.



## ToolBox

Previously, the segmentation toolbox was not using an `evaluator` property. This is now taken into account


### evaluators in Toolbox

```js
// old
{
  id: 'BrushTools',
  uiType: 'ohif.buttonGroup',
  props: {
    groupId: 'BrushTools',
  }
}

// now
{
  id: 'BrushTools',
  uiType: 'ohif.buttonGroup',
  props: {
    groupId: 'BrushTools',
    evaluate: 'evaluate.cornerstone.hasSegmentation',
  }
}
```


### Replace Toolbox imports from ui-next with extension-default

```diff
- import { Toolbox } from '@ohif/ui-next';
+ import { Toolbox } from '@ohif/extension-default';
```


Ensure you're importing the Toolbox component from the correct location:

```javascript
// New import pattern
import { Toolbox } from '@ohif/extension-default';

// Usage remains similar
<Toolbox
  servicesManager={servicesManager}
  buttonSectionId="segmentation"
  title="Segmentation Tools"
/>
```

### Stacked Sections in Toolbox

The new Toolbox component supports stacked sections, which allows for more complex UI organization. Instead of flat button groups, you can now create deep hierarchies of tool sections and subsections.


Previously you were able to have something like this

```js
// old
// buttons for BrushTools were a giant group of buttons
const buttons = {
  id: 'BrushTools',
  uiType: 'ohif.toolBoxButtonGroup',
  props: {
    groupId: 'BrushTools',
    evaluate: 'evaluate.cornerstone.hasSegmentation',
    items: [
      {
        id: 'Brush',
        icon: 'icon-tool-brush',
        label: 'Brush',
        evaluate: {
          // ...
        },
        options: [
          // ...
        ],
      },
      {
        id: 'Eraser',
        icon: 'icon-tool-eraser',
        label: 'Eraser',
        evaluate: {
          // ...
        },
        options: [
          // ...
        ],
      },
      {
        id: 'Threshold',
        icon: 'icon-tool-threshold',
        label: 'Threshold Tool',
        evaluate: {
          // ...
        },
        options: [
          // ...
        ],
      },
    ],
  },
},
{
  id: 'Shapes',
  uiType: 'ohif.toolBoxButton',
  props: {
    id: 'Shapes',
    icon: 'icon-tool-shape',
    label: 'Shapes',
    evaluate: {
      // ...
    },
    options: [
        // ...
    ],
  },
},

toolbarService.addButtons(buttons);

toolbarService.createButtonSection('segmentationToolbox', ['BrushTools', 'Shapes']);
```

But now you should have at least one section defined in your toolbar buttons


```js
// separate flat definitions for each button and each section
const buttons = [
  {
    id: 'Brush',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-brush',
      label: 'Brush',
      evaluate: {
        // ...
      },
      options: [
        // ...
      ],
    },
  },
  {
    id: 'Eraser',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-eraser',
      label: 'Eraser',
      evaluate: {
        // ...
      },
      options: [
         // ...
      ],
    },
  },
  {
    id: 'Threshold',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-threshold',
      label: 'Threshold Tool',
      evaluate: {
        // ...
      },
      options: [
        // ...
      ],
    },
  },
  {
    id: 'Shapes',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-shape',
      label: 'Shapes',
      evaluate: {
        name: 'evaluate.cornerstone.segmentation',
        toolNames: ['CircleScissor', 'SphereScissor', 'RectangleScissor'],
        disabledText: 'Create new segmentation to enable shapes tool.',
      },
      options: [
        // ...
      ],
    },
  },
  // Sections
   {
    id: 'SegmentationTools',
    uiType: 'ohif.toolBoxButton',
    props: {
      groupId: 'SegmentationTools',
      buttonSection: 'segmentationToolboxToolsSection',
    },
  },
  {
    id: 'BrushTools',
    uiType: 'ohif.toolBoxButtonGroup',
    props: {
      groupId: 'BrushTools',
      buttonSection: 'brushToolsSection',
    },
  },
]

toolbarService.addButtons(buttons);
```

and then

```js
// Step 2: Create the section hierarchy
// Top level toolbox section
toolbarService.createButtonSection('segmentationToolbox', ['SegmentationTools']);

// Next level - subsections within the toolbox
toolbarService.createButtonSection('segmentationToolboxToolsSection', ['BrushTools', 'Shapes']);

// Lowest level - buttons within a subsection
toolbarService.createButtonSection('brushToolsSection', ['Brush', 'Eraser', 'Threshold']);
```


### Remove ToolboxProvider from composition root

If you have the ToolboxProvider in your application composition, remove it:

```diff
// In App.tsx or similar
const appComposition = [
  [ThemeWrapperNext],
  [ThemeWrapper],
  [SystemContextProvider, { commandsManager, extensionManager, hotkeysManager, servicesManager }],
- [ToolboxProvider],
  [ViewportGridProvider, { service: viewportGridService }],
  // Other providers...
];
```

we now keep the state for toolbar inside the ToolbarService itself

### 3. Update tool option handlers to use onChange instead of commands

```diff
- <RowSegmentedControl
-   key={option.id}
-   option={option}
- />

+ <RowSegmentedControl
+   key={option.id}
+   option={option}
+   onChange={option.onChange}
+ />
```
