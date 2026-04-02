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

## Volume Options menu

When the viewport action toolbar includes the **Volume Options** button (`volumeOptionsMenu`), it opens a corner menu that is shown **only on 3D volume viewports** (volume3d) with reconstructable display sets. It does not appear on MPR or other viewport types.

The menu includes:

### Volume Cropping
- **Enable Cropping** – Show or hide the volume clipping planes used to crop the 3D volume. When enabled, the volume is clipped to a box; you can adjust the box with the handles. Hotkey: **Y**.
- **Show Handles** – Show or hide the draggable corner and face handles used to adjust the cropping box. Hotkey: **X**.
- **Rotate Planes** – When on, dragging rotates the clipping planes instead of the camera (without needing shift). Hotkey: **S**.

Use shift-click to rotate the clipping planes when "Rotate Planes" is off.

### Sampling
- **Sample distance** – Multiplier (1–8) for sampling distance during volume interactions.
- **During rotation** – Extra factor (1–8) applied when rotating the volume (affects quality vs. performance during drag).

### Volume Downsizing
- **In-Plane (i,j)** – Decimation along the volume rows/columns (1–32). Reduces memory and can improve performance.
- **Slice (k)** – Decimation along the slice axis (1–64).
- The menu shows current voxel counts (original → decimated). Changing decimation reloads the volume at the selected resolution.

## Usage

To use the Viewport Action Corners Service, you typically interact with it through the `servicesManager`. Here's a basic example of how to add a component:


Take a look at how we add window level menu to the top right corner of the viewport in the `OHIFCornerstoneViewport` component.
