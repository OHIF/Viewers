# Module: Layout Template

- [Overview](#overview)


## Overview
LayoutTemplates are a new concept in v3 that modes use to control the layout of a route.

A layout template is a React component that is given a set of managers that define apis to access things like toolbar state, commands, and hotkeys, as well as props defined by the layout template.

For instance the default LayoutTemplate takes in leftPanels, rightPanels and viewports as props, which it uses to build its view.

Other than that the layout template has complete control over the structure of the application. You could have tools down the left side, or a strict guided workflow with tools set programmatically, the choice is yours for your use case.
