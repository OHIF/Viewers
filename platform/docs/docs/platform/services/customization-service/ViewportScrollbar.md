---
title: Viewport Scrollbar Customization
summary: Documentation for configuring OHIF viewport scrollbar behavior, including progress vs legacy mode, loaded/viewed tracking visuals, loading pattern behavior, timing controls, and viewportScrollbar.indicator (size + optional custom thumb).
sidebar_position: 7
---

# Viewport Scrollbar

The viewport scrollbar customization controls whether OHIF uses:

- the new progress-based scrollbar (`viewportScrollbar.variant: 'progress'`), or
- the legacy range-input scrollbar (`viewportScrollbar.variant: 'legacy'`).

When using `'progress'`, stack and acquisition-plane volume viewports run in full progress mode (fills/endpoints/loading options apply), while other slice-capable viewports run in minimal mode (indicator only).

import { viewportScrollbarCustomizations, TableGenerator } from './sampleCustomizations';

{TableGenerator(viewportScrollbarCustomizations)}
