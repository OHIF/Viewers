---
sidebar_label: Context Menu
sidebar_position: 3
title: Context Menu Customization
summary: Documentation for customizing OHIF's context menus, including defining menu structures and click interactions specific to different contexts like the Cornerstone viewport.
---

# Context Menu





Context menus can be created by defining the menu structure and click
interaction, as defined in the `ContextMenu/types`.  There are examples
below specific to the cornerstone context, because the actual click
handler and attributes used to decide when and how to display the menu
are specific to the context used for where the menu is displayed.

##  Cornerstone Context Menu

The default cornerstone context menu can be customized by setting the
`cornerstoneContextMenu`.  For a full example, see `findingsContextMenu`.
