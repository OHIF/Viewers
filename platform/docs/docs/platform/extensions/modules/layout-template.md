---
sidebar_position: 7
sidebar_label: Layout Template
title: Layout Template Module
summary: Documentation for OHIF Layout Template Module, which defines the structural organization of the viewer interface, controlling toolbar positioning, panel arrangement, and viewport grid placement through React components.
---

# Module: Layout Template

## Overview

`LayoutTemplates` are a new concept in v3 that modes use to control the layout
of a route. A layout template is a React component that is given a set of
managers that define apis to access toolbar state, commands, and hotkeys, as
well as props defined by the layout template.

For instance the default LayoutTemplate takes in leftPanels, rightPanels and
viewports as props, which it uses to build its view.

In addition, `layout template` has complete control over the structure of the
application. You could have tools down the left side, or a strict guided
workflow with tools set programmatically, the choice is yours for your use case.

```jsx
const getLayoutTemplateModule = (/* ... */) => [
  {
    id: 'exampleLayout',
    name: 'exampleLayout',
    component: ExampleLayoutComponent,
  },
];
```

The `props` that are passed to `layoutTemplate` are managers and service, along
with the defined mode left/right panels, mode's defined viewports and OHIF
`ViewportGridComp`. LayoutTemplate leverages extensionManager to grab typed
extension module entries: `*.getModuleEntry(id)`

A simplified code for `Default extension`'s layout template is:

```jsx title="extensions/default/src/ViewerLayout/index.jsx"
import React from 'react';
import { SidePanel } from '@ohif/ui';

function Toolbar({ servicesManager }) {
  const { ToolBarService } = servicesManager.services;

  return (
    <>
      // ToolBarService.getButtonSection('primary') to get toolbarButtons
      {toolbarButtons.map((toolDef, index) => {
        const { id, Component, componentProps } = toolDef;
        return (
          <Component
            key={id}
            id={id}
            {...componentProps}
            bState={buttonState}
            isActive={isActive}
            onInteraction={args => ToolBarService.recordInteraction(args)}
          />
        );
      })}
    </>
  );
}

function ViewerLayout({
  // From Extension Module Params
  extensionManager,
  servicesManager,
  hotkeysManager,
  commandsManager,
  // From Modes
  leftPanels,
  rightPanels,
  viewports,
  ViewportGridComp,
}) {
  const getPanelData = id => {
    const entry = extensionManager.getModuleEntry(id);
    const content = entry.component;

    return {
      iconName: entry.iconName,
      iconLabel: entry.iconLabel,
      label: entry.label,
      name: entry.name,
      content,
    };
  };

  const getViewportComponentData = viewportComponent => {
    const entry = extensionManager.getModuleEntry(viewportComponent.namespace);

    return {
      component: entry.component,
      displaySetsToDisplay: viewportComponent.displaySetsToDisplay,
    };
  };

  const leftPanelComponents = leftPanels.map(getPanelData);
  const rightPanelComponents = rightPanels.map(getPanelData);
  const viewportComponents = viewports.map(getViewportComponentData);

  return (
    <div>
      <Toolbar servicesManager={servicesManager} />

      <div>
        {/* LEFT SIDEPANELS */}
        <SidePanel
          side="left"
          defaultComponentOpen={leftPanelComponents[0].name}
          childComponents={leftPanelComponents}
        />

        {/* TOOLBAR + GRID */}
        <ViewportGridComp
          servicesManager={servicesManager}
          viewportComponents={viewportComponents}
          commandsManager={commandsManager}
        />

        {/* Right SIDEPANELS */}
        <SidePanel
          side="right"
          defaultComponentOpen={rightPanelComponents[0].name}
          childComponents={rightPanelComponents}
        />
      </div>
    </div>
  );
}
```

## Overview Video

<div style={{padding:"56.25% 0 0 0", position:"relative"}}>
    <iframe src="https://player.vimeo.com/video/545993263?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style= {{ position:"absolute",top:0,left:0,width:"100%",height:"100%"}} title="measurement-report"></iframe>
</div>
