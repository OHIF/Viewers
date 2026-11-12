---
id: seg-representation
title: Segmentation Representations
summary: Migration guide for segmentation representation management in OHIF 3.9, explaining the transition from toolGroup-based to viewport-centric representation handling, and introducing the new specifier pattern for more flexible API usage.
---




## Segmentation Representation Management API

```js
addSegmentationRepresentationToToolGroup
removeSegmentationRepresentationFromToolGroup
getSegmentationRepresentationsForToolGroup
```

In Cornerstone3D 2.0, segmentation representation management has shifted from a tool group-centric approach to a viewport-centric approach. This architectural change provides better control over segmentation rendering and simplifies the mental model for managing segmentations.


### Adding Segmentation Representations

**Before (3.8)**:

```js
// Tool group-based approach
await segmentation.addSegmentationRepresentationToToolGroup(
  toolGroupId,
  segmentationId,
  hydrateSegmentation,
  csToolsEnums.SegmentationRepresentations.Labelmap
);
```

**After (3.9)**:

```js
// Viewport-centric approach
await segmentation.addSegmentationRepresentation(
  viewportId,
  {
    segmentationId: segmentationId,
    type: csToolsEnums.SegmentationRepresentations.Labelmap,
  }
);
```

### Removing Segmentation Representations

**Before** :

```js
// Remove specific representations from a tool group
segmentation.removeSegmentationRepresentationFromToolGroup(
  toolGroupId,
  [segmentationRepresentationUID]
);
// Remove all representations from a tool group
segmentation.removeSegmentationRepresentationFromToolGroup(toolGroupId);
```

**After**

```js
// Remove specific representation from a viewport
segmentation.removeSegmentationRepresentation(
  viewportId,
  {
    segmentationId: segmentationId,
    type: csToolsEnums.SegmentationRepresentations.Labelmap
  }
);
// Remove all representations from a viewport
segmentation.removeSegmentationRepresentations(viewportId);
```

### Getting Segmentation Representations

**Before**:

```js
// Get representations for a tool group
const representations = segmentation.getSegmentationRepresentationsForToolGroup(toolGroupId);
```

**After** :

```js
// Get all representations for a viewport
const representations = segmentation.getSegmentationRepresentations(viewportId);

// Get specific type of representations
const labelmapReps = segmentation.getSegmentationRepresentations(viewportId, {
  type: csToolsEnums.SegmentationRepresentations.Labelmap
});

// Get representations for specific segmentation
const segmentationReps = segmentation.getSegmentationRepresentations(viewportId, {
  segmentationId: segmentationId
});

// Get specific representation
const representation = segmentation.getSegmentationRepresentation(viewportId, {
  segmentationId: segmentationId,
  type: csToolsEnums.SegmentationRepresentations.Labelmap
});
```

### Understanding the Specifier Pattern

The Cornerstone3D 2.0 (OHIF 3.9) API introduces a "specifier" pattern that provides more flexible and precise control over segmentation representations. A specifier is an object that can include:

```js
type Specifier = {
  segmentationId?: string;  // The ID of the segmentation
  type?: SegmentationRepresentations;  // The type of representation (Labelmap, Contour, etc.)
}
```

The specifier pattern allows for:

1. **Precise Targeting**: You can target specific segmentations and representation types
   - Allows direct access to individual segmentations
   - Enables filtering by representation type

2. **Flexible Querying**: You can get all representations of a certain type or for a specific segmentation
   - Query by segmentation ID
   - Query by representation type
   - Combine queries for specific needs

3. **Granular Control**: You can manage representations at different levels of specificity
   - Viewport level control
   - Segmentation level control
   - Individual representation type control

### Examples of Specifier Usage

```js
// Get all labelmap representations in a viewport
const labelmaps = segmentation.getSegmentationRepresentations(viewportId, {
  type: csToolsEnums.SegmentationRepresentations.Labelmap
});

// Get all representations of a specific segmentation (including contour, labelmap, surface)
const segReps = segmentation.getSegmentationRepresentations(viewportId, {
  segmentationId: 'seg123'
});

// Get a specific representation
const specificRep = segmentation.getSegmentationRepresentation(viewportId, {
  segmentationId: 'seg123',
  type: csToolsEnums.SegmentationRepresentations.Labelmap
});
```

<details>
<summary>Benefits of the New Approach</summary>

1. **Direct Viewport Control**:
    - Each viewport can have its own unique representation configuration
    - No need to create separate tool groups for different viewport representations
2. **Simpler Mental Model**:
    - Representations are directly tied to where they're displayed
    - No intermediate tool group layer to manage
3. **More Flexible Rendering**:
    - Each viewport can render the same segmentation differently
    - Better support for multiple views of the same data
4. **Improved Type Safety**:
    - Specifier pattern provides better TypeScript support
    - More explicit API with clearer intentions
</details>


<details>
<summary>Migration Tips</summary>

1. **Replace Tool Group References**:
    - Search your codebase for `toolGroupId` references in segmentation code
    - Replace with appropriate `viewportId` references
2. **Update Event Handlers**:
    - Update any code listening for segmentation events
    - Events now include viewportId instead of toolGroupId
3. **Review Representation Management**:
    - Identify where you manage segmentation representations
    - Convert to using the new viewport-centric methods
4. **Consider Viewport Context**:
    - Think about segmentation representation in terms of viewport display
    - Use specifiers to target specific representations when needed

</details>
