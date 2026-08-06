---
sidebar_position: 1
sidebar_label: Requirements (EARS)
title: Result sets — requirements
summary: The general contract for secondary results layered over images — grouping, applicability, display-set creation, viewport layers, the top menu bar, and sidebars — with labelmap and contour segmentation as the first implemented result types.
---

# Result sets — requirements

**Prefixes:** `RS` (result sets), `SB` (general sidebar contract) — see the
[specification register](../index.md#1-index-of-component-specifications).
**Source issue:** [OHIF/Viewers#6193 — Study-level segmentation and annotation result sets](https://github.com/OHIF/Viewers/issues/6193)
**Linear:** [OHIF-2686](https://linear.app/ohif/issue/OHIF-2686)
**Status:** Draft for review — requirements only. A companion design document follows once these are agreed.
**Depends on:** [Extensions and modes (`EM`)](../extensions-and-modes/requirements.md) — where each thing below is declared, and which UI surface it appears on.

---

## 1. Purpose

A **result** is anything OHIF holds that is secondary to the images: a segmentation, a contour
set, a measurement, an annotation, a key object selection, a designated key series, a computed
statistic, a registration. OHIF has grown a separate mechanism for each — separate panels,
separate visibility rules, separate save paths, separate ideas about which images a result
applies to. The result of that is the confusion catalogued in the source issue.

This specification defines **result sets**: named groups of secondary results, and one contract
for how any result is identified, grouped, scoped to images, displayed, edited, and saved.

Two ideas carry most of the weight.

**Grouping is the point.** A result set is a *group* of results that is acted on as a group.
The value is not that a group exists, but that **several groups of the same kind of thing can
exist side by side over the same images** — Reader A and Reader B, baseline and follow-up, AI
v2 and AI v3 — and each can be shown, hidden, compared, edited, and saved as one unit. Every
capability in §4 exists to make that possible without the user having to track the underlying
DICOM objects.

**Applicability is explicit.** A result does not simply "belong to a series". It applies to
image data through a stated rule: by Frame of Reference, by series or display set, by a
specific instance and frame, or only while that frame is in view. Making this explicit is what
lets one mechanism serve a labelmap that spans a whole volume and a 2D annotation that must
appear on exactly one image.

The contract is not a sidebar feature. It shows up in the sidebar, in the top menu bar, in
display-set creation for secondary DICOM objects, in hanging protocols, and in the save path —
§5 covers each of those surfaces.

## 2. Scope

### 2.1 In scope

- The general result-set contract (§4), written for **any** result type.
- The surfaces that contract appears on (§5): top menu bar, tool activation, sidebars,
  display-set creation.
- The general sidebar contract (`SB`, §5.3), stated component-neutrally.
- **Labelmap** and **contour** segmentation as the first two implemented representations (§6).

### 2.2 Out of scope for this phase

These are result types the contract is designed to carry, but which this phase does not
implement. Each is named so the contract can be checked against it.

| Deferred result type or capability | What the contract must not preclude |
| --- | --- |
| Measurements and annotations | Instance- and frame-scoped applicability (`RS-APP-5`, `RS-APP-6`) exists specifically for these. |
| DICOM Key Object Selection | Non-renderable members (`RS-DEF-5`) and study-scoped applicability (`RS-APP-7`). |
| Key images and key series | Study- and series-scoped members (`RS-APP-2`), and a coverage model able to group by them when it is specified. |
| Registrations, statistics, and other non-visual results | `RS-DEF-5`. |
| SR and KO export | Export partitioning (`RS-SAVE-7`..`RS-SAVE-13`) is written per modality, not per result type. |
| Writing a single DICOM object across studies | `RS-SAVE-12`. |
| Concurrent editing and external-update reconciliation | Only single-session change tracking is required. |
| Rewriting the sidebars catalogued in §5.5 other than the result-set sidebar | `EM-SID-4`, `EM-CFG` equivalents in `EM`. |

### 2.3 Terminology decision

The user-facing and API term is **result set**. This resolves open question 8 of the source
issue. Modes may override the displayed noun per workflow (`RS-CFG-4`).

### 2.4 Phases

This specification is larger than any one change. Requirements are delivered in phases, and a
requirement carries a **phase marker** naming the phase that delivers it:

```
**RS-TOOL-1** *(phase 1)*
```

A phase is a set of requirements that can be delivered and verified together and that leaves the
viewer coherent when it lands. An unmarked requirement is **not yet assigned to a phase**; the
absence of a marker says nothing about priority.

| Phase | Delivers |
| --- | --- |
| 1 | Tool selection moves to the top menu bar — [CP-SEGTOOL](../changes/segmentation-tool-submenu.md) |

Phases beyond the first are not yet assigned. If the phase set grows enough that markers become
hard to read across the document, it is split into per-phase documents; until then the markers
are the record.

## 3. Definitions

### 3.1 Results

| Term | Definition |
| --- | --- |
| **Primary images** | The acquired or reconstructed image data a viewport displays. |
| **Result** | Anything derived from, or asserted about, primary images. Secondary by definition. |
| **Result type** | The class a result belongs to: `segmentation`, `annotation`, `keyObject`, `keySeries`, `registration`, and so on. Registered, not hard-coded. |
| **Representation** | How a result of a given type is held, rendered, and encoded. For `segmentation`: `Labelmap`, `Contour`, `Surface`. |
| **Result set** | A named group of results, identified by a stable `resultSetId`, acted on as one unit. |
| **Member** | One result belonging to a result set. |
| **Provenance** | The DICOM identity a member was imported from, or the record that it was created or derived locally. |

### 3.2 Applicability and display

| Term | Definition |
| --- | --- |
| **Applicability** | The rule deciding which image data a result applies to. See `RS-APP`. |
| **Applicability scope** | One of `frameOfReference`, `displaySet`, `series`, `instance`, `study`. |
| **In-view applicability** | An additional condition that a result is shown only while its referenced frame is within the viewport's current view. |
| **Applicable** | A result is applicable to a viewport when its applicability rule resolves against a display set loaded in that viewport. A result set is applicable to a viewport when any of its members is. |
| **Result layer** | An entry in a viewport's ordered list of displayed result sets. |
| **Coverage** | For a given result component, the image locations at which it has content. |
| **Changed** | A result set with at least one member differing from its last persisted state, or never persisted. |

### 3.3 Sidebars

| Term | Definition |
| --- | --- |
| **Sidebar** | A side panel in a mode's left or right panel position. |
| **Sub-tab** | A view within a sidebar organizing that sidebar's content differently from its peers. |
| **Item** | One row a sidebar lists. |
| **Backing service** | The service owning the data a sidebar displays. A sidebar never owns it. |

---

## 4. The result-set contract — `RS`

Type-agnostic. Nothing in this section is specific to segmentation.

EARS patterns used: **ubiquitous** (`The system shall …`), **event-driven** (`WHEN … the
system shall …`), **state-driven** (`WHILE … the system shall …`), **optional feature**
(`WHERE … the system shall …`), and **unwanted behaviour** (`IF … THEN the system shall …`).
Throughout, *the system* means the OHIF Viewer application.

### 4.1 Results and result types — `RS-DEF`

**RS-DEF-1**
The system shall treat every result as belonging to a registered result type.

**RS-DEF-2**
The system shall allow extensions to register result types without modifying the result-set
model.

**RS-DEF-3**
The system shall record for every result type the representations it supports, its default
applicability scope, and the DICOM modalities it can be imported from and exported to.

**RS-DEF-4**
The system shall handle a result of any registered type through the same identity, grouping,
membership, applicability, visibility, change-state, and save mechanisms.

**RS-DEF-5**
The system shall not require a result type to be renderable in a viewport in order for its
results to belong to a result set.

> **Note (RS-DEF-5):** Key object selections, key series designations, registrations, and
> computed statistics are results with no pixels to draw. They still need grouping, change
> state, and saving.

**RS-DEF-6**
The system shall record for every result the primary image data it derives from or asserts
about.

**RS-DEF-7**
The system shall allow a result type to declare which operations of `RS-OPS` apply to it.

### 4.2 Grouping — `RS-GRP`

This is the primary capability. Everything else in §4 supports it.

**RS-GRP-1**
The system shall allow more than one result set to hold results of the same result type over the
same primary images.

**RS-GRP-2**
The system shall allow a result set to hold results of more than one result type.

**RS-GRP-3**
The system shall not require the members of a result set to share a series, a study, or a Frame
of Reference.

**RS-GRP-4**
The system shall apply visibility, save, discard, delete, export, and comparison as operations
on a whole result set.

**RS-GRP-5**
WHEN a group-level operation is applied to a result set, the system shall apply it to every
member for which the operation is meaningful, and shall report the members it could not be
applied to and why.

**RS-GRP-6**
The system shall allow two or more result sets holding the same result type to be displayed
simultaneously.

**RS-GRP-7**
WHILE more than one result set is displayed in the same viewport, the system shall visually
distinguish the sets from one another.

**RS-GRP-8**
The system shall allow two result sets to be compared as groups, without requiring the user to
pair their members manually.

**RS-GRP-9**
WHEN a member is added to or removed from a result set, the system shall not alter any other
result set.

### 4.3 Identity and lifecycle — `RS-ID`

**RS-ID-1**
The system shall assign every result set a `resultSetId` that is unique within the session and
stable for the lifetime of that result set.

**RS-ID-2**
The system shall assign every result set a user-visible name that is independent of any
`SeriesDescription`, `SOPInstanceUID`, or `SeriesInstanceUID`.

**RS-ID-3**
The system shall allow a result set to contain members that reference more than one series.

**RS-ID-4**
The system shall allow a result set to contain members that reference more than one study.

**RS-ID-5**
WHEN the user renames a result set, the system shall update the name in every view of that
result set without altering member identity, member data, or DICOM provenance.

**RS-ID-6**
WHEN a result set is created without a user-supplied name, the system shall generate a default
name that is unique among the currently loaded result sets.

**RS-ID-7**
WHEN the user deletes a result set, the system shall require an explicit confirmation that names
the members that will be removed.

**RS-ID-8**
WHEN a mode is exited, the system shall discard all in-session result-set state.

> **Note (RS-ID-8):** Cross-mode persistence is out of scope for this phase; a later phase may
> add it without changing the identity model. Deleting a result set is distinct from removing a
> sub-tab, which `SB-COMP-5` constrains to removing only an organization of the data.

### 4.4 Membership and provenance — `RS-MEM`

**RS-MEM-1**
The system shall record, for every member, its result type, its representation, its backing data
identifier, its applicability, and its provenance.

**RS-MEM-2**
The system shall preserve the imported DICOM identity and provenance of every member, and shall
make it available for inspection, conflict handling, and export, for as long as the member
exists.

**RS-MEM-3**
The system shall allow a member to belong to exactly one result set at a time.

> **Note (RS-MEM-3):** A single-owner model keeps membership indices, change propagation, and
> save partitioning unambiguous. Presenting the same data under two names is achieved by copying
> the member into a second result set (`RS-OPS-2`), which produces distinct member identities and
> distinct provenance.

**RS-MEM-4**
WHEN a member is added to or removed from a result set, the system shall update the membership
index and shall emit an event identifying the affected `resultSetId` and `memberId`.

**RS-MEM-5**
WHEN the backing data of a member is removed by any other service, the system shall remove the
corresponding member from its result set and shall emit the corresponding event.

**RS-MEM-6**
The system shall allow a result set to contain members of more than one representation of the
same result type simultaneously.

**RS-MEM-7**
The system shall record for each member whether it was imported, created locally in the current
session, or derived from other members.

### 4.5 Applicability — `RS-APP`

**RS-APP-1**
The system shall record for every member an applicability rule stating an applicability scope
and the identifiers that scope requires.

**RS-APP-2**
The system shall support at least the applicability scopes `frameOfReference`, `displaySet`,
`series`, `instance`, and `study`.

**RS-APP-3**
WHERE a member's scope is `frameOfReference`, the system shall consider that member applicable to
every display set sharing the referenced `FrameOfReferenceUID`.

**RS-APP-4**
WHERE a member's scope is `displaySet` or `series`, the system shall consider that member
applicable only to the referenced display set or series, and shall not consider it applicable to
other display sets sharing its Frame of Reference.

**RS-APP-5**
WHERE a member's scope is `instance`, the system shall consider that member applicable only to
display sets containing the referenced SOP instance, and, where a frame number is given, only to
that frame.

**RS-APP-6**
WHERE a member declares in-view applicability, the system shall display that member only while
the frame it references is within the viewport's current view, and shall hide it otherwise
without discarding it.

**RS-APP-7**
WHERE a member's scope is `study`, the system shall consider that member applicable to the study
as a whole and shall not require it to resolve to any display set.

**RS-APP-8**
The system shall apply a result type's default applicability scope to a member that does not
state one, and shall allow a member to state a scope that differs from its type's default.

**RS-APP-9**
The system shall evaluate applicability without loading the member's backing data.

> **Note (RS-APP-9):** This is what lets the sidebar list, group, and offer a result set before
> any of its objects have been retrieved.

**RS-APP-10**
The system shall consider a result set applicable to a viewport if any of its members is
applicable to that viewport.

**RS-APP-11**
WHEN the display sets loaded in a viewport change, the system shall re-evaluate applicability for
that viewport only.

**RS-APP-12**
The system shall make each member's applicability rule, and the display sets it currently
resolves to, available for inspection.

**RS-APP-13**
WHILE a member is applicable to a viewport but its data is defined on a different acquisition
geometry than the viewport is displaying, the system shall indicate that the member is not being
shown in its acquisition geometry.

**RS-APP-14**
IF a member's applicability rule cannot be resolved against any loaded display set, THEN the
system shall retain the member, shall present it as not currently displayable, and shall state
what it references.

### 4.6 Display sets for secondary results — `RS-DS`

**RS-DS-1**
WHEN a DICOM object carrying results is loaded, the system shall create a display set for it and
shall record on that display set the result type or types it carries.

**RS-DS-2**
The system shall mark display sets that exist only to carry results so that they do not
participate in viewport layout as primary images unless explicitly selected.

**RS-DS-3**
WHEN a display set carrying results is created, the system shall assign those results to a result
set before the display set is offered to the user.

**RS-DS-4**
The system shall record on a display set carrying results the applicability of the results it
carries.

**RS-DS-5**
The system shall complete display-set creation and result assignment without requiring any
viewport to be displaying the data.

**RS-DS-6**
WHERE a display set carrying results can also be displayed as primary images in its own right,
the system shall allow that while continuing to treat its results as result-set members.

**RS-DS-7**
WHERE a hanging protocol matches a display set carrying results, the system shall apply the
matched results as result layers on the appropriate viewports rather than as primary viewport
content.

**RS-DS-8**
The system shall allow more than one hanging protocol rule to match display sets carrying results
for a single viewport.

**RS-DS-9**
IF a display set carrying results is removed, THEN the system shall remove the corresponding
members and shall leave the rest of their result sets intact.

### 4.7 Import and grouping rules — `RS-IMP`

**RS-IMP-1**
WHEN DICOM objects carrying results are loaded, the system shall assemble them into result sets
by applying the configured grouping rules in priority order.

**RS-IMP-2**
WHERE a loaded object's series carries a `RelatedSeriesSequence` item marking result-set
membership, the system shall use that relationship in preference to any heuristic rule when
assigning the object to a result set.

**RS-IMP-2a**
WHEN the system assigns an object by `RelatedSeriesSequence`, it shall also assign every other
series related to the same result set, including series of other modalities and, where present,
series in other studies.

> **Note (RS-IMP-2a):** This is the read side of `RS-SAVE-10`. Loading the SEG series of a
> segmentation-plus-annotations result set has to bring in the SR series too, or the set the user
> saved is not the set they get back.

**RS-IMP-3**
WHERE no result-set membership relationship is present, the system shall apply the configured
fallback matching rules, which shall be able to consider result-set name, `SeriesDescription`,
`SeriesNumber`, modality, referenced series and instances, `ContentCreatorName`, and study
context.

**RS-IMP-4**
IF no grouping rule matches a loaded object, THEN the system shall place that object in its own
new result set named from its `SeriesDescription`, falling back to its modality and
`SeriesNumber` when `SeriesDescription` is absent.

**RS-IMP-5**
WHEN the user loads results, the system shall offer to add them to an existing compatible result
set, load them as a new result set, or replace the result set currently shown in the result-set
sidebar.

**RS-IMP-6**
WHEN a result set is loaded, the system shall load every component of that result set across all
series and studies to which its members apply, without requiring the user to locate and load each
backing DICOM object individually.

**RS-IMP-7**
WHERE several versions or several creators of comparable results are present, the system shall
represent them as distinct result sets and shall not silently select one or merge them.

**RS-IMP-8**
IF a backing DICOM object belonging to a result set fails to load, THEN the system shall load the
remaining members, shall mark the result set as incompletely loaded, and shall report which
object failed and why.

**RS-IMP-9**
WHEN grouping rules are evaluated, the system shall record on each result set which rule assigned
each member, and shall make that record available for inspection.

**RS-IMP-10**
The system shall complete import grouping without requiring any viewport to be displaying the
imported data.

### 4.8 Viewport result layers — `RS-VP`

**RS-VP-1**
The system shall maintain, for each viewport, an ordered list of result layers, each identifying
a `resultSetId`, an optional result-type or representation filter, and a visibility state.

**RS-VP-2**
The system shall provide a result-layer specification that is reachable from the viewport and
from the layout configuration.

**RS-VP-3**
WHEN the user sets a viewport's result layers, the system shall display exactly the selected
result sets in that viewport and shall not alter the result layers of any other viewport.

**RS-VP-4**
The system shall allow a viewport to display no result set, exactly one result set, or more than
one result set simultaneously.

**RS-VP-5**
IF the number of simultaneously visible result layers in a viewport would exceed the configured
rendering limit, THEN the system shall refuse the addition and shall report the limit to the
user.

**RS-VP-6**
WHEN a result set is loaded and no explicit viewport selection has been made for it, the system
shall apply the configured default viewport visibility.

**RS-VP-7**
The system shall support at least the default viewport visibility policies `none`,
`activeViewport`, and `allApplicableViewports`, and shall use `allApplicableViewports` when no
policy is configured.

> **Note (RS-VP-7):** This resolves open question 3 of the source issue. The default matches the
> behaviour users see today when a SEG is hydrated onto every viewport showing its referenced
> series, which keeps the change non-disruptive. "Applicable" is `RS-APP-10`, so a
> `frameOfReference`-scoped member reaches every viewport in that Frame of Reference while an
> `instance`-scoped member reaches only the viewport showing that image.

**RS-VP-8**
WHEN a viewport's displayed display set changes, the system shall re-evaluate applicability of
that viewport's result layers, shall retain layers that remain applicable, and shall hide without
discarding those that do not.

**RS-VP-9**
WHILE a result set is hidden in a viewport, the system shall retain that result set's data, change
state, and membership unaltered.

**RS-VP-10**
WHEN the layout changes and a viewport is restored, the system shall restore that viewport's
result layers from presentation state.

**RS-VP-11**
WHERE a sidebar offers result visibility controls, the system shall have those controls update the
result-layer model, and shall not maintain a sidebar-private visibility mechanism.

**RS-VP-12**
The system shall allow the same result set to be visible in more than one viewport simultaneously.

**RS-VP-13**
The system shall allow the visibility of an individual member to be controlled within a visible
result layer, without removing the layer.

### 4.9 Change and persistence state — `RS-STATE`

**RS-STATE-1**
The system shall maintain for every result set exactly one of the persistence states `unchanged`,
`changed`, `saving`, `saved`, `saveFailed`, or `partiallySaved`.

**RS-STATE-2**
The system shall maintain the same set of persistence states independently for every member.

**RS-STATE-3**
WHEN any member of a result set enters the `changed` state, the system shall place the owning
result set in the `changed` state.

**RS-STATE-4**
WHILE a result set is in the `changed` state, the system shall show a change indicator on that
result set in every view that lists it.

**RS-STATE-5**
WHILE a result set is in the `changed` state, the system shall keep the change indicator visible
until every changed member has been saved successfully or the changes have been discarded.

**RS-STATE-6**
WHEN a save completes and every member was persisted successfully, the system shall place the
result set in the `saved` state and shall clear the change indicator.

**RS-STATE-7**
IF a save completes and at least one member was persisted successfully and at least one was not,
THEN the system shall place the result set in the `partiallySaved` state, shall keep the change
indicator visible, and shall report per-member which members failed and why.

**RS-STATE-8**
IF a save completes and no member was persisted successfully, THEN the system shall place the
result set in the `saveFailed` state, shall keep the change indicator visible, and shall report
the failure reason.

**RS-STATE-9**
WHEN the user discards the changes to a result set, the system shall require explicit confirmation
naming the members whose changes will be lost.

**RS-STATE-10**
IF the user attempts to navigate away from the study or to exit the mode while any result set is
in the `changed` state, THEN the system shall warn the user and shall name the affected result
sets.

**RS-STATE-11**
WHILE a result set is in the `saving` state, the system shall prevent a second concurrent save of
that result set.

### 4.10 Save and export — `RS-SAVE`

**RS-SAVE-1**
The system shall allow the user to save a result set as one operation, without managing each
backing DICOM object separately.

**RS-SAVE-2**
WHEN the user initiates a save, the system shall present a summary before writing anything, and
that summary shall state the result-set name, the studies and source series represented, the
changed and unchanged members, the DICOM objects and modalities that will be created or replaced,
and any conversion required before saving.

**RS-SAVE-3**
WHEN the user initiates a save, the system shall allow the user to supply or confirm the name
applied to the saved result set.

**RS-SAVE-4**
WHERE more than one encoding is valid for a member, the system shall allow the user to select an
alternate output type for that member.

**RS-SAVE-5**
The system shall support saving a member in any output type its result type declares under
`RS-DEF-3`, subject to `RS-SAVE-14`.

**RS-SAVE-6**
WHERE no alternate output type is requested for a member, the system shall preserve that member's
current representation on save.

**RS-SAVE-7**
WHEN a result set is saved, the system shall write all output objects of the same DICOM modality
within one study into a single DICOM series for that result set.

**RS-SAVE-8**
WHEN a result set is saved and it produces output objects of more than one modality within one
study, the system shall assign a distinct `SeriesInstanceUID` per modality.

**RS-SAVE-9**
WHEN a result set produces more than one output series within one study, the system shall give
those series the same `SeriesDescription` and the same `SeriesNumber`.

**RS-SAVE-10**
WHEN a result set produces more than one output series, the system shall relate those series to
one another using `RelatedSeriesSequence` (0008,1250).

> **Note (RS-SAVE-10):** This is the mechanism that holds a combined result set together across
> the modality boundaries `RS-SAVE-8` creates. A result set containing a segmentation and the
> annotations that describe it is written as a SEG series and an SR series; nothing in either
> object otherwise states that they are one piece of work.

**RS-SAVE-10a**
Each `RelatedSeriesSequence` item the system writes shall carry the referenced
`StudyInstanceUID`, the referenced `SeriesInstanceUID`, and a `PurposeOfReferenceCodeSequence`
identifying the relationship as result-set membership.

**RS-SAVE-10b**
The system shall write the relationship so that the full membership of a result set is
determinable from the series-level metadata of the studies it spans, without requiring any
particular series to be retrieved first.

**RS-SAVE-10c**
WHEN a result set is saved again and produces an output series it did not previously produce, the
system shall relate the new series to the existing ones without modifying any previously written
instance.

> **Note (RS-SAVE-10b, RS-SAVE-10c):** Stored instances are immutable, so a scheme in which every
> series references every other cannot survive a later save that adds a modality — the existing
> series would have to be rewritten. A single anchor series referenced by every member satisfies
> both requirements and is what the design is expected to adopt.

**RS-SAVE-10d**
WHERE a result set spans more than one study, the system shall relate the output series of each
study to the output series of the others.

> **Note (RS-SAVE-10d):** `RS-SAVE-12` forbids a single DICOM object from spanning studies, so
> cross-study relation is the only mechanism by which a cross-study result set can be recovered on
> reload. `RelatedSeriesSequence` items carry a `StudyInstanceUID`, so they can express it.

**RS-SAVE-10e**
The system shall distinguish result-set membership from any other relationship recorded in
`RelatedSeriesSequence`, and shall not treat an unrelated item as membership.

**RS-SAVE-11**
WHEN saving a new version of a member that was previously persisted, the system shall create a new
SOP Instance whose `PredecessorDocumentsSequence` (0040,A360) references the `SOPInstanceUID` it
supersedes.

**RS-SAVE-11a**
WHEN a member has been saved more than once, the system shall reference only the immediately
preceding `SOPInstanceUID`, and shall not restate the whole version chain.

> **Note (RS-SAVE-11):** `PredecessorDocumentsSequence` is the standard attribute for "this
> instance supersedes that one", carrying `StudyInstanceUID`, `SeriesInstanceUID`, and the
> referenced SOP Class and Instance UIDs. Using it uniformly across SEG, RTSTRUCT, SR, and KO means
> one attribute expresses versioning for every output type, and the reader that reconstructs a
> version chain on import does not branch per modality.
>
> It is defined in the SR Document General and Key Object Document modules, so writing it on SEG
> and RTSTRUCT is an extension of its defined scope rather than a use the standard already
> mandates. It is a standard attribute with the exact required semantics and no conflicting
> meaning elsewhere, which makes it a better choice than a private tag or a private purpose code;
> confirming or formalizing its use for image-derived IODs is §10 item 1.

**RS-SAVE-12**
WHEN a result set spans more than one study, the system shall partition its output per study and
shall not write a single DICOM object that spans studies.

**RS-SAVE-13**
WHEN a result set saved by the system is loaded again, the system shall reconstruct its output
objects as one result set.

**RS-SAVE-14**
IF a member requires a representation conversion in order to be saved in the selected output type,
THEN the system shall state the conversion and its consequences in the save summary before writing.

**RS-SAVE-15**
The system shall perform export partitioning in the persistence layer, and shall not require a
sidebar or any sub-tab to compute it.

**RS-SAVE-16**
IF a save is attempted while the result set has no changed member, THEN the system shall state that
there is nothing to save and shall allow the user to force a save anyway.

**RS-SAVE-17**
The system shall record on each output object the applicability of the results it carries, so that
`RS-APP` can be reconstructed on reload without re-deriving it.

### 4.11 Operations and conversion — `RS-OPS`

**RS-OPS-1**
The system shall offer conceptually applicable operations consistently across the representations
of a result type.

**RS-OPS-2**
The system shall provide as representation-independent operations at least: copy a member, combine,
intersect, and subtract two members, compute statistics, and compare two result sets.

**RS-OPS-3**
The system shall provide explicit conversion between the representations a result type declares
under `RS-DEF-3`.

**RS-OPS-4**
WHEN a conversion is offered, the system shall state its material consequences, including loss of
fidelity, rasterization resolution, changed topology, and creation of a derived copy.

**RS-OPS-5**
WHEN an operation requires a representation that a selected member does not have, the system shall
offer the required conversion rather than presenting the operation as unavailable.

**RS-OPS-6**
WHEN a conversion is performed as part of an operation, the system shall produce a derived copy and
shall leave the source member unmodified, unless the user explicitly chooses conversion in place.

**RS-OPS-7**
IF two members selected for a binary operation are not defined on compatible geometry, THEN the
system shall refuse the operation and shall state the incompatibility.

**RS-OPS-8**
WHEN an operation produces a new member, the system shall add it to a result set, mark that result
set as changed, and record the operation and its inputs in the new member's provenance.

**RS-OPS-9**
WHEN a group-level operation is applied to result sets rather than members, the system shall pair
the members of those sets by result type and applicability before operating.

### 4.12 Performance — `RS-PERF`

**RS-PERF-1**
The system shall resolve which result layers are displayed in a given viewport in time independent
of the number of loaded result sets, members, results, and display sets.

**RS-PERF-2**
The system shall resolve which viewports display a given result set in time independent of the
number of viewports and result sets.

**RS-PERF-3**
WHEN a single result layer is added to, removed from, or changed in a viewport, the system shall
perform the result-set orchestration work in time independent of the total number of result sets,
members, results, and display sets.

**RS-PERF-4**
WHEN a single member changes, the system shall update only the affected result-set and viewport
index entries and shall emit a targeted event, and shall not reconstruct the result-set state.

**RS-PERF-5**
The system shall maintain indices keyed by at least `resultSetId`, `memberId`, `viewportId`,
backing data identifier, `FrameOfReferenceUID`, `StudyInstanceUID`, `SeriesInstanceUID`,
`SOPInstanceUID`, and `displaySetInstanceUID`.

**RS-PERF-6**
The system shall maintain a coverage index keyed by result component, source series, and
acquisition plane.

**RS-PERF-7**
WHEN a change originates in an existing OHIF service, the system shall update only the
corresponding result-set and viewport entries.

**RS-PERF-8**
The system shall evaluate the applicability of one member against one viewport in time independent
of the number of loaded display sets.

> **Note (RS-PERF-1..4, 8):** These constrain the *orchestration lookup* only. The rendering work
> triggered by a layer change may legitimately scale with the number of affected frames.

### 4.13 Configuration and extensibility — `RS-CFG`

**RS-CFG-1**
The system shall allow modes, data sources, and deployments to configure the import grouping rules
and their priority order.

**RS-CFG-2**
The system shall allow modes, data sources, and deployments to configure the export grouping and
versioning rules.

**RS-CFG-3**
The system shall allow modes and extensions to register result-set sub-tab implementations and to
configure the default sub-tab set and order, in conformance with `SB-COMP-3` and `SB-COMP-4`.

**RS-CFG-4**
The system shall allow the user-facing noun for a result set to be configured per mode.

**RS-CFG-5**
The system shall allow the default viewport visibility policy of `RS-VP-7` to be configured.

**RS-CFG-6**
The system shall allow the maximum number of simultaneously visible result layers per viewport to
be configured.

**RS-CFG-7**
The system shall allow the default applicability scope of a result type to be configured per
deployment.

### 4.14 Compatibility — `RS-COMPAT`

**RS-COMPAT-1**
The system shall continue to support the existing segmentation and measurement service APIs for the
duration of this phase.

**RS-COMPAT-2**
WHEN a result is created by any path that does not specify a result set, the system shall place it
in a result set so that no result exists outside the result-set model.

**RS-COMPAT-3**
WHERE a mode has not adopted the result-set sidebar, the system shall preserve that mode's existing
panel behaviour, in conformance with `EM-SID-4` and `EM-LAY-8`.

**RS-COMPAT-4**
The system shall not change the DICOM output produced for a single-member result set relative to
the output produced today for the equivalent single result, other than the additions required by
`RS-SAVE-10`, `RS-SAVE-11`, and `RS-SAVE-17`.

---

## 5. Surfaces

The §4 contract is not a panel feature. It surfaces in four places.

### 5.1 Top menu bar — `RS-UI`

**RS-UI-1**
The system shall make the active result set and the active member of the active viewport available
to toolbar buttons for enablement and for state display.

**RS-UI-2** *(phase 1)*
The system shall present in the top menu bar the tool sections of every result type applicable to
the active viewport.

**RS-UI-3** *(phase 1)*
WHERE more than one result type is applicable to the active viewport, the system shall indicate for
each tool which result type it creates or edits.

**RS-UI-4**
The system shall show in the top menu bar the name and change state of the active result set for
the active viewport.

**RS-UI-5**
WHEN the user changes the active result set from the top menu bar, the system shall apply that
change to the active viewport only.

**RS-UI-6**
The system shall make save and discard for the active result set reachable from the top menu bar.

**RS-UI-7**
IF no result set is applicable to the active viewport, THEN the system shall present the tools
requiring one as unavailable and shall state the reason.

**RS-UI-8**
WHEN the active viewport changes, the system shall update the top menu bar to reflect the newly
active viewport's applicable result types and active result set.

### 5.2 Tool activation and create-on-first-use — `RS-TOOL`

**RS-TOOL-1** *(phase 1)*
The system shall make every tool that creates or edits results selectable from the standard OHIF
toolbar and tool menus, in conformance with `EM-TOP-1`.

**RS-TOOL-2** *(phase 1)*
The system shall not require a sidebar to be open, or a result set to exist, in order for such a
tool to be selectable.

**RS-TOOL-3**
WHEN a tool that creates or edits results is activated, the system shall resolve a target result
set for the active viewport before the first edit is committed.

**RS-TOOL-4**
WHEN target resolution finds exactly one applicable result set among the active viewport's result
layers, the system shall use that result set without prompting the user.

**RS-TOOL-5**
WHEN target resolution finds more than one applicable result set among the active viewport's result
layers and one of them is marked active for that viewport, the system shall use the active one
without prompting the user.

**RS-TOOL-6**
WHEN target resolution finds more than one applicable result set among the active viewport's result
layers and none is marked active, the system shall prompt the user to select one of them or to
create a new result set.

**RS-TOOL-7**
WHEN target resolution finds no applicable result set, the system shall create a new result set,
create the member and representation required by the activated tool with the applicability its
result type declares, mark the result set as changed, open or reveal the result-set sidebar, select
the appropriate sub-tab, and show the new member in it.

**RS-TOOL-8**
WHEN a member is created by `RS-TOOL-7`, the system shall create it without any additional user step
beyond activating the tool.

**RS-TOOL-9**
IF the user cancels the selection prompt of `RS-TOOL-6`, THEN the system shall not create a result
set, shall not create a member, and shall not commit the pending edit.

**RS-TOOL-10**
IF the active viewport displays no image data that the activated tool's result type can apply to,
THEN the system shall present the tool as unavailable and shall state the reason.

**RS-TOOL-11**
WHEN a tool commits an edit, the system shall mark the owning result set as changed.

**RS-TOOL-12**
The system shall apply `RS-TOOL-3` through `RS-TOOL-11` identically for every result type.

### 5.3 The general sidebar contract — `SB`

These apply to every OHIF sidebar, present and future, and say nothing about results.

#### 5.3.1 Composition — `SB-COMP`

**SB-COMP-1**
The system shall compose every sidebar from a header region identifying what is being shown, an
action region, and a content region.

**SB-COMP-2**
The system shall present alternative organizations of a sidebar's content as sub-tabs within that
sidebar.

**SB-COMP-3**
The system shall allow modes and extensions to register sub-tab implementations for a sidebar
without modifying that sidebar's data model or its backing service.

**SB-COMP-4**
The system shall allow the configured sub-tab set of a sidebar to be added to, removed from, and
reordered.

**SB-COMP-5**
IF a sub-tab is removed from a sidebar's configuration, THEN the system shall remove only that
organization of the content and shall not delete any underlying data.

**SB-COMP-6**
The system shall allow more than one sub-tab of the same sidebar to present the same item
simultaneously.

#### 5.3.2 Ownership — `SB-OWN`

**SB-OWN-1**
The system shall have every sidebar read its content from a backing service, and shall not have a
sidebar be the owner of that content.

**SB-OWN-2**
The system shall not require a sub-tab to maintain a private copy of, or a private store for, the
data it organizes.

**SB-OWN-3**
WHILE a sidebar is closed or has never been opened, the system shall keep every capability that
sidebar exposes available through its backing service and through commands.

**SB-OWN-4**
IF a sidebar is closed while an operation initiated from it is in progress, THEN the system shall
complete that operation and shall report its outcome.

**SB-OWN-5**
WHEN the data in a backing service changes, the system shall reflect that change in every open
sidebar that presents it, without requiring the user to reopen or refresh the sidebar.

#### 5.3.3 Tools versus actions — `SB-TOOL`

The tool-versus-action distinction, and the placement each implies, are specified by
[Extensions and modes (`EM`)](../extensions-and-modes/requirements.md). They are not restated
here, because they are not sidebar-specific: the same rule decides what may appear in a viewport
action menu or in the header.

| Concern | Requirement |
| --- | --- |
| Tool selection appears in the top menu bar | `EM-TOP-1`, `EM-TOP-2` |
| A side panel region does not host tool selection | `EM-SID-6` |
| A sidebar does not host per-viewport display options | `EM-SID-7` |
| What counts as a tool rather than an action on a selection | `EM-PLC-4` |
| Actions on a sidebar's current selection belong in that sidebar | `EM-PLC-1` |
| A capability is defined once and referenced, not duplicated per region | `EM-PLC-2` |
| Moving a capability between regions does not require reimplementing it | `EM-PLC-5` |

**SB-TOOL-1** *(phase 1)*
Every sidebar shall satisfy `EM-PLC-1`..`EM-PLC-5`, `EM-SID-6`, and `EM-SID-7`.

**SB-TOOL-2** *(phase 1)*
WHEN an action offered by a sidebar requires a tool to become active, the system shall activate
that tool through the standard tool activation path rather than through a sidebar-private
mechanism.

> **Note (SB-TOOL-2):** This is the one part of the distinction that is genuinely sidebar-specific,
> and it is what makes `EM-PLC-5` hold in practice — a sidebar that activates tools its own way
> becomes a second tool system the top menu bar does not know about.

### 5.4 Deferred to a lower-level specification

The detailed behaviour of a sidebar — selection and navigation, status display, its relationship
to the active viewport, its update performance, and its configuration — was drafted here and has
been removed. So were the result-set sidebar's own requirements and the coverage view.

They were too specific for this document. This specification says which surfaces the result-set
contract appears on and what each is responsible for; it does not specify how a list behaves. A
lower-level specification will carry them.

| Withdrawn group | Covered | Identifiers |
| --- | --- | --- |
| `SB-SEL` | Active item, cross-sub-tab selection, navigation to a representative location | `SB-SEL-1`..`SB-SEL-5` |
| `SB-STAT` | Visibility and change indicators, empty states, load failures | `SB-STAT-1`..`SB-STAT-4` |
| `SB-VP` | Reflecting the active viewport, shared visibility model | `SB-VP-1`..`SB-VP-3` |
| `SB-PERF` | Targeted updates, per-row resolution cost | `SB-PERF-1`, `SB-PERF-2` |
| `SB-CFG` | Sidebar and sub-tab labels, panel positions, non-adopting modes | `SB-CFG-1`..`SB-CFG-3` |
| `RS-VIEW` | The result-set sidebar's own content and built-in sub-tabs | `RS-VIEW-1`..`RS-VIEW-8` |
| `RS-COV` | The coverage view: where a result has content, and navigating to it | `RS-COV-1`..`RS-COV-7` |

These identifiers are retired. Per the [register's stability rule](../index.md#2-requirement-identifiers)
they are not reused, so a lower-level specification restating this behaviour takes its own prefix.

### 5.5 Sidebars built on the contract

This catalogue exists to show that §5.3 is not shaped around one panel, and to name where each
future specification attaches. Only the result-set sidebar is required to conform in this phase.

| Sidebar | Lists | Backing service | Illustrative sub-tabs | Specification |
| --- | --- | --- | --- | --- |
| **Result set** | Result sets and their members | `ResultSetService` | Members · Coverage · Changes | This document, plus the lower-level specification of §5.4 |
| **Segmentation** | Segments of the active segmentation member | `SegmentationService`, via the result-set model | Segments · Statistics · Coverage by plane | Planned, prefix `SG` |
| **Contour** | ROIs of the active contour member | `SegmentationService`, via the result-set model | ROIs · Coverage by plane · Interpolation status | Planned, prefix `CT` |
| **Measurement** | Measurements and annotations | `MeasurementService` | By series · By finding · Required measurements | Planned, prefix `MS` |
| **Study and series** | Display sets for current and prior studies | `DisplaySetService` | All series · Priors · Derived objects | Planned, prefix `SS` |
| **Workflow** | Steps of a guided workflow | `WorkflowStepsService` | Steps · Outstanding items | Planned, prefix `HP` |

#### 5.5.1 Worked example — one sub-tab, three sidebars

A *coverage* sub-tab lists, per result component, which source series and acquisition planes
contain content. Under §5.3 it is registered once and can be configured into the result-set
sidebar scoped to every member of the selected set, into the segmentation sidebar
scoped to the active segmentation member, and into the contour sidebar scoped to the active
contour member. It works in all three because `SB-OWN-2` forbids it from having its own store.

#### 5.5.2 Worked example — why tools left the panel

Today the labelmap and contour toolboxes render inside the segmentation panel. That placement
produces two of the symptoms in the source issue: a tool cannot be used until the panel is open,
and the tool's target is whatever the panel happens to have selected.

`EM-SID-6` moves tool selection out of the panel, `EM-TOP-1` puts it in the top menu bar, and
`RS-UI-2` puts the applicable result types there; `SB-OWN-3` requires the capability to remain
available with the sidebar closed. The target is then resolved from viewport applicability rather
than panel state, which is what `RS-TOOL-3` through `RS-TOOL-12` specify. The concrete move is
[CP-SEGTOOL](../changes/segmentation-tool-submenu.md).

---

## 6. Result types implemented in this phase

The only result type implemented here is **`segmentation`**, with two representations.

| Property (`RS-DEF-3`) | `segmentation` |
| --- | --- |
| Representations | `Labelmap`, `Contour` (`Surface` exists in rendering but is not a result-set member in this phase) |
| Default applicability scope | `frameOfReference` (`RS-APP-3`) |
| Import modalities | `SEG`, `RTSTRUCT` |
| Export modalities | `SEG`, `RTSTRUCT` |
| Representation-independent operations | copy, combine, intersect, subtract, statistics, compare (`RS-OPS-2`) |
| Conversions | `Contour ⇄ Labelmap` (`RS-OPS-3`) |

### 6.1 Bindings

**RS-TYPE-SEG-1**
The system shall register `segmentation` as a result type with the properties tabulated above.

**RS-TYPE-SEG-2**
The system shall support saving a `Contour` member as DICOM SEG in place of RTSTRUCT, subject to
`RS-SAVE-14`.

**RS-TYPE-SEG-3**
WHERE a segmentation member is scoped by Frame of Reference, the system shall make it applicable to
every display set in that Frame of Reference, including reformats and reconstructions of the source
series.

**RS-TYPE-SEG-4**
The system shall allow a result set to contain `Labelmap` and `Contour` members simultaneously, in
conformance with `RS-MEM-6`.

> These four requirements move to the `SG` and `CT` specifications when those are written; the
> `RS-*` requirements they bind do not.

---

## 7. Resolution of the source issue's open questions

| # | Question | Resolution in this phase |
| --- | --- | --- |
| 1 | Which metadata carries a positive related-series identifier? | `RelatedSeriesSequence` (0008,1250), relating the output series of a result set to one another across modality and study boundaries — `RS-SAVE-10`..`RS-SAVE-10e`. The purpose code marking membership is OHIF-private until a standard one exists — see §10 item 2. |
| 2 | Which fallback matching rules when no positive identifier is present? | `RS-IMP-3` fixes the inputs a rule may consider and `RS-CFG-1` makes the chain configurable. The default chain is a design decision. |
| 3 | Default viewport visibility when a result set is first loaded? | `allApplicableViewports`, configurable — `RS-VP-6`, `RS-VP-7`, resolved through `RS-APP-10`. |
| 4 | When should drawing reuse the active result set vs. ask? | `RS-TOOL-4` reuse when unambiguous, `RS-TOOL-5` reuse the active one, `RS-TOOL-6` ask only when genuinely ambiguous. |
| 5 | Which operations can be representation-independent? | `RS-OPS-2` lists the required set; everything else goes through explicit conversion, `RS-OPS-3`..`RS-OPS-6`. |
| 6 | How should cross-study result sets be encoded? | Membership and display span studies; persistence is partitioned per study — `RS-ID-4`, `RS-SAVE-12`. |
| 7 | Concurrent edits, external updates, partial saves? | Partial saves are specified (`RS-STATE-7`, `RS-SAVE`). Concurrent edits and external updates are deferred (§2.2). |
| 8 | What terminology? | "Result set" — §2.3, with a per-mode override (`RS-CFG-4`). |

## 8. Traceability

### 8.1 To the source issue

| Issue section | Requirements |
| --- | --- |
| Result set (conceptual model) | `RS-DEF-*`, `RS-GRP-*`, `RS-ID-*`, `RS-MEM-*` |
| Representation | `RS-DEF-3`, `RS-MEM-6`, `RS-OPS-*` |
| Result-set view and sub-tabs | `SB-COMP-*`, `SB-OWN-*`; detailed behaviour deferred, §5.4 |
| Segment coverage view | Deferred, §5.4 |
| 1. Tool selection in the standard tool UI | `EM-TOP-1`, `EM-SID-6`, `EM-PLC-4`, `SB-TOOL-1`, `SB-TOOL-2`, `SB-OWN-3`, `RS-UI-2`, `RS-TOOL-1`, `RS-TOOL-2` |
| 2. Create results on first use | `RS-TOOL-3`..`RS-TOOL-12` |
| 3. Load result sets as logical units | `RS-IMP-*`, `RS-DS-*` |
| 4. Control result-set visibility per viewport | `RS-VP-*`, `RS-APP-*` |
| 5. Save a result set as one user operation | `RS-SAVE-*`, `RS-STATE-*` |
| 6. Configurable sub-tabs over the same data | `SB-COMP-2`..`SB-COMP-6`, `SB-OWN-2`, `RS-CFG-3` |
| 7. Representation-independent operations | `RS-OPS-*` |
| Relationship to DICOM | `RS-MEM-2`, `RS-IMP-1`..`RS-IMP-3`, `RS-SAVE-7`..`RS-SAVE-13`, `RS-SAVE-17` |
| Viewport performance contract | `RS-PERF-*` |

### 8.2 To the narrower issues this supersedes

| Issue | Requirements that address it |
| --- | --- |
| [#5568 Confusing segmentation behaviour with active viewport](https://github.com/OHIF/Viewers/issues/5568) | `RS-APP-*`, `RS-VP-1`, `RS-VP-3`, `RS-VP-9`, `RS-VP-12`, `RS-TOOL-4`..`RS-TOOL-6` |
| [#3879 Auto load derived display set matched via hanging protocol](https://github.com/OHIF/Viewers/issues/3879) | `RS-DS-7`, `RS-DS-8`, `RS-IMP-6`, `RS-VP-6`, `RS-VP-7` |
| [#3421 Impossible to know which segmentation series is displayed](https://github.com/OHIF/Viewers/issues/3421) | `RS-MEM-2`, `RS-APP-12`, `RS-IMP-7` |
| [#3790 No way to tell which series is being segmented](https://github.com/OHIF/Viewers/issues/3790) | `RS-APP-12`, `RS-MEM-1`; the coverage half is deferred, §5.4 |
| [#5182 Adding multiple segmentation overlays](https://github.com/OHIF/Viewers/issues/5182) | `RS-GRP-1`, `RS-GRP-6`, `RS-GRP-7`, `RS-VP-4`, `RS-VP-5` |
| [#5697 Contour tab should automatically switch with type loaded](https://github.com/OHIF/Viewers/issues/5697) | `SB-COMP-2`, `RS-MEM-6`, `RS-TOOL-7` |
| [#2852 More than one qualitative annotation SR](https://github.com/OHIF/Viewers/issues/2852) | `RS-GRP-1`, `RS-GRP-6`, `RS-IMP-7` — mechanism specified, annotation implementation deferred. |

## 9. Verification approach

| Requirement group | Primary verification |
| --- | --- |
| `RS-DEF`, `RS-GRP`, `RS-ID`, `RS-MEM`, `RS-IMP` | Unit tests against `ResultSetService`, including a synthetic second result type registered by the test to prove type-agnosticism (`RS-DEF-4`). |
| `RS-APP` | Unit tests with a matrix of scope × loaded display sets, including the negative cases `RS-APP-4`, `RS-APP-14`. |
| `RS-DS` | Unit tests over SOP-class-handler output; end-to-end test that a hanging protocol matching a SEG produces a result layer, not primary viewport content. |
| `RS-PERF` | Index-complexity tests asserting no full scan on single-member change, and render-count assertions that one item change does not re-render unrelated rows. |
| `RS-VP`, `RS-UI`, `RS-TOOL` | Playwright end-to-end tests using the OHIF fixture system, per the `ohif-test-agent` skill. |
| `SB-COMP`, `SB-OWN`, `SB-TOOL` | Playwright tests against the result-set sidebar, written so they can be re-pointed at a second sidebar when the `SG` and `CT` specifications land. |
| `RS-SAVE`, `RS-STATE` | Unit tests on the export partitioner over synthetic result sets, plus end-to-end store-and-reload round trips asserting `RS-SAVE-13` and `RS-SAVE-17`. |
| `RS-SAVE-10`..`RS-SAVE-10e` | Save a result set producing a SEG series and an SR series; assert every output series carries a membership item, that the set is recoverable from series-level metadata alone (`RS-SAVE-10b`), and that a later save adding a third modality relates it without rewriting the first two (`RS-SAVE-10c`). Cross-study variant for `RS-SAVE-10d`. |
| `RS-IMP-2`, `RS-IMP-2a` | Load only the SEG series of that set and assert the SR series is brought in with it. |
| `RS-SAVE-11`, `RS-SAVE-11a` | Save a member three times and assert each output instance's `PredecessorDocumentsSequence` references exactly its immediate predecessor, and that reloading reconstructs the version order. |
| `RS-OPS` | Unit tests on the operation registry and conversion adapters. |
| `RS-COMPAT` | Existing segmentation unit and end-to-end suites must pass unchanged with the feature enabled. |

## 10. Open items

These are unresolved and must be settled before or during design.

1. **`PredecessorDocumentsSequence` outside SR and KO.** `RS-SAVE-11` writes it on every output
   type. It is defined in the SR Document General and Key Object Document modules, so its use on
   SEG and RTSTRUCT should be confirmed against PS3.3, and formalized by change proposal if it is
   not already permitted. No alternative is proposed in the meantime — a private tag would be
   worse, and the semantics are exactly right.
2. **The result-set anchor purpose code.** `RS-SAVE-10` needs a Purpose of Reference code marking
   a series as belonging to a result set, carried in `RelatedSeriesSequence` (0008,1250). No
   standard code has that meaning. The working assumption is an OHIF-private coding scheme,
   configurable per deployment, with a change proposal raised.
3. **Where `RS-SAVE-17` writes applicability.** Recording a member's applicability scope on the
   output object has no obvious standard home for every scope, and may be partly derivable from
   existing reference sequences.
4. **In-view applicability semantics.** `RS-APP-6` says "within the viewport's current view".
   Whether that means the exact frame, any frame within slice-thickness tolerance, or any frame
   the reference projects onto needs a decision per result type.
5. **Comparison pairing.** `RS-OPS-9` requires members to be paired by result type and
   applicability before a group comparison. Whether label matching should also participate, and
   what happens to unpaired members, is unspecified.
6. **`RS-MEM-3` single ownership.** Revisit if a workflow emerges that copy-with-provenance
   cannot serve.
7. **Terminology per result type.** `RS-CFG-4` allows the noun for a result set to be
   configured, but not yet the noun for a member, which reads differently for a segmentation
   than for a key object.
