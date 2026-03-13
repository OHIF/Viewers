---
sidebar_position: 8
sidebar_label: Viewport Action Corners
title: Viewport Action Corners Service
summary: Documentation for OHIF's Viewport Action Corners Service, which manages interactive UI components placed in viewport corners, enabling flexible positioning, priority ordering, and dynamic updates of components for viewport-specific control.
---

# Viewport Action Corners Service

The Viewport Action Corners Service is a powerful tool for managing interactive components in the corners of viewports within the OHIF viewer. This service allows developers to dynamically add, remove, and organize various UI elements such as menus, buttons, or custom components in specific locations around the viewport.

## Overview

The Viewport Action Corners Service extends the PubSubService and provides methods to:

- Add single or multiple components to viewport corners
- Clear components from a specific viewport
- Manage the state of viewport corner components

## Key Features

- **Flexible Positioning**: Components can be placed in top-left, top-right, bottom-left, or bottom-right corners of the viewport.
- **Priority Ordering**: Components can be assigned priority indices for ordering within a corner.
- **Viewport-Specific**: Actions are associated with specific viewports, allowing for individualized control.
- **Dynamic Updates**: Components can be added or removed at runtime, enabling context-sensitive UI elements.

## Window level menu contents

When the viewport action menu is configured with the window level menu (e.g. `windowLevelMenu` in the viewport action toolbar), it can show:

- **Window / level** – Adjust brightness and contrast.
- **Colormap** – Select a colormap for the viewport.
- **Colorbar** – Toggle or configure the colorbar.
- **3D only - Volume rendering presets** – Apply presets for 3D volume rendering (e.g. CT Bone, CT Soft Tissue).
- **3D only - Volume rendering options** – Additional 3D rendering options.
- **3D only - Volume Downsizing** – For volume viewports, control IJK decimation (in-plane and through-plane) to reduce memory use and improve performance. Available when a volume is displayed; changing decimation reloads the volume at the selected resolution.

## Usage

To use the Viewport Action Corners Service, you typically interact with it through the `servicesManager`. Here's a basic example of how to add a component:


Take a look at how we add window level menu to the top right corner of the viewport in the `OHIFCornerstoneViewport` component.
