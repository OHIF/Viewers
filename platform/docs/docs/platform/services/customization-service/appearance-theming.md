---
sidebar_position: 2
sidebar_label: Appearance & Theming
title: Appearance & Theming
summary: Documentation for OHIF's appearance and theming system, including theme presets, custom themes, URL-based theme selection, and how to enable the Appearance dialog for your deployment.
---

# Appearance & Theming

OHIF includes an optional theming system that lets users switch between visual
theme presets, apply custom CSS token overrides, and share themes via URL. The
system is **not enabled by default** — deployers opt in by adding a single
configuration line.

## Enabling the Theme Module

The theming system is delivered as a customization module in the default
extension. To enable it, add the module reference to the `customizationService`
array in your configuration file:

```js
window.config = {
  // ...
  customizationService: [
    '@ohif/extension-default.customizationModule.theme',
  ],
  // ...
};
```

This single line activates the entire theming system:

- The **Appearance** menu item appears in the viewer header and study list
  settings
- Users can switch between theme presets via a dropdown
- The active theme persists across sessions via `localStorage`
- Themes can be applied via URL parameter (`?theme=orchid`)
- Custom CSS token overrides can be pasted and applied

### What Happens Without It

When the theme module is not in the configuration:

- No Appearance menu item is shown anywhere in the UI
- No theme provider is mounted in the component tree
- URL parameters like `?theme=orchid` have no effect
- No `localStorage` keys are read or written
- Zero runtime footprint — the theming code does not execute

This opt-in design ensures that deployments that don't need theming pay no cost
for it.

## Theme Presets

OHIF ships with six built-in theme presets organized into two families:

### Tonal Presets

Tonal presets introduce a color hue throughout the interface — backgrounds,
borders, and surfaces all carry the theme's signature color.

| Preset | Description |
|--------|-------------|
| **Orchid** | Purple/violet tones with warm highlights |
| **Arctic** | Cool blue tones with icy surfaces |
| **Verdant** | Green tones with natural, earthy surfaces |

### Neutral Presets

Neutral presets keep surfaces achromatic (grays and blacks) and use color only
for interactive elements and highlights.

| Preset | Description |
|--------|-------------|
| **Midnight** | Deep blacks with subtle gray layering |
| **Slate** | Cool neutral grays with blue highlights |
| **Deep** | Rich dark surfaces with minimal contrast |

### Selecting a Preset

Open the Appearance dialog from the header menu (or study list settings) and
choose a preset from the Theme dropdown. The theme applies immediately and
persists across sessions.

## URL-Based Theme Selection

Themes can be applied via URL parameter, which is useful for sharing links with a
specific visual configuration:

```
https://your-ohif-instance.com/viewer?theme=orchid
```

Valid values are any preset name: `default`, `orchid`, `arctic`, `verdant`,
`midnight`, `slate`, `deep`.

The URL parameter takes precedence over the stored theme. When a URL theme is
applied, it is also saved to `localStorage` so the user's session continues with
that theme after navigation.

:::note
The `custom` theme value is deliberately not URL-addressable. Custom themes rely
on CSS stored in the user's `localStorage`, so a `?theme=custom` link would land
the app in a state with no CSS behind it.
:::

## Custom Themes

The Appearance dialog includes a custom theme feature that allows pasting CSS
variable overrides directly into the viewer.

### How It Works

1. Open the Appearance dialog
2. Click **Custom Theme** to expand the text area
3. Paste CSS variable declarations (one per line):
   ```css
   --background: 270 45% 6%;
   --foreground: 280 15% 96%;
   --card: 268 40% 10%;
   --primary: 270 85% 65%;
   --border: 268 30% 18%;
   ```
4. Click **Apply**

The viewer parses the variables and injects them as CSS overrides into both
`:root` and `.dark` selectors. Invalid lines are silently skipped. If no valid
variables are found, the Apply button shows an error message.

Click **Clear** to remove the custom theme and return to the default appearance.

### Token Format

Theme tokens use **HSL triplets without the `hsl()` wrapper** — just the three
space-separated values:

```
--token-name: hue saturation% lightness%;
```

For example: `--primary: 270 85% 65%` represents a purple hue at 85% saturation
and 65% lightness.

### Available Tokens

The theming system uses the same token set as the base OHIF design system. The
most commonly customized tokens are:

| Token | Purpose |
|-------|---------|
| `--background` | Page/viewport background |
| `--foreground` | Default text color |
| `--card` | Surface color for cards and panels |
| `--popover` | Elevated surface color (dropdowns, tooltips) |
| `--primary` | Primary interactive color (buttons, links) |
| `--secondary` | Secondary surface color |
| `--muted` | Subdued background areas |
| `--muted-foreground` | Subdued text color |
| `--accent` | Accent surface color |
| `--border` | Border color |
| `--input` | Input field background |
| `--ring` | Focus ring color |
| `--highlight` | Highlight/selection color |
| `--destructive` | Error/destructive action color |

Each token also has a corresponding `-foreground` variant for text on that
surface (e.g., `--card-foreground`, `--primary-foreground`).

## Preset File Format

Theme presets are defined as JSON files in
`platform/ui-next/src/themes/`. Each file follows this structure:

```json
{
  "name": "orchid",
  "label": "Tonal: Orchid",
  "cssVars": {
    "dark": {
      "highlight": "292 75% 62%",
      "background": "270 45% 6%",
      "foreground": "280 15% 96%",
      "card": "268 40% 10%",
      "primary": "270 85% 65%",
      "border": "268 30% 18%"
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `name` | Internal identifier. Must be unique and URL-safe. Used as the CSS class name (`theme-{name}`) and `?theme=` value. |
| `label` | Display label shown in the Appearance dialog dropdown. |
| `cssVars.dark` | Object mapping token names to HSL triplet values. Only tokens that differ from the default theme need to be specified. |

The corresponding CSS class is defined in `platform/ui-next/src/themes/themes.css`
and applies the token overrides when the class is added to `document.body`.

## Adding a Theme Preset

To add a new preset to the Appearance dialog dropdown, three files need to be
updated:

### 1. Create the JSON file

Add a new JSON file in `platform/ui-next/src/themes/`. Use an existing preset as
a template:

```json
{
  "name": "ember",
  "label": "Tonal: Ember",
  "cssVars": {
    "dark": {
      "highlight": "15 85% 55%",
      "background": "12 40% 5%",
      "foreground": "20 15% 96%",
      "card": "10 35% 9%",
      "primary": "15 80% 50%",
      "border": "12 25% 16%"
    }
  }
}
```

The `name` must be unique and URL-safe — it becomes the CSS class name
(`theme-ember`) and the `?theme=` URL value. Only include tokens that differ from
the default theme.

### 2. Add the CSS class to `themes.css`

Add a corresponding class in `platform/ui-next/src/themes/themes.css` with the
same token values:

```css
/* ─── Tonal: Ember ──────────────────────────────────────────────────── */

.theme-ember {
  --highlight: 15 85% 55%;
  --background: 12 40% 5%;
  --foreground: 20 15% 96%;
  --card: 10 35% 9%;
  --primary: 15 80% 50%;
  --border: 12 25% 16%;
  /* ... all tokens from the JSON */
}
```

:::note
The JSON and CSS must define the same tokens with the same values. The JSON is
used for metadata (name, label) and validation. The CSS is what actually applies
the theme at runtime via the body class.
:::

### 3. Register in the barrel export

Import the JSON file and add it to the `themePresets` array in
`platform/ui-next/src/themes/index.ts`:

```ts
import orchid from './orchid.json';
import arctic from './arctic.json';
import verdant from './verdant.json';
import midnight from './midnight.json';
import slate from './slate.json';
import deep from './deep.json';
import ember from './ember.json';    // add import

export const themePresets: ThemePreset[] = [
  orchid, arctic, verdant, midnight, slate, deep, ember   // add to array
];
```

The order of the array determines the order in the dropdown menu.

## Removing a Theme Preset

To remove a preset, reverse the three steps above:

1. **Remove from `index.ts`** — delete the import and remove it from the
   `themePresets` array
2. **Remove from `themes.css`** — delete the `.theme-{name}` class block
3. **Delete the JSON file** — remove the file from `platform/ui-next/src/themes/`

Users who had the removed theme active will fall back to the default theme on
their next visit — the provider validates stored theme names against the current
preset list and resets invalid values.

## Architecture

### How the Provider Registers

The theming system uses OHIF's `serviceProvidersManager` to register its React
provider dynamically. During app initialization, the default extension's
`preRegistration` hook checks whether the theme module is present in the
configuration. If it is, `ActiveThemeProvider` is registered into the component
tree:

```
App initializes
  → Default extension's preRegistration runs
    → Checks config for 'customizationModule.theme'
    → If present: registerProvider('activeTheme', ActiveThemeProvider)
  → App.tsx builds the provider tree
    → Picks up registered providers automatically
```

App.tsx has no knowledge of theming. The extension that provides the theme module
also decides whether to register its provider.

### How the Menu Item Appears

The Appearance menu item is gated by the customization service. Both the viewer
header (`ViewerHeader.tsx`) and the study list settings
(`StudyListSettingsPopover.tsx`) call:

```tsx
const AppearanceModal = customizationService.getCustomization('ohif.appearanceModal');
```

If the customization is not registered (because the theme module wasn't enabled),
the call returns `undefined` and no menu item is rendered.

### State Management

`ActiveThemeProvider` manages theme state via React context:

- **Active theme**: stored in component state and `localStorage` (`ohif:theme`)
- **Custom CSS**: stored in component state and `localStorage` (`ohif:custom-theme-css`)
- **CSS classes**: applied to `document.body` (`theme-{name}`)
- **Custom styles**: injected via a `<style>` element (`#ohif-custom-theme`)

The `useActiveTheme()` hook exposes the full API:

```tsx
const {
  activeTheme,       // Current theme name ('default', 'orchid', 'custom', etc.)
  setActiveTheme,    // Switch to a named preset
  customCss,         // Raw custom CSS text
  applyCustomTheme,  // Parse and apply custom CSS, returns boolean
  clearCustomTheme,  // Remove custom theme, revert to default
} = useActiveTheme();
```

## Configuration Reference

### Minimal Setup

```js
window.config = {
  customizationService: [
    '@ohif/extension-default.customizationModule.theme',
  ],
};
```

### With Other Customization Modules

The theme module can be combined with other customization modules:

```js
window.config = {
  customizationService: [
    '@ohif/extension-default.customizationModule.theme',
    '@ohif/extension-cornerstone-dicom-seg.customizationModule.dicom-seg-sorts',
  ],
};
```

### Setting a Default Theme via URL

To link directly to a themed viewer session:

```
https://your-ohif-instance.com/viewer?StudyInstanceUIDs=1.2.3&theme=arctic
```

The theme parameter works alongside all other URL parameters.
