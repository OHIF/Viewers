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
| `VF` | **Viewport fidelity** — the indicator and the detail view that tell the user when the displayed image is not a faithful rendering of the stored pixel data | [Viewport fidelity indicator](./viewport-fidelity/requirements.md) | *pending* | Draft |

### 1.1 Reserving a prefix

Add a row to the table above before writing the specification. A prefix is two uppercase
letters, unique across this section, and never reused after retirement.

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

### 4.1 User requirements and implementation requirements

A specification has two requirement sections, and the two sections stay clearly separate:

1. **User requirements**: what the user must be able to do, or must be able to determine, to
   work safely.
2. **Implementation requirements**: how the work is done, or the recommended approach.

Each group has its own `<PREFIX>-<GROUP>` identifiers, so a reader sees immediately which section
holds a requirement. The Scope section of the specification states the change rule:

- An implementation requirement can change when a better approach appears.
- A user requirement changes only when it describes the behaviour wrongly, or when the intended
  user-facing behaviour changes. An implementation that is inconvenient is not a reason to change
  a user requirement.

This is the preferred convention for new specifications. A specification that is older than the
convention is not changed to follow it, unless a separate change asks for that. The first example
is the [viewport fidelity indicator](./viewport-fidelity/requirements.md).
