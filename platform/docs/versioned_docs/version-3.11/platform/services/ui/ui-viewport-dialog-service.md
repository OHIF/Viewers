---
sidebar_position: 5
sidebar_label: UI Viewport Dialog Service
title: UI Viewport Dialog Service
summary: Documentation for OHIF's UI Viewport Dialog Service, which creates modal dialogs inside specific viewports for contextual user interactions, supporting different types of messages and action buttons for user input.
---

# UI Viewport Dialog Service

## Overview
This is a new UI service, that creates a modal inside the viewport.

Dialogs have similar characteristics to that of Modals, but often with a
streamlined focus. They can be helpful when:

- We need to grab the user's attention
- We need user input
- We need to show additional information

If you're curious about the DOs and DON'Ts of dialogs and modals, check out this
article: ["Best Practices for Modals / Overlays / Dialog Windows"][ux-article]



<div style={{padding:"56.25% 0 0 0", position:"relative"}}>
    <iframe src="https://player.vimeo.com/video/549261939?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"  frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style= {{ position:"absolute",top:0,left:0,width:"100%",height:"100%"}} title="measurement-report"></iframe>
</div>

## Interface

For a more detailed look on the options and return values each of these methods
is expected to support, [check out it's interface in `@ohif/core`][interface]

| API Member     | Description                                            |
| -------------- | ------------------------------------------------------ |
| `create()`     | Creates a new Dialog that is displayed until dismissed |
| `dismiss()`    | Dismisses the specified dialog                         |
| `dismissAll()` | Dismisses all dialogs                                  |

## Implementations

| Implementation           | Consumer                   |
| ------------------------ | -------------------------- |
| [ViewportDialogProvider] | Baked into Dialog Provider |

`*` - Denotes maintained by OHIF


## State

```js
const DEFAULT_STATE = {
  viewportId: null,
  message: undefined,
  type: 'info', // "error" | "warning" | "info" | "success"
  actions: undefined, // array of { type, text, value }
  onSubmit: () => {
    console.log('btn value?');
  },
  onOutsideClick: () => {
    console.warn('default: onOutsideClick')
  },
  onDismiss: () => {
    console.log('dismiss? -1');
  },
};
```
