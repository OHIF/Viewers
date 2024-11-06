---
sidebar_position: 1
sidebar_label: Introduction
---

# Services

## Overview

Services are "concern-specific" code modules that can be consumed across layers.
Services provide a set of operations, often tied to some shared state, and are
made available to through out the app via the `ServicesManager`. Services are
particularly well suited to address [cross-cutting
concerns][cross-cutting-concerns].

Each service should be:

- self-contained
- able to fail and/or be removed without breaking the application
- completely interchangeable with another module implementing the same interface

> In `OHIF-v3` we have added multiple non-UI services and have introduced
> **pub/sub** pattern to reduce coupling between layers.
>
> [Read more about Pub/Sub](./pubsub.md)

## Services

The following services is available in the `OHIF-v3`.

<table>
    <thead>
        <tr>
            <th>Service</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <a href="./data/DicomMetadataStore">
                    DicomMetadataStore
                </a>
            </td>
            <td>Data Service</td>
            <td>
                DicomMetadataStore
            </td>
        </tr>
        <tr>
            <td>
                <a href="./data/DisplaySetService">
                    DisplaySetService
                </a>
            </td>
            <td>Data Service</td>
            <td>
                DisplaySetService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./data/SegmentationService">
                    segmentationService
                </a>
            </td>
            <td>Segmentation Service</td>
            <td>
                segmentationService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./data/HangingProtocolService">
                    HangingProtocolService
                </a>
            </td>
            <td>Data Service</td>
            <td>
                HangingProtocolService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./data/MeasurementService">
                    MeasurementService (MODIFIED)
                </a>
            </td>
            <td>Data Service</td>
            <td>
                MeasurementService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./data/ToolBarService">
                    ToolBarService
                </a>
            </td>
            <td>Data Service</td>
            <td>
                ToolBarService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./ui/viewport-grid-service">
                    ViewportGridService
                </a>
            </td>
            <td>UI Service</td>
            <td>
                ViewportGridService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./ui/cine-service">
                    Cine Service
                </a>
            </td>
            <td>UI Service</td>
            <td>
                cine
            </td>
        </tr>
        <tr>
            <td>
                <a href="./ui/customization-service">
                    CustomizationService
                </a>
            </td>
            <td>UI Service</td>
            <td>
                customizationService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./ui/ui-dialog-service">
                    UIDialogService
                </a>
            </td>
            <td>UI Service</td>
            <td>
                UIDialogService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./ui/ui-modal-service">
                    UIModalService
                </a>
            </td>
            <td>UI Service</td>
            <td>
                UIModalService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./ui/ui-notification-service">
                    UINotificationService
                </a>
            </td>
            <td>UI Service</td>
            <td>
                UINotificationService
            </td>
        </tr>
        <tr>
            <td>
                <a href="./ui/ui-viewport-dialog-service">
                    UIViewportDialogService
                </a>
            </td>
            <td>UI Service</td>
            <td>
                UIViewportDialogService
            </td>
        </tr>
    </tbody>
</table>

<!--
  LINKS
  -->

<!-- prettier-ignore-start -->

[core-services]: https://github.com/OHIF/Viewers/tree/master/platform/core/src/services
[services-manager]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/ServicesManager.js
[cross-cutting-concerns]: https://en.wikipedia.org/wiki/Cross-cutting_concern
<!-- prettier-ignore-end -->
