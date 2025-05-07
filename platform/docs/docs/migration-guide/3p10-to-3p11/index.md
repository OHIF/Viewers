---
sidebar_position: 1
sidebar_label: 3.10 -> 3.11 beta
---

# Migration Guide

This guide provides information about migrating from OHIF version 3.10 to version 3.11.

## General

`viewportActionMenu.segmentationOverlay` is renamed to `viewportActionMenu.dataOverlay`
as it handles now both segmentation and data overlay.

## Viewport Action Menu Customization

The structure for defining viewport action menu customizations has changed. See the [Viewport Action Menu](./viewport-action-menu.md) migration guide for details.


## updateStoredPositionPresentation

now uses displaySetInstanceUIDs instead of displaySetInstanceUID.
