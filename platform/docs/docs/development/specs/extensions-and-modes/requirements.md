---
sidebar_position: 1
sidebar_label: Requirements (EARS)
title: Extensions and modes — requirements
summary: What the default OHIF extensions and modes set up as a UI layout — the regions of that layout, what kinds of things belong in each, and how a contribution is exposed so it can be reused.
---

# Extensions and modes — requirements

**Prefix:** `EM` — see the [specification register](../index.md#1-index-of-component-specifications).
**Status:** Draft for review — requirements only. A companion design document follows once these are agreed.
**Layer below:** [Platform conventions (`PC`)](./platform-conventions.md) — module types, addressing, commands, customization scopes, and the other mechanisms this document's placements are expressed through.
**Related:** [Result sets](../result-sets/requirements.md) is the first specification written against this contract.

---

## 1. Purpose

OHIF's extension and mode system is deliberately flexible: almost anything can be put almost
anywhere. That flexibility is why the platform can be adapted, and it is also why the same
capability ends up implemented four different ways in four different extensions — a toolbar
button that calls a service directly here and runs a command there, a viewport option in a side
panel here and in an action menu there, a value hard-coded here and customizable there.

The actual implementation of the default provided extensions and modes
is **opinionated on purpose**.  It specifies a general layout and what types of things belong where
in that layout, as well as how things are exposed in an extension or mode in a way that they can be
effectively re-used.

It exists so that a specification like [result sets](../result-sets/requirements.md) can say
"the tool sections appear in the top menu bar" and have that mean something precise, and so that
a reviewer can point at a requirement rather than a preference.

## 2. Scope

### 2.1 In scope

- The regions of the default layout, and what each region is for.
- Which kinds of thing belong in each region, and the rule for deciding when it is unclear.
- What the default extensions and the default modes are each responsible for providing.
- How a contribution is exposed so that another extension or mode can reuse, replace, or
  reorder it without editing it.

### 2.2 Out of scope

| Out of scope | Where it lives |
| --- | --- |
| How a contribution is declared, addressed, and wired | [Platform conventions (`PC`)](./platform-conventions.md) |
| Module types, command option precedence, customization scopes, file placement | `PC` |
| The behaviour of any particular feature | A component specification such as [`RS`](../result-sets/requirements.md) |
| Visual design, spacing, colour, and typography | Not specified |
| Responsive and small-screen layout | Deferred — see §6 |
| Multi-monitor layout | Deferred — see §6 |

### 2.3 These are decisions, not invariants

Everything below is a decision the default extensions and modes make **today**. The point of the
extension and mode system is that those decisions can be remade: a mode may put results on the
left, omit the header, or drive the viewport grid from something other than a hanging protocol.
[`PC`](./platform-conventions.md) requires all of that to be possible without forking.

A mode or deployment that decides differently is **not non-conformant**. It is simply outside what
this document describes. Conformance here means something narrower and more useful: the shipped
defaults make these choices deliberately and hold to them, so that a specification like
[`RS`](../result-sets/requirements.md) can rely on them and a reviewer can cite them instead of
arguing a preference.

WHEN a change to the defaults is adopted, this document changes with it and the new choice becomes
the one recorded here. A requirement below is the record of a current decision, not a claim that it
is the only sound one.

### 2.4 Current and proposed requirements

Some requirements record what the shipped defaults already do. Others record a change that has been
agreed but not yet made. Both are written as `shall`, because both are what the defaults are
required to do — the difference is only whether the code has caught up.

A requirement not yet met by the shipped defaults is marked **(proposed)**. The marker is removed
when the change lands. It does not make the requirement weaker; it records that the gap is known
and intended to close, so that a reader does not mistake the specification for a description of
current behaviour, and a reviewer does not mistake existing code for conformance.

## 3. Definitions

| Term | Definition |
| --- | --- |
| **Region** | A named area of the default layout with a stated purpose. §4.1 enumerates them. |
| **Header** | The full-width region at the top of the viewer. |
| **Top menu bar** | The toolbars within the header. |
| **Side panel region** | The collapsible left or right region flanking the viewport grid. |
| **Sidebar** | One panel within a side panel region. Its internal contract is `SB-*` in [result sets §5.3](../result-sets/requirements.md#53-the-general-sidebar-contract--sb). |
| **Viewport grid** | The central region containing the viewports. |
| **Viewport action menu** | The controls overlaid on the corners and edges of a single viewport. |
| **Transient surface** | A notification, dialog, modal, or viewport dialog: shown in response to an event and dismissed. |
| **Scope of a control** | What the control changes: the application, the study, one viewport, or the current selection. |

---

## 4. Requirements

EARS patterns used: **ubiquitous** (`The system shall …`), **event-driven** (`WHEN … the system
shall …`), **state-driven** (`WHILE … the system shall …`), **optional feature** (`WHERE … the
system shall …`), and **unwanted behaviour** (`IF … THEN the system shall …`).

*The system* means the OHIF Viewer application as configured by the default extensions and modes.

### Altitude of these requirements

These are high-level `shall`s. They fix the **general design** — which regions exist, what each is
for, and what belongs in it — and deliberately leave the specifics to the lower-level rules and to
the modes, which see more of the picture than this document can.

Where a requirement uses a term such as *several*, *related*, *frequently used*, or *obvious*, that
term is **intentionally not defined here**. A requirement is met by a specific choice being made
and applied consistently, not by that choice being restated in this document. A reviewer applying
one of these requirements is asking "was this decided deliberately and does it hold across the
mode", not "does it match a threshold written here".

IF a specific split, threshold, or organization needs to be fixed, THEN it belongs in a mode, in
[`PC`](./platform-conventions.md), or in a component specification — not here.

### 4.1 The default layout — `EM-LAY`

**EM-LAY-1**
The system shall provide a default layout composed of the following regions, and shall give each
region the stated purpose.

| Region | Purpose |
| --- | --- |
| Header | Identify what is being viewed, and host the top menu bar and application-level controls |
| Top menu bar | Select the active tool, and invoke study-wide and application-wide actions |
| Left side panel region | Navigate the available data |
| Viewport grid | Display the images and everything drawn over them |
| Viewport action menu | Change what and how one viewport displays |
| Right side panel region | List, organize, and act on results |
| Transient surfaces | Report outcomes and request decisions |

**EM-LAY-2**
The system shall allow a mode to omit any region other than the viewport grid.

**EM-LAY-3**
The system shall allow a deployment to replace the component providing any region.

**EM-LAY-4**
The system shall preserve each region's stated purpose when its content is changed, and shall not
require a region to be repurposed in order to add a capability.

**EM-LAY-5**
WHILE a region is empty, the system shall not reserve space for it.

**EM-LAY-6**
The system shall make the side panel regions collapsible without altering the content they hold.

**EM-LAY-7**
WHILE a side panel region is collapsed, the system shall keep every capability it holds reachable.

> **Note (EM-LAY-7):** This is the layout-level statement of `SB-OWN-3`. A capability that only
> works when a panel is open is a capability in the wrong place.

**EM-LAY-8**
WHERE a mode assigns a region a purpose other than the one stated in `EM-LAY-1`, the system shall
permit it, and that mode shall apply its assignment consistently.

> **Note (EM-LAY-8):** `EM-LAY-1` records the assignment the shipped defaults make, per §2.3. What
> matters for a mode that assigns differently is that it does so throughout, so a user learns one
> organization rather than two.

### 4.2 The header — `EM-HDR`

**EM-HDR-1**
The system shall identify the patient and study being viewed in the header.

**EM-HDR-2**
The system shall provide application-level controls — preferences, appearance, about, and
session — from the header.

**EM-HDR-3**
The system shall provide undo and redo of user edits from the header.

**EM-HDR-4**
The system shall allow the header's identifying content to be hidden without removing the top
menu bar.

**EM-HDR-5**
The header shall not host controls whose scope is a single viewport.

### 4.3 The top menu bar — `EM-TOP`

**EM-TOP-1**
The system shall present the selection of the active tool in the top menu bar.

**EM-TOP-2**
The system shall present study-wide and application-wide actions in the top menu bar.

**EM-TOP-3**
The system shall provide at least two named tool areas in the top menu bar, so that a mode can
separate frequently used tools from the remainder.

**EM-TOP-4**
The system shall allow a mode to determine which tools appear in the top menu bar and in what
order.

**EM-TOP-5**
The system shall keep the top menu bar available regardless of which panels are open.

**EM-TOP-6**
WHERE a tool is not usable in the active viewport, the system shall present it as unavailable
with a stated reason rather than removing it, unless the tool declares otherwise.

**EM-TOP-7**
The top menu bar shall not host the listing or organization of results.

#### Grouping related tools

**EM-TOP-8**
WHERE the top menu bar offers several tools of a related type, the system shall present them as
one group rather than as separate top-level entries.

> **Note (EM-TOP-8):** A user looking for a tool finds it faster when it sits in an obvious
> organization. Grouping is a findability requirement, not a space-saving one — the point is that
> the user can predict where to look, not that the toolbar is shorter.

> **Note — *several* and *related* are deliberately undefined.** Two tools can be a group, and two
> tools can equally be better left apart. What makes tools related is likewise not fixed here.
> These are decisions taken per mode and per tool family by the lower-level rules that see more
> of the picture; this requirement fixes the intent, not the split. See §4's altitude statement.

**EM-TOP-9**
The system shall group tools by what they do, and shall not group them by which extension
provides them.

**EM-TOP-10**
A tool shall belong to at most one group.

**EM-TOP-11**
The system shall present a group as a single top-level item, with the remaining tools of that
group reachable from it.

**EM-TOP-12**
The system shall make the remaining tools of a group reachable in one interaction from the
group's top-level item.

**EM-TOP-13**
The system shall make it apparent that a group's top-level item is one of several.

**EM-TOP-14**
WHEN the user selects a tool from a group, the system shall make that tool the group's top-level
item.

**EM-TOP-15** *(proposed)*
WHILE the active tool belongs to another group, the system shall keep each group's top-level item
at the tool most recently selected from that group.

> **Note (EM-TOP-14, EM-TOP-15):** A user commonly goes back and forth between the same few
> tools. Making the top-level item the last one selected from that group means the tool a user is
> actually working with is the one on display, so returning to it is a single click rather than a
> re-navigation of the group. `EM-TOP-15` is the load-bearing half: without it a group reverts as
> soon as the user picks a tool elsewhere, which is precisely the case where they are alternating.

**EM-TOP-16**
WHILE no tool in a group has been selected, the system shall present that group's declared default
as its top-level item.

**EM-TOP-17** *(proposed)*
The system shall retain each group's most recently selected tool for at least the duration of the
browser session, across layout changes and mode changes.

**EM-TOP-18** *(proposed)*
WHEN the browser session ends, the system shall discard the retained selections, and shall return
every group to its declared default.

> **Note (EM-TOP-17, EM-TOP-18):** Closing the tab or logging out ends the session. A session is
> the minimum: it is long enough to cover the alternating that `EM-TOP-15` exists for, including
> across a mode change, while still guaranteeing that a user who returns fresh sees the toolbar the
> mode declared. Retaining a user's habitual tools *beyond* a session is a reasonable extension of
> the same argument, but it changes what a user sees on open and so needs its own specification —
> see §6.

**EM-TOP-19**
The system shall allow a mode to determine the membership, order, and default of every group.

### 4.4 Side panel regions — `EM-SID`

**EM-SID-1**
The system shall use the left side panel region for navigating the available data, and the right
side panel region for listing, organizing, and acting on results.

**EM-SID-2**
The system shall allow a mode to place more than one sidebar in a side panel region.

**EM-SID-3**
The system shall allow a mode to determine which sidebars appear in each side panel region and in
what order.

**EM-SID-4**
The system shall allow a sidebar to be added, removed, or reordered by configuration without a
code change.

**EM-SID-5**
Every sidebar shall satisfy the sidebar contract of
[result sets §5.3](../result-sets/requirements.md#53-the-general-sidebar-contract--sb).

**EM-SID-6** *(proposed — [CP-SEGTOOL](../changes/segmentation-tool-submenu.md))*
A side panel region shall not host tool selection.

**EM-SID-7**
A sidebar shall not host options that change what a single viewport displays.

> **Note (EM-SID-6, EM-SID-7):** These two are the layout-level consequence of `EM-PLC-1`. They
> are stated separately because both are common today and both are what the
> [source issue](https://github.com/OHIF/Viewers/issues/6193) describes as confusing.

### 4.5 The viewport grid — `EM-GRD`

**EM-GRD-1**
The system shall determine the initial content of the viewport grid from a hanging protocol.

**EM-GRD-2**
The system shall allow the user to change what a viewport displays without changing the layout.

**EM-GRD-3**
The system shall allow the user to change the grid layout without discarding the state of
viewports that persist across the change.

**EM-GRD-4**
The system shall make the active viewport identifiable.

**EM-GRD-5**
The system shall route a display set to a viewport by the type of that display set, and shall not
require the mode to inspect the data.

**EM-GRD-6**
IF a display set cannot be routed to any viewport, THEN the system shall report that rather than
displaying nothing.

**EM-GRD-7**
The viewport grid shall display images and the results drawn over them, and shall not host
persistent controls other than the viewport action menu.

### 4.6 The viewport action menu — `EM-VPA`

**EM-VPA-1**
The system shall present options that change what a single viewport displays in that viewport's
action menu.

**EM-VPA-2**
The system shall present options that change how a single viewport renders in that viewport's
action menu.

**EM-VPA-3**
The system shall provide, in the viewport action menu, the single place where display sets are
added to, removed from, and reordered within one viewport.

**EM-VPA-4**
A viewport action shall change only the viewport it was invoked on.

**EM-VPA-5**
The system shall make the viewport a viewport action applies to unambiguous from where the
control appears.

**EM-VPA-6**
The system shall provide named positions around the viewport, and shall allow a mode to determine
which controls occupy them.

**EM-VPA-7**
WHEN a viewport option is changed, the system shall retain the change for that viewport across a
layout change.

### 4.7 Transient surfaces — `EM-TRN`

**EM-TRN-1**
The system shall report the outcome of an action that the user does not need to acknowledge as a
notification.

**EM-TRN-2**
WHERE an action is irreversible or destructive, the system shall require an explicit confirmation
before performing it.

**EM-TRN-3**
WHERE a decision concerns one viewport, the system shall request it within that viewport.

**EM-TRN-4**
WHERE a decision concerns the study or the application, the system shall request it in a modal.

**EM-TRN-5**
A transient surface shall not be the only place a capability is reachable from.

**EM-TRN-6**
IF the user dismisses a transient surface without deciding, THEN the system shall take no action.

### 4.8 Placement policy — `EM-PLC`

This is the rule that decides the preceding sections, and the rule to apply when a new control
does not obviously belong anywhere.

**EM-PLC-1**
The system shall place a control in the region matching the scope of what it changes:

| Scope of the control | Region |
| --- | --- |
| The application | Header |
| The study | Top menu bar |
| Which tool is active | Top menu bar |
| One viewport | That viewport's action menu |
| The item currently selected in a sidebar | That sidebar |
| A decision required before proceeding | A transient surface |

**EM-PLC-2**
The system shall place a control in exactly one region, and shall present it elsewhere only by
reference to that single definition.

**EM-PLC-3**
IF the scope of a control is ambiguous, THEN the system shall place it by the narrowest scope it
can change, and the ambiguity shall be recorded rather than settled by preference.

**EM-PLC-4**
WHERE a capability could be offered either as a tool or as an action on a selection, the system
shall treat it as a tool when it changes what the next interaction does, and as an action
otherwise.

> **Note (EM-PLC-4):** "Brush" and "spline ROI" change what the next click does; they are tools
> and belong in the top menu bar. "Interpolate", "smooth", "delete", and "copy" act on what is
> already selected; they are actions and belong in the sidebar holding that selection.

**EM-PLC-5**
The system shall not require a capability to be reimplemented in order to move it between
regions.

### 4.9 Exposure and reuse — `EM-REU`

**EM-REU-1**
Every contribution a mode or another extension may need shall be referenceable by a stable
identifier.

**EM-REU-2**
A mode shall compose the layout by referencing contributions, and shall not restate their
definitions.

**EM-REU-3**
WHERE a mode is a variant of another mode, it shall be composed from that mode's exported parts
rather than copied from them.

**EM-REU-4**
The system shall allow the content of any region to be added to, removed from, and reordered by
configuration without a code change.

**EM-REU-5**
The system shall allow any component providing a region or a part of one to be replaced by
configuration.

**EM-REU-6**
An extension shall provide its capabilities in a form usable by a mode it does not know about.

**EM-REU-7**
An extension shall not require another specific extension to be present in order to load.

**EM-REU-8**
WHERE a capability is offered in one region, the system shall make it reachable from anywhere the
placement policy would also permit, without a second implementation.

### 4.10 Responsibilities of the default packages — `EM-DEF`

**EM-DEF-1**
The system shall provide the layout, the header, the side panel regions, and the transient
surfaces from a default extension that has no dependency on any rendering library.

**EM-DEF-2**
The system shall provide the viewport grid and the viewport action menu from the extension owning
the rendering of the display sets shown in it.

**EM-DEF-3**
A default mode shall contain composition only.

**EM-DEF-4**
A default mode shall declare which tools, panels, viewports, and hanging protocols it uses, and
shall define none of them.

**EM-DEF-5**
The system shall provide at least one default mode that demonstrates every region of `EM-LAY-1`.

**EM-DEF-6**
WHERE a default mode is specialized for a workflow, it shall differ from the general mode only in
composition.

---

## 5. Region reference

| Region | Provided by | Content declared by | Requirements |
| --- | --- | --- | --- |
| Header | Default extension layout | Extension, with mode overrides | `EM-HDR-*` |
| Top menu bar | Default extension layout | Mode, as tool areas and their membership | `EM-TOP-*` |
| Left side panel region | Default extension layout | Mode, as an ordered list of sidebars | `EM-SID-*` |
| Viewport grid | Rendering extension | Mode routing plus hanging protocol | `EM-GRD-*` |
| Viewport action menu | Rendering extension | Mode, as named positions and their controls | `EM-VPA-*` |
| Right side panel region | Default extension layout | Mode, as an ordered list of sidebars | `EM-SID-*` |
| Transient surfaces | Default extension, via services | Whoever raises them | `EM-TRN-*` |

How each of these is declared and addressed is [`PC` §5](./platform-conventions.md).

---

## 6. To be written

These belong in this document but are not yet drafted. They are listed so their absence is
deliberate rather than an oversight.

| Topic | Question to answer |
| --- | --- |
| Comparison and prior-study layouts | What the layout guarantees when current and prior studies are shown together, and which region identifies which is which. |
| The study and series browser | What the left region must offer beyond a series list: priors, derived objects, key series, load state. |
| Panel default states | When a side panel region starts open, and what may cause a panel to open itself. |
| Progress and load state | Which region reports that data is still arriving, and how that differs from an error. |
| Keyboard reachability | Which regions must be reachable without a pointer, and what the tool selection surface owes a keyboard user. |
| Responsive and small-screen behaviour | Which regions collapse first, and what may not be lost. |
| Multi-monitor | Whether a region may move to a second window, and which ones. |
| Workflow and step-driven modes | Whether a guided workflow is a region, a sidebar, or a mode of the top menu bar. |
| Read-only and viewing-only deployments | Which regions change when editing is disabled. |
| Toolbar state that outlives a session | Whether a user's habitual tool selections persist beyond the browser session `EM-TOP-17` requires, and how that is reconciled with the toolbar the mode declares. |

## 7. Open items

1. **Viewport action menu positions as toolbar sections.** The implementation models the
   positions around a viewport as toolbar sections, which makes a viewport control and a
   top-menu control the same kind of object. That is convenient and it is what `PC-TBR-9`
   describes, but it blurs the region distinction `EM-PLC-1` rests on.
2. **Where the active result set is named.** `RS-UI-4` puts the active result set's name and
   change state in the top menu bar. Whether that is a header concern instead — it identifies
   what is being worked on rather than acting on it — is unsettled.
3. **`EM-LAY-2`'s exemption for the viewport grid.** A mode with no viewport grid — a pure
   worklist or reporting mode — may be a legitimate case this document currently excludes.
4. **Region ownership of the viewport grid.** `EM-DEF-2` assigns it to the rendering extension,
   which means a deployment replacing the renderer also replaces the grid. Whether the grid
   should be renderer-independent is a real architectural question.

## 8. Traceability

| Requirement group | Anchored in |
| --- | --- |
| `EM-LAY`, `EM-HDR`, `EM-SID` | `extensions/default/src/ViewerLayout/`, `extensions/default/src/ViewerLayout/ViewerHeader.tsx` |
| `EM-TOP` | `extensions/default/src/Toolbar/Toolbar.tsx`, mode toolbar composition |
| `EM-GRD` | `platform/app/src/components/ViewportGrid.tsx`, hanging protocol service |
| `EM-VPA` | `extensions/cornerstone/src/components/OHIFViewportActionCorners.tsx` |
| `EM-TRN` | The notification, dialog, modal, and viewport dialog services |
| `EM-DEF` | `extensions/default/`, `modes/basic/`, `modes/longitudinal/` |
| `EM-PLC`, `EM-REU` | Stated here; mechanisms in [`PC`](./platform-conventions.md) |

## 9. Verification approach

| Requirement group | Primary verification |
| --- | --- |
| `EM-LAY`, `EM-HDR`, `EM-TOP`, `EM-SID`, `EM-GRD`, `EM-VPA` | Playwright end-to-end tests per shipped default mode, asserting each region is present, purposed as stated, and holds only what the placement policy permits. |
| `EM-LAY-7`, `EM-TOP-5` | Playwright tests asserting capabilities remain reachable with panels collapsed. |
| `EM-TOP-8`..`EM-TOP-19` | Playwright test: select a tool from a group, select a tool from a different group, and assert the first group still displays the tool last selected from it (`EM-TOP-15`) rather than reverting to its first or default member. Plus a conformance test asserting no tool id appears in two groups (`EM-TOP-10`), and a test asserting a group returns to its declared default in a new browser session (`EM-TOP-18`). |
| `EM-PLC` | Review. `EM-PLC-2` is additionally testable: no control id may appear in two regions with two definitions. |
| `EM-REU-4`, `EM-REU-5`, `EM-SID-4` | Configuration-only tests that add, remove, and reorder region content and assert the result without touching source. |
| `EM-DEF-1`, `EM-DEF-2` | Import-boundary lint, shared with `PC-BND`. |
| `EM-DEF-3`, `EM-DEF-4` | A conformance test over shipped modes asserting they define no tools, panels, viewports, or protocols of their own. |
