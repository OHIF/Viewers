---
sidebar_position: 7
sidebar_label: Color System
title: Color System Migration
summary: 3.13 continues the migration from legacy color classes to the ui-next semantic color system. This guide maps legacy color names to their ui-next equivalents and shows common text, background, and border replacements.
---

# Color System Migration

This guide covers migrating from legacy color classes to the new ui-next color system.

## Current State (3.13+)

The OHIF Viewer is now built entirely with ui-next components, which use the [new color system](/colors-and-theming). The legacy components in `platform/ui` remain on the old color system. For reference, the table below maps the legacy colors to their ui-next equivalents.

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

> **Note:** The legacy variables left blank in the table above (`secondary-main`, `primary-main`, `common-dark`, and `customblue`) have no direct ui-next equivalent. If your code uses any of these, replace them case by case, choosing the semantic token that best fits how the color is used in each component.

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
