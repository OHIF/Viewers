---
sidebar_position: 2
sidebar_label: Color System
---

# Color System Migration

This guide covers migrating from legacy color classes to the new ui-next color system.

## Current State (v3.12 Release)

The Viewer portion of the application has been updated to use the new ui-next color system. However, legacy UI components (located in `platform/ui`) still use legacy colors. Notably, the Study List (Worklist) continues to use legacy UI components and colors. All other parts of the application have been migrated to ui-next.

## Color Mapping Reference

| Legacy Color      | Updated color (ui-next) |
| ----------------- | ----------------------- |
| `bkg-low`         | `background`            |
| `common-bright`   | `foreground` (various)  |
| `primary-light`   | `highlight`             |
| `inputfield-main` | `input`                 |
| `secondary-light` | `input`                 |
| `primary-dark`    | `muted`                 |
| `bkg-med`         | `muted`                 |
| `aqua-pale`       | `muted-foreground`      |
| `secondary-dark`  | `popover`               |
| `primary-active`  | `primary`               |
| `actions-primary` | `primary`               |
| `secondary-main`  |                         |
| `primary-main`    |                         |
| `common-dark`     |                         |
| `customblue`      |                         |

## Generic Color Migrations

Avoid using generic color values. Use semantic colors instead:

| Generic Color                | Semantic Replacement    |
| ---------------------------- | ----------------------- |
| `white`                      | `foreground`            |
| `blue-*` (e.g., `blue-500`)  | `primary` or `highlight`|
| `gray-*` (e.g., `gray-800`)  | `muted` or `popover`    |
| `red-*`                      | `destructive`           |

> **Note:** `black` is still used in certain cases to replace default browser backgrounds and to match imaging backgrounds.

## Common Migrations

### Text Colors

```diff
- text-white
+ text-foreground

- text-primary-light
+ text-highlight

- text-primary-active
+ text-primary

- text-secondary-light
+ text-muted-foreground
```

### Background Colors

```diff
- bg-primary-dark
+ bg-muted

- bg-secondary-dark
+ bg-popover

- bg-black
+ bg-background
```

### Border Colors

```diff
- border-secondary-light
+ border-input

- border-primary-light
+ border-highlight

- border-primary-dark
+ border-muted
```

## Important Notes

- Legacy colors without a mapping (empty cells) should be evaluated on a case-by-case basis
- The new color system uses CSS variables, enabling future theme support
- When migrating, test components visually to ensure proper contrast and accessibility
