---
sidebar_position: 2
sidebar_label: Platform conventions (EARS)
title: Platform conventions — requirements
summary: The low-level contract underneath the layout — module types and addressing, extension and mode lifecycle, layering boundaries, commands, toolbar mechanics, display-set routing, customization scopes, services, and file placement.
---

# Platform conventions — requirements

**Prefix:** `PC` — see the [specification register](../index.md#1-index-of-component-specifications).
**Status:** Draft for review — requirements only.
**Layer above:** [Extensions and modes (`EM`)](./requirements.md) specifies the layout and which region a control belongs in. This document specifies the mechanisms that make those placements expressible and reusable.

---

## 1. Purpose

[Extensions and modes (`EM`)](./requirements.md) says *what the default extensions and modes set
up*: the regions of the layout, and what belongs in each. It says nothing about how a
contribution is declared, addressed, or wired.

This document is that lower layer. It is deliberately mechanical — module types, identifiers,
option precedence, scopes, lifecycle. It exists so that `EM` can say "the tool sections appear in
the top menu bar" without also having to explain what a section is, how a button is declared, or
who may reorder it.

It is opinionated in the same way: where OHIF today supports several ways of doing something, it
names the one that is correct for new code, and `PC-CNF` says what happens to the rest.

**Read `EM` first.** A requirement here is about form. If you are deciding *where* something
goes, the answer is in `EM`.

## 2. Scope

### 2.1 In scope

- Extension structure, registration, and lifecycle.
- The module types, their naming, and their addressing.
- Mode structure, composition, and lifecycle.
- Layering boundaries between `platform/core`, `platform/ui-next`, extensions, and modes.
- Commands: where they are defined, how options are specified, and how they are invoked.
- Toolbar mechanics: button definitions, sections, evaluators, and custom renderers.
- Display-set routing: how a display set reaches a viewport component.
- Layout, panel, and hanging-protocol declaration mechanics.
- The customization service: scopes, composition, and what must be customizable.
- Services and events.
- File and directory placement.

### 2.2 Out of scope

| Out of scope | Why |
| --- | --- |
| Which region of the layout a control belongs in | Specified by [`EM`](./requirements.md). This document only requires that the mechanisms make every `EM` placement expressible (`PC-UIP-1`). |
| The build system, module federation, and `pluginConfig.json` | Mechanical; changing it does not change what an extension may define. |
| Data source implementation | A separate concern with its own conformance surface; only its *registration* is covered (`PC-MOD-1`). |
| The behaviour of any particular extension | This document constrains form, not function. Behaviour belongs in a component specification such as `RS`. |
| Migration of existing extensions | `PC-CNF` states what happens to non-conforming code; the schedule is a design and planning matter. |
| Styling and visual design | Not specified here at all. |

### 2.3 Relationship to existing guidance

`AGENTS.md` / `CLAUDE.md` in the repository root carries the same guidance informally. Where the
two differ, this specification is the one to change, and the informal guidance should be updated
to point at it.

## 3. Definitions

| Term | Definition |
| --- | --- |
| **Extension** | A package that contributes modules to the application. It has an id and no knowledge of which mode is running. |
| **Mode** | A named workflow that composes extensions into routes, layouts, toolbars, and tool groups. It contains no rendering, tool, or DICOM logic. |
| **Module type** | One of the fixed kinds of contribution an extension can make. See `PC-MOD-1`. |
| **Module entry** | One named item returned by a module function. |
| **Module id** | The addressable identifier of a module entry: `` `${extensionId}.${moduleType}.${name}` ``. |
| **Command** | A named, context-scoped function invoked through the commands manager with a single options object. |
| **Section** | A named, ordered list of toolbar button ids. |
| **Evaluator** | A registered function that computes a toolbar button's enabled, active, and hidden state for a viewport. |
| **Customization** | A keyed value resolved at read time from the Default, Mode, and Global scopes. |
| **Surface** | A place in the UI where controls appear: top menu bar, sidebar, viewport action menu, modal, notification. |

---

## 4. Requirements

EARS patterns used: **ubiquitous** (`The system shall …`), **event-driven** (`WHEN … the system
shall …`), **state-driven** (`WHILE … the system shall …`), **optional feature** (`WHERE … the
system shall …`), and **unwanted behaviour** (`IF … THEN the system shall …`).

*The system* means the OHIF Viewer application. Requirements addressed to authors are written as
constraints the system imposes: "An extension shall …" is enforced by review, lint, or type,
and `PC-CNF` says which.

### 4.1 Extension structure and lifecycle — `PC-EXT`

**PC-EXT-1**
Every extension shall export an `id` that is unique across the application.

**PC-EXT-2**
An extension shall expose functionality only through the module functions of `PC-MOD-2`,
`preRegistration`, `onModeEnter`, and `onModeExit`.

**PC-EXT-3**
WHEN an extension is registered, the system shall call `preRegistration` before any module
function of that extension.

**PC-EXT-4**
An extension shall register its services, and only its services and app-config-derived setup,
from `preRegistration`.

**PC-EXT-5**
A module function shall have no side effect other than constructing and returning the module it
describes.

> **Note (PC-EXT-5):** Module functions are called during registration and may be called again.
> Registering a subscription, mutating a service, or creating a tool group inside
> `getToolbarModule` is the single most common source of duplicated state.

**PC-EXT-6**
IF an extension requires work to be performed when a mode is entered, THEN it shall perform that
work in `onModeEnter` and shall reverse it in `onModeExit`.

**PC-EXT-7**
An extension shall not assume it is the only extension contributing entries of a given module
type.

**PC-EXT-8**
An extension shall not require any particular mode to be active.

**PC-EXT-9**
An extension shall declare its OHIF and third-party dependencies in its `package.json`.

**PC-EXT-10**
A module function shall receive `servicesManager`, `commandsManager`, and `extensionManager` as
parameters, and shall not obtain them from module-level or global state.

### 4.2 Module types and addressing — `PC-MOD`

**PC-MOD-1**
The system shall support exactly the following module types, and shall treat the set as closed.

| Module type | Function | Contributes |
| --- | --- | --- |
| `commandsModule` | `getCommandsModule` | Named commands and their context |
| `customizationModule` | `getCustomizationModule` | Default-scope customization values |
| `dataSourcesModule` | `getDataSourcesModule` | Data source implementations |
| `panelModule` | `getPanelModule` | Side panels |
| `sopClassHandlerModule` | `getSopClassHandlerModule` | Display-set creation from instances |
| `toolbarModule` | `getToolbarModule` | Button renderers and evaluators |
| `viewportModule` | `getViewportModule` | Viewport components |
| `layoutTemplateModule` | `getLayoutTemplateModule` | Page layouts |
| `hangingProtocolModule` | `getHangingProtocolModule` | Hanging protocols |
| `contextModule` | `getContextModule` | React contexts |
| `stateSyncModule` | `getStateSyncModule` | State synchronization slices |
| `utilityModule` | `getUtilityModule` | Shared utilities exposed across extensions |

**PC-MOD-2**
Each module type shall be provided by a function named `get<ModuleType>` exported from the
extension's entry point.

**PC-MOD-3**
Every module entry shall carry a `name` that is unique within its extension and module type.

**PC-MOD-4**
The system shall address every module entry as `` `${extensionId}.${moduleType}.${name}` ``.

**PC-MOD-5**
A mode or extension shall reference another extension's contribution by module id, and shall not
import its implementation.

**PC-MOD-6**
WHERE a module entry is intended to be referenced by other packages, the system shall provide a
named exported constant carrying its module id, so that consumers do not repeat the string
literal.

**PC-MOD-7**
IF a capability does not fit any module type in `PC-MOD-1`, THEN it shall be expressed as a
command, a customization, or a service, and shall not motivate a new module type without a core
change justified under `PC-BND-4`.

### 4.3 Mode structure and composition — `PC-MODE`

**PC-MODE-1**
A mode shall export a default object carrying `id`, `modeInstance`, and `extensionDependencies`.

**PC-MODE-2**
A mode instance shall declare at least `id`, `routeName`, `displayName`, `routes`, and
`extensions`.

**PC-MODE-3**
A mode shall declare every extension it uses in `extensionDependencies`.

**PC-MODE-4**
A mode shall contain composition only, and shall contain no rendering, tool, DICOM, or
data-access logic.

**PC-MODE-5**
WHERE a mode is a variant of an existing mode, it shall be composed by spreading that mode's
exported instance, layout, and route objects, and shall not be created by copying them.

**PC-MODE-6**
A mode shall express its applicability to a study through `isValidMode` and declarative
properties, and shall not inspect instance metadata directly.

**PC-MODE-7**
A mode shall remove in `onModeExit` every subscription, tool group, and service registration it
created in `onModeEnter`.

**PC-MODE-8**
WHEN a mode is exited, the system shall return every service the mode initialized to its
pre-entry state.

**PC-MODE-9**
A mode shall express toolbar composition, tool-group composition, and panel placement as data
rather than as imperative setup.

**PC-MODE-10**
A mode's route shall declare its layout by naming a `layoutTemplateModule` id, and shall supply
that layout's content as props.

**PC-MODE-11**
A mode shall not import from another package's internal paths.

### 4.4 Layering boundaries — `PC-BND`

**PC-BND-1**
`platform/core` shall not import from any extension, any mode, or any rendering library.

**PC-BND-2**
`platform/ui-next` shall not import from any extension, any mode, or any service.

**PC-BND-3**
An extension shall interact with another extension only through module ids, commands, services,
customizations, and events.

**PC-BND-4**
A capability shall be implemented in an extension or a mode unless an architectural constraint
prevents it.

**PC-BND-5**
IF a capability requires a change to `platform/core`, THEN that change shall be additive, shall
not alter existing behaviour, and shall be justified in the pull request against `PC-BND-4`.

**PC-BND-6**
A UI component shall invoke application behaviour through commands, and shall call a service
directly only to read state.

> **Note (PC-BND-6):** Reading through hooks and services is normal. Writing through commands is
> what makes a behaviour reachable from a hotkey, a toolbar button, a context menu, a workflow
> step, and a test without being reimplemented at each call site.

**PC-BND-7**
A React component shall not own application data that a service can own.

### 4.5 Commands — `PC-CMD`

**PC-CMD-1**
Commands shall be defined in the owning extension's `commandsModule`.

**PC-CMD-2**
A commands module shall return `actions`, `definitions`, and `defaultContext`.

**PC-CMD-3**
Every command shall accept a single options object as its only parameter.

**PC-CMD-4**
Command options shall be named properties, and shall not be positional.

**PC-CMD-5**
A command shall be invocable with no options supplied, and shall resolve its defaults from
services.

**PC-CMD-6**
WHERE a command acts on a viewport, it shall accept `viewportId` and shall default to the active
viewport when `viewportId` is absent.

**PC-CMD-7**
The system shall merge command options in the following precedence, lowest first:

1. `options` declared on the command definition in the commands module;
2. options supplied at invocation time by the caller of `run`;
3. `commandOptions` declared in the command specification being run.

> **Note (PC-CMD-7):** Layers 2 and 3 are the surprising pair. A toolbar button declaring
> `commandOptions: { viewportId: 'x' }` overrides the `viewportId` the toolbar injects at
> invocation. Declared options are the more specific statement and win.

**PC-CMD-8**
A command specification shall be expressible as a command name, an object carrying
`commandName`, `commandOptions`, and `context`, or an array of either.

**PC-CMD-9**
A command shall return its result, and shall not communicate its result by mutating an object
supplied by the caller.

**PC-CMD-10**
A command name shall be unique within its context and shall begin with a verb.

**PC-CMD-11**
WHERE the same command name exists in more than one context, the system shall resolve it in
active-context order.

**PC-CMD-12**
IF a command is not found in any active context, THEN the system shall log a warning identifying
the command name and shall not throw.

**PC-CMD-13**
Every behaviour reachable from a toolbar button, a hotkey, a context menu, a panel action, or a
workflow step shall be reachable as a command.

**PC-CMD-14**
A command shall not render UI directly, and shall request UI through the dialog, modal,
notification, or viewport-dialog services.

### 4.6 Toolbar — `PC-TBR`

**PC-TBR-1**
A toolbar button shall be declared as data carrying `id`, `uiType`, and `props`.

**PC-TBR-2**
A button's `props` shall carry its `icon`, `label`, `tooltip`, `commands`, and `evaluate`.

**PC-TBR-3**
A button's behaviour shall be expressed as a command specification, and shall not be expressed as
a callback function.

**PC-TBR-4**
A button's enabled, active, and hidden state shall be expressed as an `evaluate` reference
resolved by the toolbar service, and shall not be computed inside the rendering component.

**PC-TBR-5**
An evaluator shall be registered as a `toolbarModule` entry named `` `evaluate.<name>` ``.

**PC-TBR-6**
A custom button renderer shall be registered as a `toolbarModule` entry named
`` `ohif.<name>` `` and referenced from a button's `uiType`.

**PC-TBR-7**
Section membership shall be declared separately from button definitions, as a mapping from
section id to an ordered list of button ids.

**PC-TBR-8**
A mode shall compose sections by referencing existing button definitions, and shall not restate
those definitions.

**PC-TBR-9**
The system shall provide the sections `primary`, `secondary`, and the eight
`viewportActionMenu` positions, and shall allow extensions and modes to declare additional named
sections.

**PC-TBR-10**
WHEN an evaluator determines that a button is not usable, the system shall present the button as
disabled with a stated reason, unless that button declares that it is hidden when disabled.

**PC-TBR-11**
An evaluator shall derive its result from services and its arguments only, and shall not mutate
application state.

**PC-TBR-12**
WHERE a button opens a menu or a popover, that menu shall be provided as the button's `uiType`
component, and shall not be provided as a panel or a modal.

**PC-TBR-13**
A button id shall appear in more than one section only by reference, and the system shall not
require a second definition for the same button.

### 4.7 Viewports and display-set routing — `PC-VPT`

**PC-VPT-1**
A viewport component shall be registered as a `viewportModule` entry.

**PC-VPT-2**
A display set shall be produced by a `sopClassHandlerModule` entry.

**PC-VPT-3**
A `sopClassHandlerModule` entry shall record its own module id on every display set it creates.

**PC-VPT-4**
The routing from display set to viewport component shall be declared in the mode's layout as an
ordered list of entries, each naming a `viewportModule` id and the `sopClassHandlerModule` ids it
can display.

**PC-VPT-5**
WHEN the system selects a viewport component for a display set, it shall select the first entry
of `PC-VPT-4` whose declared handler ids include that display set's handler id.

**PC-VPT-6**
A mode shall not select a viewport component by modality, by SOP Class UID, or by inspecting
instance metadata.

**PC-VPT-7**
IF no entry of `PC-VPT-4` matches a display set, THEN the system shall report that the display set
cannot be displayed and shall name the handler id that was unmatched.

**PC-VPT-8**
WHERE a display set exists only to overlay other image data, the system shall mark it as an
overlay display set and shall not route it as primary viewport content.

**PC-VPT-9**
**Options that change which display sets one viewport shows shall be selected from that viewport's
action menu**, through a `viewportActionMenu` section, and shall not be selected from a side panel,
from the primary toolbar, or from an application-wide dialog.

**PC-VPT-10**
The system shall provide a viewport data-overlay control as the single place where display sets
are added to, removed from, and reordered within one viewport.

**PC-VPT-11**
A viewport option shall change only the viewport it was invoked on.

**PC-VPT-12**
WHEN a viewport option is changed, the system shall record the change in presentation state so
that it survives a layout change.

**PC-VPT-13**
A viewport component shall obtain its data through display sets and services, and shall not
retrieve DICOM data directly.

**PC-VPT-14**
A viewport component shall render from its props and from services, and shall not own the data it
renders.

**PC-VPT-15**
WHERE a control acts on the content of a specific viewport, the system shall make the target
viewport unambiguous from the control's placement.

### 4.8 Layout, panels, and hanging protocols — `PC-LAY`

**PC-LAY-1**
A page layout shall be provided as a `layoutTemplateModule` entry.

**PC-LAY-2**
Panel placement shall be declared in the mode's layout props as ordered lists of `panelModule`
ids per panel position.

**PC-LAY-3**
A panel shall be registered as a `panelModule` entry carrying its name, icon, label, and
component.

**PC-LAY-4**
WHEN a mode is entered, the system shall seed the layout's panel lists into customization keys so
that customizations can add, remove, and reorder panels without the mode restating them.

**PC-LAY-5**
The initial content of viewports shall be determined by hanging protocols, and shall not be
determined by the layout template.

**PC-LAY-6**
A hanging protocol shall be provided as a `hangingProtocolModule` entry.

**PC-LAY-7**
A hanging protocol shall name the display sets it uses through `displaySetSelectors`, and shall
reference those selectors by id from its viewport structure.

**PC-LAY-8**
Hanging protocol matching shall be expressed as declarative matching rules.

**PC-LAY-9**
A mode shall reference hanging protocols by module id.

**PC-LAY-10**
WHEN the layout changes, the system shall retain the presentation state of every viewport that
persists across the change.

**PC-LAY-11**
A panel shall satisfy the sidebar contract of the [result-set
specification](../result-sets/requirements.md#53-the-general-sidebar-contract--sb) where that
contract applies to it.

### 4.9 Customization — `PC-CST`

**PC-CST-1**
The system shall resolve customizations from three scopes, in increasing precedence: Default,
Mode, Global.

**PC-CST-2**
An extension shall register its default values at Default scope through its
`customizationModule`.

**PC-CST-3**
A mode shall register its values at Mode scope.

**PC-CST-4**
A deployment shall register its values at Global scope through application configuration.

**PC-CST-5**
WHEN a mode is exited, the system shall clear Mode scope and shall retain Default and Global
scope.

**PC-CST-6**
Every customization shall be addressable by a stable string key.

**PC-CST-7**
A consumer shall read a customization at the point of use, and shall not capture its value at
import time.

**PC-CST-8**
WHERE a customization value composes another customization, it shall reference it by id and the
system shall resolve the reference at read time.

**PC-CST-9**
WHERE a customization modifies a list defined elsewhere, it shall be expressed as a modification
specification rather than as a restatement of the list.

**PC-CST-10**
Any value a deployment may reasonably need to change shall be exposed as a customization rather
than as a constant in code.

**PC-CST-11**
A customization key shall be namespaced by the area that owns it.

**PC-CST-12**
The system shall not require a code change to add, remove, or reorder toolbar buttons, toolbar
sections, panels, or panel sub-tabs.

**PC-CST-13**
IF a customization key is read and no value exists in any scope, THEN the system shall return
undefined and the consumer shall behave as though the customization were absent.

### 4.10 Services and events — `PC-SVC`

**PC-SVC-1**
A service shall declare a static registration descriptor and shall be registered from
`preRegistration`.

**PC-SVC-2**
A service holding state scoped to a mode shall implement `onModeEnter` and `onModeExit`.

**PC-SVC-3**
A service shall publish state changes as events.

**PC-SVC-4**
A consumer shall observe a service by subscribing to its events, and shall not poll it or derive
its state by re-reading it on every render.

**PC-SVC-5**
An event payload shall identify the entity that changed.

**PC-SVC-6**
A service shall not import React and shall not render.

**PC-SVC-7**
A service shall coordinate with another service through that service's public API and events,
and shall not read or write its internal state.

**PC-SVC-8**
WHERE behaviour requires coordinating several services, the system shall provide an orchestrating
service that composes them rather than adding cross-references between them.

**PC-SVC-9**
A subscription shall be removed when the subscriber is destroyed.

### 4.11 UI placement — deferred to `EM`

Which region of the layout a control belongs in is a layout question, not a mechanism question.
It is specified by [Extensions and modes (`EM`)](./requirements.md), and this document does not
restate it. Where a requirement below needs to say *where* something goes, it cites an `EM-*`
identifier.

**PC-UIP-1**
The system shall provide the mechanisms this document defines in a form that allows a control to
be placed in any region `EM` permits, without the control being reimplemented per region.

**PC-UIP-2**
A control shall have exactly one definition; appearing in more than one region shall be by
reference to that definition.

**PC-UIP-3**
New user interface shall be built from the shared UI component library.

**PC-UIP-4**
WHERE an OHIF component is overridden, the replacement shall live in the overriding extension and
shall be selected through customization rather than by editing the original.

### 4.12 Text, icons, and localization — `PC-TXT`

**PC-TXT-1**
Every user-visible string shall be provided through the localization system under a declared
namespace.

**PC-TXT-2**
A sentence shall not be assembled by concatenating localized fragments.

**PC-TXT-3**
An icon shall be registered by name and referenced by that name.

**PC-TXT-4**
A control's label and tooltip shall be declared in its definition, and shall not be embedded in
its rendering component.

**PC-TXT-5**
WHERE a control is disabled, its stated reason shall be localized.

### 4.13 File and directory placement — `PC-FIL`

**PC-FIL-1**
The system shall place extension contributions in the directories tabulated in §5.2.

**PC-FIL-2**
A file shall be placed by what it is, not by which feature it belongs to.

**PC-FIL-3**
An extension shall expose its public surface from its entry point, and shall treat every other
path as internal.

**PC-FIL-4**
WHERE a directory named in §5.2 does not exist in an extension, the extension shall create it
rather than placing the file elsewhere.

### 4.14 Conformance and legacy — `PC-CNF`

**PC-CNF-1**
New code shall conform to this specification.

**PC-CNF-2**
WHERE existing code does not conform, the system shall continue to support it until it is
migrated.

**PC-CNF-3**
WHEN existing code is modified for another reason, the modified part shall be brought into
conformance where doing so does not change behaviour.

**PC-CNF-4**
The system shall enforce `PC-BND-1`, `PC-BND-2`, `PC-BND-3`, and `PC-MOD-5` by lint rule.

**PC-CNF-5**
IF a requirement of this specification cannot be met for a specific contribution, THEN the
deviation shall be recorded in the code with a reference to the requirement it departs from.

---

## 5. Placement tables

*Which region a control goes in* is tabulated in [Extensions and modes §5](./requirements.md).
The tables below cover only where the **code** goes and how each thing is **declared**.

### 5.1 Where does this file go?

**Extension** — `extensions/<name>/src/`

| Contribution | Path |
| --- | --- |
| Extension id | `id.js` |
| Entry point and module function exports | `index.tsx` |
| Module functions | `get<ModuleType>.tsx` at the root |
| Commands | `commandsModule.ts` |
| Services | `services/<Name>Service/` |
| Default customization values | `customizations/` |
| Panels | `panels/` |
| Viewport components | `viewports/` |
| React components | `components/` |
| Hooks | `hooks/` |
| Zustand stores | `stores/` |
| React providers and contexts | `providers/`, `contexts/` |
| Cornerstone tools | `tools/` |
| Synchronizers | `synchronizers/` |
| Utilities | `utils/` |
| Types | `types/` |

**Mode** — `modes/<name>/src/`

| Contribution | Path |
| --- | --- |
| Mode id | `id.js` |
| Mode instance, routes, layout, composition | `index.tsx` |
| Toolbar button definitions and section membership | `toolbarButtons.ts` |
| Tool group setup | `initToolGroups.ts` |
| Hanging protocols | `hps/` |
| Mode-scope customizations | `modeCustomization.ts` |

### 5.2 Where is this defined?

| Thing | Defined in | Addressed as | Requirement |
| --- | --- | --- | --- |
| A command | Extension `commandsModule` | Command name + context | `PC-CMD-1`, `PC-CMD-11` |
| A command's options | Definition, invocation, and command spec, in that precedence | Named properties | `PC-CMD-4`, `PC-CMD-7` |
| A toolbar button | Extension or mode, as data | Button id | `PC-TBR-1` |
| A button's renderer | Extension `toolbarModule`, `ohif.<name>` | `uiType` | `PC-TBR-6` |
| A button's enablement | Extension `toolbarModule`, `evaluate.<name>` | `evaluate` | `PC-TBR-4`, `PC-TBR-5` |
| Which buttons are in a section | Mode, as `sectionId → buttonId[]` | Section id | `PC-TBR-7` |
| A panel | Extension `panelModule` | Module id | `PC-LAY-3` |
| Which panels a mode shows | Mode layout props, seeded to customization | Module id | `PC-LAY-2`, `PC-LAY-4` |
| A viewport component | Extension `viewportModule` | Module id | `PC-VPT-1` |
| A display set | Extension `sopClassHandlerModule` | Module id, recorded on the display set | `PC-VPT-2`, `PC-VPT-3` |
| Which viewport shows which display set | Mode layout `viewports` entries | Module ids | `PC-VPT-4` |
| Per-viewport display-set options | Viewport action menu | Button id in a `viewportActionMenu` section | `PC-VPT-9` |
| Initial viewport content | Hanging protocol | Module id | `PC-LAY-5`, `PC-LAY-6` |
| A configurable value | Extension `customizationModule` at Default scope | Customization key | `PC-CST-2`, `PC-CST-6` |
| A deployment override | Application configuration at Global scope | Customization key | `PC-CST-4` |
| A hotkey | Customization key, applied on mode enter | Command specification | `PC-CMD-13` |

---

## 6. Open items

1. **Lint enforcement coverage.** `PC-CNF-4` names four requirements as lint-enforceable. Whether
   `PC-EXT-5` (side-effect-free module functions) and `PC-BND-6` (write through commands) can be
   enforced mechanically, or must remain review-enforced, is undecided.
2. **`PC-CMD-7` precedence.** The current three-layer merge is what the implementation does, not
   necessarily what it should do. An argument exists that invocation-time options should be the
   most specific layer. Changing it is behaviour-affecting and needs its own decision.
3. **`utilityModule` scope.** It is the one module type with no stated shape, and is close to
   being an escape hatch that defeats `PC-MOD-7`. Whether to constrain or retire it is open.
4. **Non-conforming module types.** `contextModule` and `stateSyncModule` predate hooks and
   stores; whether new code should use them at all is unstated.
5. **Sections versus regions.** `PC-TBR-9` treats `viewportActionMenu` positions as toolbar
   sections, which makes a viewport control and a top-menu control the same kind of object. That
   is convenient but blurs the region distinction `EM` draws; whether the model should distinguish
   them is open.
6. **Mode inheritance depth.** `PC-MODE-5` requires composition over copying but does not say how
   deep a chain is acceptable, nor what a mode may override safely.

## 7. Traceability

| Requirement group | Anchored in |
| --- | --- |
| `PC-EXT`, `PC-MOD` | `platform/core/src/extensions/ExtensionManager.ts`, `platform/core/src/extensions/MODULE_TYPES.js` |
| `PC-MODE` | `modes/basic/src/index.tsx`, `modes/longitudinal/src/index.ts`, `platform/app/src/routes/Mode/Mode.tsx` |
| `PC-CMD` | `platform/core/src/classes/CommandsManager.ts` |
| `PC-TBR` | `platform/core/src/services/ToolBarService/ToolbarService.ts`, `extensions/cornerstone/src/getToolbarModule.tsx`, `extensions/cornerstone/src/customizations/toolbarButtonsCustomization.ts` |
| `PC-VPT` | `platform/app/src/components/ViewportGrid.tsx`, `extensions/default/src/ViewerLayout/index.tsx`, `extensions/cornerstone/src/components/ViewportDataOverlaySettingMenu/` |
| `PC-LAY` | `platform/core/src/types/HangingProtocol.ts`, `extensions/default/src/ViewerLayout/` |
| `PC-CST` | `platform/core/src/services/CustomizationService/CustomizationService.ts` |
| `PC-SVC` | `platform/core/src/services/_shared/pubSubServiceInterface.ts` |
| `PC-FIL` | Repository conventions recorded informally in `AGENTS.md` |

## 8. Verification approach

| Requirement group | Primary verification |
| --- | --- |
| `PC-BND-1`, `PC-BND-2`, `PC-BND-3`, `PC-MOD-5` | Lint rules on import paths, run in CI (`PC-CNF-4`). |
| `PC-MOD-1`..`PC-MOD-4`, `PC-EXT-1`..`PC-EXT-3` | A conformance test that registers every shipped extension and asserts module naming, id uniqueness, and addressability. |
| `PC-EXT-5` | A test that calls every module function twice and asserts no observable service state changed. |
| `PC-CMD-7` | Unit tests over `CommandsManager` covering all three precedence layers. |
| `PC-CMD-13` | A test asserting that every toolbar button's behaviour resolves to a registered command. |
| `PC-TBR-4`, `PC-TBR-5`, `PC-TBR-6` | A test asserting every button's `evaluate` and `uiType` resolve to registered toolbar module entries. |
| `PC-VPT-4`..`PC-VPT-7` | A test per shipped mode asserting every registered SOP class handler id is claimed by exactly one viewport entry, and reporting those that are not. |
| `PC-VPT-9` | Review, plus a Playwright test asserting per-viewport display-set options are reachable from the viewport action menu. |
| `PC-CST-*` | Unit tests on scope precedence, mode-scope clearing, reference resolution, and list modification. |
| `PC-SVC-*` | Review, plus tests asserting mode enter/exit leaves no residual subscriptions. |
| `PC-TXT-1` | A lint rule or test detecting untranslated user-visible strings. |
