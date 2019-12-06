# Extensions

- [Overview](#overview)
- [Concepts](#concepts)
  - [Configuration](#configuration)
  - [Lifecylce Hooks](#lifecycle-hooks)
  - [Modules](#modules)
  - [Contexts](#contexts)
- [Consuming Extensions](#consuming-extensions)
- [Maintained Extensions](#maintained-extensions)

## Overview

We use extensions to help us isolate and package groups of related features.

<div style="text-align: center;">
  <a href="/assets/img/extensions-diagram.png">
    <img src="/assets/img/extensions-diagram.png" alt="Extensions Diagram" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>Diagram showing how extensions are configured and accessed.</i></div>
</div>

The `@ohif/viewer`'s application level configuration gives us the ability to add
and configure extensions. When the application starts, extensions are registered
with the `ExtensionManager`. Different portions of the `@ohif/viewer` project
will use registered extensions to influence application behavior.

Extensions allow us to:

- Wrap and integrate functionality of 3rd party dependencies in a reusable way
- Change how application data is mapped and transformed
- Display a consistent/cohesive UI
- Inject custom components to override built-in components

Practical examples of extensions include:

- A set of segmentation tools that build on top of the `cornerstone` viewport
- Showing ML/AI report summaries for the selected study/series/image
- Support for parsing DICOM structured reports and displaying them in a user
  friendly way
- [See our maintained extensions for more examples of what's possible](#maintained-extensions)

## Concepts

### Configuration

### Lifecycle Hooks

### Contexts

## Consuming Extensions

...

## Maintained Extensions

A small number of powerful extensions for popular use cases are maintained by
OHIF. They're co-located in the [`OHIF/Viewers`][viewers-repo] repository, in
the top level [`extensions/`][ext-source] directory.

{% include "./_maintained-extensions-table.md" %}

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[viewers-repo]: https://github.com/OHIF/Viewers
[ext-source]: https://github.com/OHIF/Viewers/tree/master/extensions
<!-- prettier-ignore-end -->
