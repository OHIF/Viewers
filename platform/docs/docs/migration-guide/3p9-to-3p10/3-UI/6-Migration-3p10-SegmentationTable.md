---
title: Segmentation Table
summary: Migration guide for the refactored SegmentationTable component in OHIF 3.10, covering changes to the context system, compound component pattern adoption, replacement of SelectorHeader, and introduction of segment statistics features.
---


# SegmentationTable Migration Guide

This guide will help you migrate your code to use the refactored SegmentationTable component.

## Key Changes

* **Context System Refactoring**: The context system has been completely redesigned with dedicated providers for different aspects of the segmentation UI
* **Compound Component Pattern**: Components now follow a more structured compound component pattern with clearer parent-child relationships
* **Header Components Changed**: The `SegmentationTable.SelectorHeader` has been replaced with specialized header components
* **New Features**: Added segment statistics, hover cards, and better customization options
* **Better Customization**: Added support for custom dropdown menus and segment statistics headers

## Migration Steps



### 1. Migrate from SelectorHeader to New Header Components

The `SegmentationTable.SelectorHeader` has been removed. Use the new Collapsed pattern instead:

```diff
- <SegmentationTable.SelectorHeader>
-   <CustomDropdownMenuContent />
- </SegmentationTable.SelectorHeader>

+ <SegmentationTable.Collapsed>
+   <SegmentationTable.Collapsed.Header>
+     <SegmentationTable.Collapsed.DropdownMenu>
+       <CustomDropdownMenuContent />
+     </SegmentationTable.Collapsed.DropdownMenu>
+     <SegmentationTable.Collapsed.Selector />
+     <SegmentationTable.Collapsed.Info />
+   </SegmentationTable.Collapsed.Header>
+   <SegmentationTable.Collapsed.Content>
+     {/* Content here */}
+   </SegmentationTable.Collapsed.Content>
+ </SegmentationTable.Collapsed>
```

### 2. Update Component Hierarchy for Expanded View

The expanded view structure has also changed:

```diff
- <SegmentationTable.Expanded>
-   <SegmentationTable.Header>
-     <CustomDropdownMenuContent />
-   </SegmentationTable.Header>
-   <SegmentationTable.Segments />
- </SegmentationTable.Expanded>

+ <SegmentationTable.Expanded>
+   <SegmentationTable.Expanded.Header>
+     <SegmentationTable.Expanded.DropdownMenu>
+       <CustomDropdownMenuContent />
+     </SegmentationTable.Expanded.DropdownMenu>
+     <SegmentationTable.Expanded.Label />
+     <SegmentationTable.Expanded.Info />
+   </SegmentationTable.Expanded.Header>
+   <SegmentationTable.Expanded.Content>
+     <SegmentationTable.AddSegmentRow />
+     <SegmentationTable.Segments />
+   </SegmentationTable.Expanded.Content>
+ </SegmentationTable.Expanded>
```

### 3. Using the New Segment Statistics Component

The new `SegmentStatistics` component provides a way to display segment statistics:

```diff
+ <SegmentationTable.Segments>
+   <SegmentationTable.SegmentStatistics.Header>
+     <CustomSegmentStatisticsHeader />
+   </SegmentationTable.SegmentStatistics.Header>
+   <SegmentationTable.SegmentStatistics.Body />
+ </SegmentationTable.Segments>
```
