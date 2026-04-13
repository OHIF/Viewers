---
title: Viewport Scrollbar Customization
summary: Documentation for configuring OHIF viewport scrollbar behavior, including progress vs legacy mode, loaded/viewed tracking visuals, loading pattern behavior, timing controls, and viewportScrollbar.indicator (size + optional custom indicator).
sidebar_position: 7
---

# Viewport Scrollbar

The viewport scrollbar customization controls whether OHIF uses:

- the new progress-based scrollbar (`viewportScrollbar.variant: 'progress'`), or
- the legacy range-input scrollbar (`viewportScrollbar.variant: 'legacy'`).

When using `'progress'`, stack and acquisition-plane volume viewports run in full progress mode (fills/endpoints/loading options apply - see below), while other slice-capable viewports run in minimal mode (indicator only).

## Advanced: `viewportScrollbar.indicator` {#viewport-scrollbar-indicator-advanced}

`viewportScrollbar.indicator` sets the progress indicator’s **outer size** (`totalWidth`, `totalHeight`, border included) and a **`renderIndicator`** function. The platform passes **`React`** into `renderIndicator` so the same shape works from plain **`window.config`** files (use `React.createElement` there instead of JSX). If **`totalWidth`**, **`totalHeight`**, and **`renderIndicator`** are not all valid, the default pill indicator is used.

For richer UI, declare the override in an extension **`getCustomizationModule`** (or another **`.tsx`** module) where you can return real JSX from `renderIndicator`.

To read layout while drawing the indicator (track size, loading state, **`isDragging`**, etc.), use **`useSmartScrollbarLayoutContext`** from `@ohif/ui-next` inside a **small React component** that you return from `renderIndicator` (for example `return <MyIndicator />` or `React.createElement(MyIndicator)`). **Do not** call that hook directly in the `renderIndicator` function body: that function is not a component render, so hooks would break the rules of React.

import { viewportScrollbarCustomizations, TableGenerator } from './sampleCustomizations';

{TableGenerator(viewportScrollbarCustomizations)}
