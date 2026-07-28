---
id: index
sidebar_position: 1
sidebar_label: 3.13 -> 3.14
title: 3.13 to 3.14 Migration Guide
---

import DocCardList from '@theme/DocCardList';

# 3.13 to 3.14 Migration Guide

This guide covers changes when upgrading from OHIF version 3.13 to version 3.14.

- **[Display set storage](./display-set-store.md)** — display sets now live in
  the `@cornerstonejs/metadata` typed metadata cache.
  `DisplaySetService.getDisplaySetCache()` is deprecated and returns a
  read-only snapshot.

<DocCardList />
