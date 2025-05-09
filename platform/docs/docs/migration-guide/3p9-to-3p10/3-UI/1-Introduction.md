---
title: Introduction
position: 1
---


## Introduction

The OHIF Viewer has two main parts: the worklist and the image viewer.

In version 3.10, we successfully migrated the image viewer to the `@ohif/ui-next` library. This is a complete rewrite of each component, offering extensibility, accessibility, and a modern look and feel.

The worklist is still using the old `@ohif/ui` library, but it will be migrated to `@ohif/ui-next` in a future release.

## Migration Guide

You'll generally need to update your custom panels to use the new `@ohif/ui-next` components.

The task is to find the direct mapping of the components you're using in your custom panels.

This guide will cover the migration for them.
