---
sidebar_position: 0
sidebar_label: Overview
title: Specifications
summary: How OHIF writes behavioural specifications in EARS format, the requirement-ID register, and the index of component specifications.
---

# Specifications

This section holds behavioural specifications for OHIF, written in **EARS** (Easy Approach to
Requirements Syntax). A specification says *what the viewer must do* and is stable across
implementations; a companion design document says *how we intend to build it* and is expected
to change.

Each specification covers one **component** — a coherent area of behaviour — and owns a
reserved requirement-ID prefix so that specifications can cite one another without collisions.

---

## 1. Index of component specifications

| Prefix | Component | Specification | Design | Status |
| --- | --- | --- | --- | --- |
| `EM` | **Extensions and modes** — the default UI layout, its regions, and what belongs in each | [Extensions and modes](./extensions-and-modes/requirements.md) | *pending* | Draft |
| `PC` | **Platform conventions** — module types, addressing, commands, customization, and the other mechanisms `EM` placements are expressed through | [Platform conventions](./extensions-and-modes/platform-conventions.md) | *pending* | Draft |
| `RS` | **Result sets** — the contract for any secondary result layered over images: grouping, applicability, display-set creation, viewport layers, top menu bar | [Result sets](./result-sets/requirements.md) | *pending* | Draft |
| `SB` | **Sidebars** — the contract every OHIF side panel satisfies | [Result sets §5.3](./result-sets/requirements.md#53-the-general-sidebar-contract--sb) | *pending* | Draft |
| `SG` | **Segmentations** — labelmap segments, editing, statistics | *not yet written* | — | Planned |
| `CT` | **Contours** — contour ROIs, interpolation, RTSTRUCT semantics | *not yet written* | — | Planned |
| `MS` | **Measurements and annotations** | *not yet written* | — | Planned |
| `SS` | **Study and series browsing** | *not yet written* | — | Planned |
| `HP` | **Hanging protocols and layout** | *not yet written* | — | Planned |

> `EM` and `PC` are two altitudes of the same contract. `EM` is high level: the regions of the
> default layout and what kind of thing belongs in each — a component specification says *what*
> the viewer does, `EM` says *where that appears*. `PC` is the mechanism underneath: how a
> contribution is declared, addressed, and reused. Read `EM` to decide placement; read `PC` to
> implement it.

> `RS` is the general contract for secondary results. A result type — segmentation, annotation,
> key object, key series — is registered against it and gains grouping, applicability,
> visibility, change state, and saving without adding a mechanism of its own. `SG`, `CT`, and
> `MS` will specify only what is genuinely type-specific.

> The `SB` sidebar contract currently lives inside the result-set specification because that is
> where it was first needed. It is written as a free-standing, component-neutral section and is
> expected to be extracted into `specs/sidebars.md` once a second specification cites it.

### 1.1 Reserving a prefix

Add a row to the table above before writing the specification. A prefix is two uppercase
letters, unique across this section, and never reused after retirement.

### 1.2 Change proposals

A component specification records the current decision. A **change proposal** records a specific,
scoped change to one — what moves, why, what it satisfies, and what it does not touch. It carries
its own requirements so the change can be reviewed and tested as a unit, and it is retired once the
change lands and the specification it amends has been updated.

Change proposals use the prefix `CP-<NAME>`, where `<NAME>` identifies the proposal. They are the
usual reason a requirement elsewhere is marked *(proposed)*.

| Proposal | Changes | Status |
| --- | --- | --- |
| [CP-SEGTOOL](./changes/segmentation-tool-submenu.md) — segmentation and contour tools into a toolbar sub-menu | `EM`, `RS` | Proposed |

---

## 2. Requirement identifiers

```
<PREFIX>-<GROUP>-<n>
   │        │      └── sequence within the group, never renumbered once published
   │        └───────── short uppercase group name, scoped to the prefix
   └────────────────── the component prefix reserved in §1
```

Examples: `SB-COMP-2`, `RS-SAVE-11`, `SG-EDIT-4`.

**Identifiers are stable.** Once a specification is merged, an identifier is never reassigned
to different behaviour. To retire a requirement, mark it *Withdrawn* in place and leave the
number occupied; design documents, tests, and pull requests cite these identifiers and must not
silently start meaning something else.

**Cross-component citation** uses the full identifier. A segmentation specification that
inherits the sidebar contract writes "the segmentation sidebar shall satisfy `SB-*`" rather
than restating those requirements.

---

## 3. EARS patterns

Every requirement uses exactly one of these forms, or a documented combination. *The system*
means the OHIF Viewer application unless the specification narrows it.

| Pattern | Form | Use for |
| --- | --- | --- |
| **Ubiquitous** | The system shall `<response>`. | Behaviour that always holds. |
| **Event-driven** | WHEN `<trigger>`, the system shall `<response>`. | A response to something happening. |
| **State-driven** | WHILE `<state>`, the system shall `<response>`. | Behaviour that holds for the duration of a state. |
| **Optional feature** | WHERE `<feature is included>`, the system shall `<response>`. | Behaviour that exists only in some configurations or deployments. |
| **Unwanted behaviour** | IF `<trigger>`, THEN the system shall `<response>`. | Error handling, refusal, degradation. |
| **Complex** | Any of the above combined, e.g. WHILE `<state>`, WHEN `<trigger>`, the system shall `<response>`. | Use sparingly; prefer splitting. |

### 3.1 House rules

1. **One requirement, one sentence, one `shall`.** If a requirement needs "and also", split it.
2. **No design in a requirement.** Name the observable behaviour, not the class, hook, or
   store that produces it. Rationale, algorithms, and file layout belong in the design document.
3. **Testable or it is not a requirement.** Each one must map to something a unit test or a
   Playwright test can assert. Include a verification table (see §4).
4. **Use `WHERE` for deferred scope.** Behaviour that is out of scope now but must not be
   designed out is written as an optional-feature requirement with a note, rather than omitted.
   This reserves the seam without committing to the work.
5. **Notes are not requirements.** Anything in a `>` blockquote is rationale and carries no
   `shall`.
6. **Answer the open questions.** A specification that inherits open questions from an issue
   states its resolution for each, or records it as deliberately still open.

---

## 4. Expected structure of a specification

```
1. Purpose             why this exists, and the issue or discussion it comes from
2. Scope               what is in, what is deferred, and what the deferral constrains
3. Definitions         every term the requirements use in a narrow sense
4..n Requirements      grouped, each group with its own <PREFIX>-<GROUP> identifier
n+1  Open questions    resolved and still-open, with the resolution stated
n+2  Traceability      requirement → source issue section, and → superseded issues
n+3  Verification      requirement group → how it is tested
```

A companion `design.md` in the same folder cites the identifiers rather than restating them.
