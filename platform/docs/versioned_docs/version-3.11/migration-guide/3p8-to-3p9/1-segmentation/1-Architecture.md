---
id: seg-new-arch
title: New Architecture
summary: Overview of the new viewport-centric segmentation architecture in OHIF 3.9, which replaces the previous toolGroup-centric approach and introduces clearer separation between segmentation data and its visual representation.
---


## New Architecture

* **Viewport-Centric Architecture**
  * Previous: Segmentations were tied to toolGroups
  * Now: Segmentations are tied directly to viewports
  * Impact: More granular control but requires significant code changes

* **Representation Management**
  * Previous: Required managing segmentation representation UIDs
  * Now: Uses simpler segmentationId + type combination
  * Impact: Simplified but requires API updates



If you are not familiar with the difference between a segmentation and a segmentation representation, below

<details>
<summary>Read More</summary>

In Cornerstone3DTools, we have decoupled the concept of a Segmentation from a Segmentation Representation. This means that from one Segmentation we can create multiple Segmentation Representations. For instance, a Segmentation Representation of a 3D Labelmap, can be created from a Segmentation data, and a Segmentation Representation of a Contour can be created from the same Segmentation data. This way we have decouple the presentational aspect of a Segmentation from the underlying data.


Similar relationship structure has been adapted in popular medical imaging softwares such as 3D Slicer with the addition of polymorph segmentation.

- https://github.com/PerkLab/PolySeg
- https://www.slicer.org/



</details>




### Architecture Overview

The new architecture in Cornerstone3D 2.0 makes a clear distinction between:

* A segmentation (the data structure containing segments)
* A segmentation representation (how that segmentation is visualized in a specific viewport)

Let's now review what has changed
