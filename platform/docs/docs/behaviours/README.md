---
id: README
title: Behaviours
sidebar_position: 0
---

# Behaviours

This section documents **how the system and UI actually behave** — the
end-to-end behaviours that emerge from the interaction of services, extensions,
the data source, and Cornerstone3D, rather than the API of any single module.

It is the place for:

- **Observed behaviours** — how a feature works today across the stack (e.g. how
  a DICOM SEG is fetched, decoded, and rendered; what the viewport does on study
  change; how measurements round-trip to SR).
- **Design proposals** — proposed or in-progress changes to a behaviour, captured
  before/while they are implemented so the intent and trade-offs are recorded.
  These are clearly marked as proposals until they land.
- **Edge cases and failure modes** — what happens when something is missing,
  slow, or malformed, and how the system is expected to degrade.

The goal is a durable, discoverable record of *behaviour* — the kind of
cross-cutting knowledge that is otherwise only in people's heads or scattered
across code comments. Prefer linking to the relevant source files (with line
references) so each behaviour doc stays anchored to the code it describes.

## Index

- [Segmentation: loading a multiframe SEG as a single Part 10 instance](./segmentation-multiframe-part10-prefetch.md)
  — _proposal_. Prefetch the whole instance in one request and register its
  per-frame compressed pixels into the Cornerstone3D image cache so the per-frame
  load path is served locally, while keeping the standard decode path unchanged.

## Writing a new behaviour doc

1. Add a `kebab-case.md` file in this directory.
2. State whether it documents **current behaviour** or is a **proposal**.
3. Link to the code (`path:line`) that implements or will implement it.
4. Add it to the **Index** above.
