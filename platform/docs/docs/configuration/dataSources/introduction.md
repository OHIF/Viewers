---
sidebar_position: 1
sidebar_label: Introduction
title: Data Source Introduction
summary: Introduces OHIF's data structure based on naturalized DICOM JSON format, providing an overview of common data sources available in OHIF and how custom data sources can be implemented.
---

# Data Source

The internal data structure of OHIF’s metadata follows naturalized DICOM JSON, a
format pioneered by `dcmjs`. In short DICOM metadata headers with DICOM Keywords
instead of tags, for easy development and clear code. OHIF uses the shapes of
`@dcmjs-org/dcmjs` 1.0: a sequence with one item is the item object, and a
sequence with more items is a list. Use `asArray` from `@cornerstonejs/utils` to
read a sequence as a list.

Here in this section we will discuss couple of data sources that are commonly used
and OHIF has provided the implementation for them.

## Custom Data Source
Do you have a custom data source? or a custom data that you want to use in OHIF?
You can easily write a data source to map your data to OHIF’s native format.

You can read more in the [Data Source Module](../../platform/extensions/modules/data-source.md)
