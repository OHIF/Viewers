# Service: Measurements

The Measurement Service allows its consumers to store and retrieve measurements.
It also enables notification of new and modified measurements through
subscriptions. More complex applications can also leverage "mappings" to assist
in seamlessly translating between measurement representations.

## Overview

<div style="text-align: center;">
  <a href="/assets/img/measurement-service-diagram.png">
    <img src="/assets/img/measurement-service-diagram.png" alt="Measurement Service Diagram" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>Diagram</i></div>
</div>

There are many possible ways to represent a single measurement. Take, for
example, a single point of interest. It can be encoded as:

- x and y coordinates, and a reference image OR
- x, y, and z coordinates, and a frame of reference

The shape of this information can vary widely; different keys for each value,
coordinates as an array or as an object, etc.

The Measurement Service provides an interoperable target representation, one
based on DICOM SR, its value types, and SCOORD/SCOORD3D. By creating a target
representation, we make it possible for seemingly disparate systems to exchange
measurements.

Each measurement source targets the Measurement Service representation
(ingress), and each measurement consumer can provide "Mapping Criteria" and a
mapping function to request measurements in its format of choice (egress). The
addition of "Mapping Criteria" allows us to detect compatible measurements and
map between any/all representations that share the same criteria by using the
Measurement Service representation as an intermediary.

For basic measurements (Length, Rectangle ROI, etc.) we adhere to the best
practices outlined in a recent DICOM SR whitepaper by David Clunie. For more
complex measurements, we publish definitions and best practices so that third
parties can achieve compatibility and suggest improvements.

### Mapping

In a closed system, Measurement CRUD (create, read, update, delete) can be
fairly straight forward. An application creates a measurement, saves it in a
convenient format, and restores from that format.

However, medical imaging applications are often required to read measurements
from other systems and generate interoperable measurements that can be exported
and provided to 3rd parties. The standards compliant solution for this problem
is achieved through a combination of:

- DICOM Structured Reports (SR)
- DICOM Segmentations (SEG)
- DICOM Presentation State (PR)

There is ample guidance available on how to parse and display information that
adheres to this standard. However, when we attempt to edit measurements, by
mapping measurement information to one or more tools, we encounter new
challenges. The mapping engine of the Measurement Service attempts to solve
those challenges.

When attempting to map measurements to tools, we take different approaches
depending on the information made available to us.

#### Scenarios

Simplest:

- csTools creates
- adds to MeasurementService
- Saves to DICOM SR

```js
const MeasurementService = createMeasurementService();
const { EVENTS, VALUE_TYPES } = MeasurementService;

const measurementSource = MeasurementService.createSource('csTools', '4');
const { addMapping, addOrUpdate } = measurementSource;

addMapping(
  'Length',
  { numPoints: 2, valueType: VALUE_TYPES.POLYLINE },
  () => {}, // toSourceSchema
  () => {} // toMeasurementSchema
);

const measurementId = addOrUpdate('Length', {
  handles: [{ start: { x1, y1 }, end: { x2, y2 } }],
});

// ...
```

Moderate:

- vtk requests measurement

```js
const vtkMeasurementSource = MeasurementService.createSource('vtk', '1');
const { addMapping, addOrUpdate } = measurementSource;

addMapping(
  'Length',
  { numPoints: 2, valueType: VALUE_TYPES.POLYLINE },
  () => {}, // toSourceSchema
  () => {} // toMeasurementSchema
);

MeasurementService.getSourceSchema(vtkMeasurementSource, measurementId);
```

Difficult:

- Read from unknown DICOM SR / author (no known source)

#### Unknown Source

```js
```

#### Known Source

```js
```

## Usage

If you're using the default `@ohif/viewer` project, the MeasurementService is
created and registered with the `ServicesManager`. It is made available to
extensions via the `ServicesManager`. If you're not using the default
`@ohif/viewer` project, you will need to instantiate the `MeasurementService`
class yourself.

```js
const MeasurementService = createMeasurementService({
  /* config */
});

const measurementId = MeasurementService.addOrUpdate({
  // id: undefined,
  sopInstanceUID: '123',
  frameOfReferenceUID: '1234',
  referenceSeriesUID: '12345',
  label: 'Length',
  description: '1',
  unit: 'mm',
  type: MeasurementService.VALUE_TYPES.POLYLINE,
  points: [1, 1, 1, 2], // x1, y1, x2, y2
});
```

## API

- MeasurementService
  - addOrUpdate
  - createSource
  - getMeasurement
  - getMeasurements
  - subscribe
  - EVENTS
  - VALUE_TYPES
- MeasurementSource
  - addMapping
  - addOrUpdate
- Measurement
- MappingCriteria

### MeasurementService

```js
addOrUpdate(<Measurement> Measurement): <string> measurementId

```

```js
// Measurement Representation
addOrUpdate(Measurement: object): string
getMeasurement(measurementId: string): object
getMeasurements(): object[]
```

```js
// From/To Source
addOrUpdate(sourceName: string, sourceMeasurement: object)
getAnnotation(sourceName: string, measurementId: string)
createSource(sourceName: string, )
addMapping(
    sourceName: string,
    matchingCriteria: obj,
    toSourceSchema: func,
    toMeasurementSchema: func
  )
// MeasurementService Representation
// Listen/subscribe/sync
subscribe(eventName: string, callback: func)
```

## How to define a Measurement tool

## How to validate Measurements

## Data exchange concepts

## Longitudinal Measurements

## Timepoints

# UI Dialog Service

Dialogs have similar characteristics to that of Modals, but often with a
streamlined focus. They can be helpful when:

- We need to grab the user's attention
- We need user input
- We need to show additional information

If you're curious about the DOs and DON'Ts of dialogs and modals, check out this
article: ["Best Practices for Modals / Overlays / Dialog Windows"][ux-article]

<div style="text-align: center;">
  <a href="/assets/img/dialog-example.gif">
    <img src="/assets/img/dialog-example.gif" alt="UI Dialog Service Example" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>GIF showing successful call of UIDialogService from an extension.</i></div>
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

| Implementation                       | Consumer                   |
| ------------------------------------ | -------------------------- |
| [Dialog Provider][dialog-provider]\* | Baked into Dialog Provider |

`*` - Denotes maintained by OHIF

> 3rd Party implementers may be added to this table via pull requests.

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[interface]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/UIDialogService/index.js
[dialog-provider]: https://github.com/OHIF/Viewers/blob/master/platform/ui/src/contextProviders/DialogProvider.js
[ux-article]: https://uxplanet.org/best-practices-for-modals-overlays-dialog-windows-c00c66cddd8c
<!-- prettier-ignore-end -->
