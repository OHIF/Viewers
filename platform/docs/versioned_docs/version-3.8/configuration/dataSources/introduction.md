---
sidebar_position: 1
sidebar_label: Introduction
---

# Data Source

The internal data structure of OHIF’s metadata follows naturalized DICOM JSON, a
format pioneered by `dcmjs`. In short DICOM metadata headers with DICOM Keywords
instead of tags and sequences as arrays, for easy development and clear code.

Here in this section we will discuss couple of data sources that are commonly used
and OHIF has provided the implementation for them.

## Custom Data Source
Do you have a custom data source? or a custom data that you want to use in OHIF?
You can easily write a data source to map your data to OHIF’s native format.

You can read more in the [Data Source Module](../../platform/extensions/modules/data-source.md)
