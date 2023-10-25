---
sidebar_position: 5
sidebar_label: Toolbar Service
---

# Toolbar Service

## Overview

`ToolBarService` handles the toolbar section buttons, and what happens when a
button is clicked by the user.

<div style={{padding:"56.25% 0 0 0", position:"relative"}}>
    <iframe src="https://player.vimeo.com/video/547957214?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"  frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style= {{ position:"absolute",top:0,left:0,width:"100%",height:"100%"}} title="measurement-report"></iframe>
</div>

## Events

| Event                   | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| TOOL_BAR_MODIFIED       | Fires when a button is added/removed to the toolbar                    |
| TOOL_BAR_STATE_MODIFIED | Fires when an interaction happens and ToolBarService state is modified |

## API

- `recordInteraction(interaction)`: executes the provided interaction which is
  an object providing the following properties to the ToolBarService:

  - `interactionType`: can be `tool`, `toggle` and `action`. We will discuss
    more each type below.
  - `itemId`: tool name
  - `groupId`: the Id for the tool button group; e.g., `Wwwc` which holds
    presets.
  - `commandName`: if tool has a command attached to run
  - `commandOptions`: arguments for the command.
  - `setActive`: Sets a given tool active (not as primary but as secondary)

- `reset`: reset the state of the toolbarService, set the primary tool to be
  `Wwwc` and unsubscribe tools that have registered their functions.

- `addButtons`: add the button definition to the service.
  [See below for button definition](#button-definitions).

- `setButtons`: sets the buttons defined in the service. It overrides all the
  previous buttons

- `getActiveTools`: returns the active tool + all the toggled-on tools

- `setDefaultTool`: sets the default tool that will be activated whenever the primary tool is deactivated without activating another/different tool

## State

ToolBarService has an internal state that gets updated per tool interaction and
tracks the active toolId, state of the buttons that have toggled state, and the
group buttons and which tool in each group is active.

```js
state = {
  primaryToolId: 'Wwwc',
  toggles: {
    /* id: true/false */
  },
  groups: {
    /* track most recent click per group...*/
  },
};
```

## Interaction type

There are three main types that a tool can have which is defined in the
interaction object.

- `tool`: setting a tool to be active; e.g., measurement tools
- `toggle`: toggling state of a tool; e.g., viewport link (sync)
- `action`: performs a registered action outside of the ToolBarService; e.g.,
  capture

A _simplified_ implementation of the ToolBarService is:

```js
export default class ToolBarService {
  /** ... **/
  recordInteraction(interaction) {
    /** ... **/
    switch (interactionType) {
      case 'action': {
        break;
      }
      case 'tool': {
        this.state.primaryToolId = itemId;

        commandsManager.runCommand('setToolActive', interaction.commandOptions);
        break;
      }
      case 'toggle': {
        this.state.toggles[itemId] =
          this.state.toggles[itemId] === undefined
            ? true
            : !this.state.toggles[itemId];
        interaction.commandOptions.toggledState = this.state.toggles[itemId];
        break;
      }
      default:
        throw new Error(`Invalid interaction type: ${interactionType}`);
    }
    /** ... **/
  }
  /** ... **/
}
```

## Button Definitions

The simplest toolbarButtons definition has the following properties:

![toolbarModule-zoom](../../../assets/img/toolbarModule-zoom.png)

```js
{
  "id": "Zoom",
  "type": "ohif.radioGroup",
  "props": {
    "type": "tool",
    "icon": "tool-zoom",
    "label": "Zoom",
    "commands": [
      {
        "commandName": "setToolActive",
        "commandOptions": {
          "toolName": "Zoom"
        },
        "context": "CORNERSTONE"
      }
    ]
  }
}
```

| property         | description                                                       | values                                      |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `id`             | Unique string identifier for the definition                       | \*                                          |
| `type`           | Used to determine the button's behaviour                          | "tool", "toggle", "action"                  |
| `icon`           | A string name for an icon supported by the consuming application. | \*                                          |
| `label`          | User/display friendly to show in UI                               | \*                                          |
| `commands`       | (optional) The commands to run when the button is used. It include a commandName, commandOptions, and/or a context            | Any command registered by a `CommandModule` |

There are three main types of toolbar buttons:

- `tool`: buttons that enable a tool by running the `setToolActive` command with
  the `commandOptions`
- `toggle`: buttons that acts as a toggle: e.g., linking viewports
- `action`: buttons that executes an action: e.g., capture button to save
  screenshot

## Nested Buttons

You can use the `ohif.splitButton` type to build a button with extra tools in
the dropdown.

- First you need to give your `primary` tool definition to the split button
- the `secondary` properties can be a simple arrow down (`chevron-down` icon)
- For adding the extra tools add them to the `items` list.

You can see below how `longitudinal` mode is using the available toolbarModule
to create `MeasurementTools` nested button

![toolbarModule-nested-buttons](../../../assets/img/toolbarModule-nested-buttons.png)

```js title="modes/longitudinal/src/toolbarButtons.js"
{
  "id": "MeasurementTools",
  "type": "ohif.splitButton",
  "props": {
    "groupId": "MeasurementTools",
    "isRadio": true,
    "primary": {
      "id": "Length",
      "icon": "tool-length",
      "label": "Length",
      "type": "tool",
      "commands": [
        {
          "commandName": "setToolActive",
          "commandOptions": {
            "toolName": "Length"
          },
          "context": "CORNERSTONE"
        },
        {
          "commandName": "setToolActive",
          "commandOptions": {
            "toolName": "SRLength",
            "toolGroupId": "SRToolGroup"
          },
          "context": "CORNERSTONE"
        }
      ],
      "tooltip": "Length"
    },
    "secondary": {
      "icon": "chevron-down",
      "label": "",
      "isActive": true,
      "tooltip": "More Measure Tools"
    },
    "items": [
      {
        "id": "Bidirectional",
        "icon": "tool-bidirectional",
        "label": "Bidirectional",
        "type": "tool",
        "commands": [
          {
            "commandName": "setToolActive",
            "commandOptions": {
              "toolName": "Bidirectional"
            },
            "context": "CORNERSTONE"
          },
          {
            "commandName": "setToolActive",
            "commandOptions": {
              "toolName": "SRBidirectional",
              "toolGroupId": "SRToolGroup"
            },
            "context": "CORNERSTONE"
          }
        ],
        "tooltip": "Bidirectional Tool"
      },
      {
        "id": "ArrowAnnotate",
        "icon": "tool-annotate",
        "label": "Annotation",
        "type": "tool",
        "commands": [
          {
            "commandName": "setToolActive",
            "commandOptions": {
              "toolName": "ArrowAnnotate"
            },
            "context": "CORNERSTONE"
          },
          {
            "commandName": "setToolActive",
            "commandOptions": {
              "toolName": "SRArrowAnnotate",
              "toolGroupId": "SRToolGroup"
            },
            "context": "CORNERSTONE"
          }
        ],
        "tooltip": "Arrow Annotate"
      },
    ]
  }
}
```
