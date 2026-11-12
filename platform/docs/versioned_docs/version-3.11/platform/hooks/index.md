---
title: Hooks
summary: List of React hooks available in the platform, these are custom hooks that are used to access the state of the platform
---

# Hooks

## [useMeasurements](./useMeasurements.md)
A React hook that provides mapped measurements from the measurement service with automatic updates when measurements change.

## [useViewportSegmentations](./useViewportSegmentations.md)
A React hook that provides segmentation data and representations for the active viewport with automatic updates when segmentations change.

## [useMeasurementTracking](./useMeasurementTracking.md)
A React hook that provides measurement tracking information for a specific viewport, including tracking state and tracked measurement UIDs.

## [useViewportDisplaySets](./useViewportDisplaySets.md)
A React hook that provides access to display sets associated with a viewport, including background, foreground, overlay, and potential display sets.

## [useViewportHover](./useViewportHover.md)
A React hook that tracks mouse hover state and active status for a specific viewport.

## [usePatientInfo](./usePatientInfo.md)
A React hook that provides patient information from the active display sets and detects when multiple patients are loaded.

## [useSearchParams](./useSearchParams.md)
A React hook that provides access to URL search parameters from both the query string and hash fragment.

## [useDynamicMaxHeight](./useDynamicMaxHeight.md)
A React hook that calculates the maximum height for an element based on its position in the viewport, with automatic recalculation on window resize or data changes.

## [useSessionStorage](./useSessionStorage.md)
A React hook that provides sessionStorage access with automatic JSON parsing/stringifying and an option to clear data when the page unloads.