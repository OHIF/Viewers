# AGENTS.md

This file provides guidance to AI coding agents (Claude, Codex, and other LLM tools) when working with code in this repository.

## Project Overview

This is **OHIF** v3  (Open Health Imaging Foundation) - a medical imaging viewer. It's an extensible web imaging platform.
## Development Commands

### Main Development
```bash
# Start development server for all packages
pnpm run dev
```

### Building
```bash
# Build all packages for production
pnpm run build

# Build the main viewer app
pnpm --filter @ohif/app run build:viewer
```

## Architecture Overview

### Monorepo Structure
- **`platform/`** - Core OHIF infrastructure
  - `app/` - Main viewer application (`@ohif/viewer`)
  - `core/` - Core services and utilities
  - `ui-next/` - Modern UI component library
- **`extensions/`** - Modular functionality plugins
- **`modes/`** - Application workflow configurations

### Key Extension Architecture

**Extension System**: Each extension exports modules (viewports, tools, panels, commands) that the app dynamically loads. Extensions are self-contained with their own rspack builds (`.rspack/rspack.prod.js` against the shared root `.rspack/rspack.base.js`).


**Core Extensions:**
- `cornerstone/` - Medical image rendering engine
- `cornerstone-dicom-pmp/` - DICOM PMP support
- `cornerstone-dicom-seg/` - DICOM Segmentation support
- `cornerstone-dicom-sr/` - DICOM SR support
- `dicom-pdf/` - DICOM PDF support
- `dicom-video/` - DICOM Video support
- `measurement-tracking/` - Measurement tracking support
- `default/` - Standard OHIF functionality

### Service-Oriented Design (PUB-SUB)

The app uses a Services Manager pattern with these core services:
- **Display Set Service**: Manages image series organization
- **Measurement Service**: Handles annotations and measurements
- **Hanging Protocol Service**: Controls image layout and display rules
- **UI Service**: Manages panels, modals, and notifications
- **Segmentation Service**: AI/ML powered image segmentation, loading segmentations, etc.
- **Viewport Grid Service**: Manages viewport layout and display rules
- **Viewport Display Set History Service**: Manages viewport display set history
- **Viewport Dialog Service**: Manages viewport dialogs
- **Notification Service**: Manages notifications
- **Modal Service**: Manages modals
- **Dialog Service**: Manages dialogs, more general not just viewport dialogs
- **Customization Service**: Manages customization of the app
- **Toolbar Service**: Manages the toolbar, viewport action corners, tool states
- **User Authentication Service**: Manages user authentication, but used only for injecting tokens in dicomweb requests in our context
- **Panel Service**: Manages side panels
- **Cornerstone Viewport Service**: Manages the cornerstone viewport, rendering engines, presentation states, more tightly coupled to cornerstone than the other services
- **Tool Group Service**: Manages tool groups, creating and managing tool groups, etc.
- **Sync Group Service**: Manages sync groups, syncing zooming, panning, scrolling, etc.
- **Cornerstone Cache Service**: Manages the cornerstone cache, caching images, etc.

Most of the services utilize a pub sub architecture and extend the pub sub service interace at `pubSubServiceInterface.ts`

### Commands Manager

The Commands Manager tracks named commands (or functions) that are scoped to
a context. When we attempt to run a command with a given name, we look for it
in our active contexts, in the order specified.
If found, we run the command, passing in any application
or call specific data specified in the command's definition.

You can call `commandsManager.runCommand` to run a command.

### Extension Manager

Aggregates and exposes extension modules throughout the OHIF application, manages data sources, and provides a centralized registry for accessing extension functionality.

### Build System

**pnpm Workspaces**: monorepo management (`pnpm-workspace.yaml`: `platform/*`, `extensions/*`, `modes/*`)
**Rsbuild (rspack-based)**: a single app build pipeline — repo-root `rsbuild.config.ts` — serves both production (`pnpm run build`) and dev (`pnpm run dev:fast`), gated on `NODE_ENV`. Custom rspack plugins (e.g. the service-worker manifest injector) are registered through `tools.rspack`. Per-package UMD builds stay raw rspack (`.rspack/rspack.prod.js`). `webpack-merge` and `@svgr/webpack` are kept deliberately — both are rspack-compatible despite the names.
**Plugin Import System**: there is NO module federation. Extensions and modes declared in `platform/app/pluginConfig.json` are statically compiled into the app bundle: `platform/app/.rspack/writePluginImportsFile.js` generates `pluginImports.js` at build time. Runtime (no-rebuild) extensions are prebuilt UMD bundles declared in `window.config.extensions[]` and loaded by the same generated loader — also not module federation.

### Key Technologies

- **React 18 + TypeScript**: UI framework
- **Cornerstone.js**: Medical image rendering
- **DICOM**: Medical imaging standard support
- **ONNX Runtime**: AI model inference (SAM segmentation models)
- **Zustand**: State management
- **TailwindCSS**: Styling system

## Development Patterns

### Adding New Tools
1. Create tool class in `extensions/cornerstone/src/tools/`
2. Register in tool module's `toolNames.ts`
3. Add to toolbar via `getToolbarModule.tsx`
4. Add measurement mapping if needed in `measurementServiceMappings/`

### Creating Extensions
Extensions must export:
- `id.js` - Unique extension identifier
- `index.tsx` - Extension registration
- Module functions (`getToolbarModule`, `getViewportModule`, etc.)

### Viewport Customization
Custom viewports extend base Cornerstone viewport:
- Override render methods for custom overlays
- Implement measurement tracking
- Add viewport-specific tools and interactions

### Service Integration
Register services in extension's `servicesManager.registerService` and access via:
```javascript
const { MeasurementService } = servicesManager.services;
```

### Creating stores
To create a store, you can make one in your extension's `stores/` directory, and you can follow the example of an existing store such as `useLutPresentationStore.ts` or `useSynchronizersStore.ts`.

### Creating hooks
To create a hook, you can make one in your extension's `hooks/` directory, and you can follow the example of an existing hook such as `usePatientInfo.tsx`.

### Creating providers
To create a provider, you can make one in your extension's `providers/` or `contexts/` directory, and you can follow the example of an existing provider such as `ViewportGridProvider.tsx`.

### Adding new icons
To add a new icon, you can add it to the `icons/` directory, then register the icon using `import { addIcon } from '@ohif/extension-default/src/utils'`

### Creating synchronizers
You can create custom synchronizers and place them in the `synchronizers/` directory, you can follow the example of `frameViewSynchronizer.ts`

### Utilites
Any new utilites should be placed in the `utils/` directory, and you can follow the example of `formatPN.ts`

### Commands
Commands are created in the commandsModule of the extension, for example the cornerstone extension has `commandsModule.tsx`, sometimes its also named `getCommandsModule.tsx.`

### Overriding OHIF Components

To override an OHIF component, you can create a new component in your extension's `components/` directory, then import it instead of the original ui-next component.

### Mode layout

The layoutTemplate is a function that returns a layout object, you can follow the example of `longitudinal/src/index.ts`. This would be helpful when you need to override a component as you can know where to look for the original component.

### Pub Sub
Always prioritrize pub sub, by calling a services subscribe over useEffects as it's more reliable, for example

```ts
  useEffect(() => {
    const subscriptions = [
      cornerstoneViewportService.subscribe(EVENTS.VIEWPORT_DATA_CHANGED, handleViewportDataChanged),
      syncGroupService.subscribe(EVENTS.VIEWPORT_REMOVED, onHotKeyRemoval),
      syncGroupService.subscribe(EVENTS.VIEWPORT_ADDED, onHotKeyAddition),
    ];

    return () => {
      subscriptions.forEach(({ unsubscribe }) => unsubscribe());
    };
  }, []);
```

### Never modify core architecture
Do not modify the core and always find a way to implement the solution via the extensions and modes, only modify core as a last resort if all other fail or there's an architectural constraint.

## Skills

The `ohif-test-agent` skill (Playwright E2E test guidance) lives at `.agents/skills/ohif-test-agent/`.

## Configuration

### Plugin Configuration
Extensions and modes are explicitly declared in `platform/app/pluginConfig.json` (validated against a JSON Schema at config load — no auto-discovery) and statically imported at build time via the generated `pluginImports.js`.

### Extension Contract (v1 summary)

- An extension/mode is an npm package whose **`id` equals its package name**; `src/index.tsx` default-exports `{ id, preRegistration?, get*Module…, onModeEnter?, onModeExit? }`.
- Third-party packages build a **single UMD bundle**: `output.library = { name: pkg.name, type: 'umd', export: 'default' }` → runtime global `window['@scope/name']`.
- **Never bundle host-provided packages.** The canonical externals list is `.rspack/pluginExternals.js`: `react`, `react-dom`, `react/jsx-runtime`, `@ohif/*`, `@cornerstonejs/*`, `dcmjs`, `gl-matrix`, `vtk.js`. The host exposes these as globals via `platform/app/src/runtimeShared.ts`.
- Working-tree `package.json` entries point at `src/*`; `publishConfig` rewrites them to `dist/*` in the tarball — **publish with `pnpm publish` only** (the npm CLI ignores the rewrites).
- Keywords `ohif-extension` / `ohif-mode` are the discovery convention.
- Scaffold with `pnpm create ohif`; manage `platform/app/pluginConfig.json` by hand or with `pnpm run plugin add|remove|list|link|unlink|doctor`.
- Register at build time via `pluginConfig.json`, or at runtime via a `window.config.extensions[]` descriptor (`{ packageName, importPath, globalName?, coreVersionRange?, integrity?, styles? }`).

## Medical Imaging Specifics

### DICOM Support
- Multi-format: CT, MRI, X-Ray, Mammography, Ultrasound
- SOP Class handlers for specialized DICOM types (RT, SEG, SR)
- DICOMweb protocol for web-based image retrieval

### Hanging Protocols
Define how images are arranged and displayed:
- Located in `hps/` directories
- JSON configuration with viewport rules
- Support for priors comparison and multi-monitor layouts

### Measurement Tools
- Cornerstone Tools integration for annotations
- Bidirectional measurements, polylines, annotations
- Export capabilities (DICOM SR, CSV reports)
- AI-assisted measurements via ONNX models
