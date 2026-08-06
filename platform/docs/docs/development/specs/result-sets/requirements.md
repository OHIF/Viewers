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
- **Labelmap** segmentation, **contour** segmentation, and **annotations** as the implemented
  result types (§6) — the three sidebars the phase-2 name model applies to.

### 2.2 Out of scope for this phase

These are result types the contract is designed to carry, but which this phase does not
implement. Each is named so the contract can be checked against it.

| Deferred result type or capability | What the contract must not preclude |
| --- | --- |
| Measurement-specific behaviour, and annotation operations beyond copy and compare | Annotations are in scope for naming, grouping, per-viewport selection, and saving (§6); the rest belongs in the `MS` specification. |
| DICOM Key Object Selection | Non-renderable members (`RS-DEF-5`) and study-scoped applicability (`RS-APP-7`). |
| Key images and key series | Study- and series-scoped members (`RS-APP-2`), and a coverage model able to group by them when it is specified. |
| Registrations, statistics, and other non-visual results | `RS-DEF-5`. |
| KO export | Export partitioning (`RS-SAVE-7`..`RS-SAVE-13`) is written per modality, not per result type. |
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
| 2 | Named result sets across the segmentation, contour, and annotation sidebars, and tools that create what they need instead of refusing |
| 3 | Frame-level detail, per-segment scope, and edit safety |
| 4 | Provenance: what produced each result, who changed it, and the record surviving a round trip |

**Phase 2** is deliberately narrow. A result set is grouped by its **name** unless something has deliberately
set an identity (`RS-ID-11`); the name defaults to the `SeriesDescription` the object was saved
under (`RS-ID-10`); a set carries an applicability rule (`RS-APP-15`, `RS-APP-16`); a viewport names the
sets it shows (`RS-VP-14`, `RS-VP-15`); a save writes the whole set and stamps the name into every
`SeriesDescription` (`RS-SAVE-18`, `RS-SAVE-9a`); and tools that create results share one default
name so the user ends up with one set rather than three (`RS-TOOL-14`).

Phase 2 also closes the create-on-first-use gap (`RS-TOOL-3`..`RS-TOOL-19`): a tool that finds no
result set, no member, or no segment creates them and carries on, rather than disabling itself and
telling the user to go and do it (`RS-TOOL-15`, `RS-TOOL-16`) — [CP-TOOLCREATE](../changes/tool-create-on-first-use.md).

Nothing in phase 2 infers that differently named objects are one piece of work. The DICOM-level
grouping of `RS-IMP-1`..`RS-IMP-3` and the anchoring of `RS-SAVE-10` are later refinements, and a
deployment that needs them sooner can add them as custom code (`RS-IMP-11`).

**Phase 3** goes down a level, from the result set to the individual segment and the individual
frame. A segment can be expanded to show the frames it applies to, grouped by series where it
spans more than one (`RS-FRM`); activating it walks those frames, in the orientation the viewport
is currently showing (`RS-NAV`); a segment can be marked as applying by Frame of Reference on its
own (`RS-APP-19`..`RS-APP-21`); and the default applicability of everything becomes the display set
the result came from, so Frame of Reference reach is something asked for rather than assumed
(`RS-APP-22`, `RS-APP-23`).

That last change is what makes phase 3 hang together. Once a result only reaches its own display
set by default, being shown on another one is a deliberate act — and `RS-EDT` can then say what
editing it there means, which is the question phases 1 and 2 leave open.

**Phase 4** is the last phase currently planned. Every result carries an ordered provenance
history: what produced it, who changed it since, and when (`RS-PRV-1`..`RS-PRV-9`). A user can
select any result and read that history (`RS-PRV-10`..`RS-PRV-14`). A save writes it into the
DICOM output and a load reconstructs it (`RS-PRV-15`..`RS-PRV-23`).

The distinction that gives the history meaning is `RS-PRV-4` against `RS-PRV-5`: editing a result
appends an entry, re-saving an unedited one does not. Provenance is a record of what happened to
the data, not a log of what happened to the file.

No further phases are assigned. If the phase set grows enough that markers become
hard to read across the document, it is split into per-phase documents; until then the markers
are the record.

### 2.5 Prototype requirements

Some decisions are better taken from use than from argument. Where that is the case, this
specification states a **concrete behaviour to build and try**, marked *(prototype)*:

```
**RS-GRP-16** *(phase 2, prototype)*
```

A prototype requirement is **binding on the implementation and not on the specification**. Build
exactly what it says, so that everyone is reacting to the same thing; expect it to change once
there is experience with it.

Every prototype requirement names the open item it exists to resolve. After a period of real use
the group is reviewed and either promoted — the marker is removed and it becomes an ordinary
requirement — or replaced by what use showed was better. A prototype requirement that has been
in the product for a release without being reviewed is a defect in this document, not a settled
decision.

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

**RS-GRP-10** *(phase 2)*
The system shall allow the whole of a result set to be turned on and off in a single action.

**RS-GRP-11** *(phase 2)*
WHEN a result set is turned off, the system shall hide every member of that set without altering
the individual visibility of those members.

**RS-GRP-12** *(phase 2)*
WHEN a result set is turned back on, the system shall restore the member visibility that was in
effect before it was turned off.

**RS-GRP-13** *(phase 2)*
The system shall allow each displayed result set to be turned on and off independently of the
others.

**RS-GRP-14** *(phase 2)*
The system shall show the on/off state of a result set wherever that set is listed.

> **Note (RS-GRP-11, RS-GRP-12):** A group toggle is a group-level override, not a bulk edit of its
> members. A user who has hidden one segment inside a set, turned the set off to look at the
> images, and turned it back on expects that segment still hidden — not everything switched on.

#### Prototype: where the control lives and how far it reaches

`RS-GRP-15`..`RS-GRP-19` are a **prototype** in the sense of §2.5. They exist to resolve §10 item 7,
and are stated concretely so that there is one thing to build, use, and react to. They are not a
settled decision.

**RS-GRP-15** *(phase 2, prototype)*
The system shall provide the on/off control of `RS-GRP-10` on each result set's own row, wherever
result sets are listed.

**RS-GRP-16** *(phase 2, prototype)*
WHEN the user activates a result set's on/off control, the system shall apply the change to the
active viewport only.

**RS-GRP-17** *(phase 2, prototype)*
The system shall additionally provide, from the same row, an action applying a result set's on/off
state to every viewport that set is applicable to.

**RS-GRP-18** *(phase 2, prototype)*
WHILE a result set is on in some of the viewports it applies to and off in others, the system shall
show a third state on that set's row, distinct from both on and off.

**RS-GRP-19** *(phase 2, prototype)*
WHEN the user activates the on/off control of a result set showing the third state of `RS-GRP-18`,
the system shall turn that set on in every viewport it is applicable to.

> **Note:** The prototype deliberately offers **both** reaches rather than choosing between them.
> `RS-GRP-16` follows the per-viewport model that `RS-VP-3` uses for everything else; `RS-GRP-17`
> serves the user who means "hide Reader B" and means it everywhere. Building both is what makes
> the choice observable — if the per-row action is never used, per-viewport was the wrong
> default, and if it is used constantly, it should have been the primary.
>
> `RS-GRP-19` turning everything **on** from the third state follows the usual convention for a
> mixed control, and is the reversible direction: turning on what was off is undone by one more
> click, whereas turning off loses which viewports had it on.

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

**RS-ID-9** *(phase 2)*
The system shall allow the user to name a result set.

**RS-ID-10** *(phase 2)*
WHEN a result set is created from imported results, the system shall default its name to the name
the imported object carries — its `SeriesDescription`, or the equivalent for its type.

**RS-ID-11** *(phase 2)*
The system shall determine which result set a result belongs to from an explicit result-set
identity where one has been set, and from the result-set name otherwise.

**RS-ID-12** *(phase 2)*
WHERE no explicit identity distinguishes them, the system shall treat results carrying the same
name as belonging to the same result set.

**RS-ID-13** *(phase 2)*
The system shall not require an explicit result-set identity to be present.

**RS-ID-14** *(phase 2)*
WHERE a result carries an explicit result-set identity, the system shall preserve its grouping
when the result set is renamed.

**RS-ID-15** *(phase 2)*
The system shall not require results carrying different names to be reconciled into one result
set.

**RS-ID-16** *(phase 2)*
The system shall make it inspectable whether a result set is grouped by explicit identity or by
name.

> **Note (RS-ID-11):** The name is the **default** grouping key, not the identity. Where something
> has deliberately set an identity — a workflow, an importer, or custom deployment code — that
> identity wins, and `RS-ID-14` keeps the grouping stable when the user renames the set. Only when
> nothing has been set does the name decide, which is the common case and the whole of what phase 2
> has to deliver.
>
> The distinction matters in two places. Two unrelated result sets that happen to share a
> `SeriesDescription` can be kept apart by identity rather than forcing the user to rename one. And
> a set with an identity can be renamed freely, because the rename is a label change rather than a
> regrouping.

> **Note (RS-ID-15):** Nothing has to infer that two differently named objects are one piece of
> work. The DICOM-level grouping of `RS-IMP-1`..`RS-IMP-3` is a later refinement, and a deployment
> needing it sooner can add it as custom code.

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

**RS-APP-3a**
The system shall qualify a `frameOfReference` rule as either limited to the study the result was
created in, or extending to any study sharing that Frame of Reference.

**RS-APP-3b**
The system shall apply the qualification its result type declares when a rule does not state one.

> **Note (RS-APP-3a):** The two are materially different. Same-study keeps a result on the exam it
> was drawn on. Any-study puts it on every prior and follow-up registered to the same frame, which
> is what makes a segmentation follow a patient across time — and equally what makes it appear
> somewhere unexpected. The rule states which is meant rather than leaving it to be inferred.

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

**RS-APP-15** *(phase 2)*
The system shall allow an applicability rule to be stated for a result set as a whole, in addition
to per member.

**RS-APP-16** *(phase 2)*
The system shall support at least the following result-set applicability rules:

| Rule | Applies to |
| --- | --- |
| Specified images | Only the images the result set names |
| Same-study frame of reference | Every display set in the result set's own study sharing its `FrameOfReferenceUID` |
| Any-study frame of reference | Every display set in any loaded study sharing its `FrameOfReferenceUID` |

**RS-APP-17** *(phase 2)*
The system shall resolve applicability in precedence order: the member's own rule, then the result
set's rule, then the result type's default.

**RS-APP-18** *(phase 2)*
WHEN the applicability rule of a result set changes, the system shall re-evaluate every viewport
the set is applicable to, and shall not require the set to be reloaded.

**RS-APP-19** *(phase 3)*
The system shall allow an applicability rule to be stated for an individual component of a member.

**RS-APP-20** *(phase 3)*
The system shall allow an individual segment to be marked as applying by Frame of Reference.

**RS-APP-21** *(phase 3)*
WHERE a component states its own applicability rule, the system shall apply it in preference to
the member's, and shall otherwise resolve as `RS-APP-17` requires.

**RS-APP-22** *(phase 3)*
The system shall default the applicability of a result set, and of every member and component
within it, to the display set the results were created on or imported for.

**RS-APP-23** *(phase 3)*
The system shall require Frame of Reference applicability to be stated explicitly, at the
component, the member, or the result set.

> **Note (RS-APP-22, RS-APP-23):** This reverses the earlier default. A result now reaches only the
> images it came from unless something asks for more, rather than spreading across a Frame of
> Reference by default.
>
> The reason is that Frame of Reference reach and editing interact badly when the reach is
> automatic. A segmentation silently displayed on a reformat looks the same as one drawn there, and
> a user editing it cannot tell whether they are refining existing data or authoring new data on a
> different geometry. `RS-EDT` can only give a clear answer if arriving on another display set was
> a deliberate act. `RS-APP-20` is how a user asks for the reach, one segment at a time.
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

**RS-IMP-11** *(phase 2)*
The system shall group imported results by explicit identity where present and by result-set name
otherwise, and shall not require the grouping rules of `RS-IMP-1`..`RS-IMP-3` in order to do so.

**RS-IMP-12** *(phase 2)*
WHERE two imported objects carry the same name within the scope the deployment groups over, the
system shall place them in one result set.

> **Note (RS-IMP-11, RS-IMP-12):** `RS-IMP-1`..`RS-IMP-3` describe the DICOM-level grouping the
> specification aims at. They are not phase-2 work. Phase 2 delivers name matching only, which is
> enough to make the SEG, contour, and annotation sidebars behave as one model; a deployment that
> needs objects unified across differing names can add a rule as custom code.

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

**RS-VP-14** *(phase 2)*
The system shall allow a viewport's result layers to be specified by result-set name.

**RS-VP-15** *(phase 2)*
The system shall allow a viewport's result-layer specification to name more than one result set.

**RS-VP-16** *(phase 2)*
WHERE a viewport's specification names a result set that is not present, the system shall retain
the name and shall apply it if a result set of that name later appears.

> **Note (RS-VP-16):** A layout or hanging protocol is written before the data is known. Naming
> "Reader B" in a viewport that has no Reader B yet has to be a legitimate configuration, not an
> error.

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

**RS-SAVE-9a** *(phase 2)*
WHEN a result set is saved, the system shall write the result-set name as the `SeriesDescription`
of every output series it produces.

> **Note (RS-SAVE-9a):** The name is what groups a set by default (`RS-ID-11`) and
> `SeriesDescription` is what a reader sees in any other viewer, so they have to be the same string. It is also what makes
> `RS-ID-10` work on reload: the name the set comes back with is the name it was saved under.

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
nothing has changed and shall allow the user to save anyway, writing the whole set per
`RS-SAVE-18`.

**RS-SAVE-17**
The system shall record on each output object the applicability of the results it carries, so that
`RS-APP` can be reconstructed on reload without re-deriving it.

**RS-SAVE-18**
WHEN a result set is saved, the system shall write every member of that set, and shall not limit
the write to the members that changed.

> **Note (RS-SAVE-18):** A save produces a complete, self-contained set of objects rather than a
> patch. `RS-SAVE-2` still distinguishes changed from unchanged in the summary, because that is
> what tells the user what their edits touched — but the write covers the set, so the result on
> the server after a save is the result set as it stands, not a fragment that has to be reassembled
> from earlier saves.

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

### 4.14 Frames a result applies to — `RS-FRM`

**RS-FRM-1** *(phase 3)*
The system shall allow a segment to be expanded to reveal the frames it applies to.

**RS-FRM-2** *(phase 3)*
WHERE the frames a segment applies to span more than one series, the system shall group them by
series.

**RS-FRM-3** *(phase 3)*
The system shall show, within each series of an expanded segment, the frames of that series the
segment applies to.

**RS-FRM-4** *(phase 3)*
The system shall determine the frames a segment applies to from the segment's own data, and shall
not determine them from the viewport currently displayed.

**RS-FRM-5** *(phase 3)*
The system shall allow a segment to be expanded without requiring it to be active or visible.

**RS-FRM-6** *(phase 3)*
WHEN a segment's data changes, the system shall update the frames shown for that segment, and
shall not recompute them for unaffected segments.

**RS-FRM-7** *(phase 3)*
IF a segment applies to no frame, THEN the system shall show that explicitly rather than showing
an empty expansion.

> **Note (RS-FRM-1):** "Applies to" here means *has content on*, which is narrower than
> applicability in the `RS-APP` sense. A segment scoped by Frame of Reference applies to every
> display set in that frame, but has content on only some frames of some of them. The expansion
> answers the second question, which is the one a user asking "where is this segment" means.
>
> This states the capability at this document's altitude. How the expansion is laid out, and where
> it sits in a sidebar, belongs to the lower-level specification of §5.4.

### 4.15 Navigating to a result — `RS-NAV`

**RS-NAV-1** *(phase 3)*
The system shall provide navigation to the next and to the previous frame a segment or contour
applies to.

**RS-NAV-2** *(phase 3)*
WHEN the user activates a segment or contour, the system shall navigate the viewport to the next
frame that segment or contour applies to.

**RS-NAV-3** *(phase 3)*
WHEN navigation passes the last frame a segment applies to, the system shall continue from the
first.

**RS-NAV-4** *(phase 3)*
WHILE a viewport is displaying a reconstructed orientation, the system shall navigate in the
orientation the viewport is displaying, and shall not navigate in the acquisition orientation.

**RS-NAV-5** *(phase 3)*
WHEN the user activates a frame revealed by `RS-FRM-1`, the system shall navigate directly to that
frame.

**RS-NAV-6** *(phase 3)*
IF a segment applies to no frame reachable in the active viewport, THEN the system shall state
that rather than navigating.

> **Note (RS-NAV-4):** In a reconstructed view the frames a segment has content on are not the
> frames the user is paging through. Next has to mean the next slice of what is on screen that
> contains the segment, not the next acquisition frame — otherwise navigation jumps to a
> location the user cannot see it at.

### 4.16 Editing away from the original — `RS-EDT`

**RS-EDT-1** *(phase 3)*
The system shall record, for a result displayed on a display set other than the one it was created
on or imported for, whether it may be edited there.

**RS-EDT-2** *(phase 3)*
The system shall default that record to not editable.

**RS-EDT-3** *(phase 3)*
WHILE a result is displayed away from its original display set and is not editable there, the
system shall prevent edits to it and shall state why.

**RS-EDT-4** *(phase 3)*
WHILE a result is displayed away from its original display set and is editable there, the system
shall make that state evident before an edit is made, and not only after.

**RS-EDT-5** *(phase 3)*
The system shall make it unambiguous whether an edit will modify the existing result or produce a
new one.

**RS-EDT-6** *(phase 3)*
WHERE an edit away from the original display set would produce a new result rather than modify the
existing one, the system shall state that before the edit is committed.

**RS-EDT-7** *(phase 3)*
The system shall allow the user to change the editability of a result they are permitted to edit.

**RS-EDT-8** *(phase 3)*
WHEN a result is edited away from its original display set, the system shall record in that
result's provenance the display set the edit was made on.

> **Note (RS-EDT):** This is the safety half of `RS-APP-20`. Marking a segment to apply by Frame of
> Reference makes it appear on geometry it was not drawn on — a reformat, a different
> acquisition, a prior. Painting there is not the same act as painting on the original: depending
> on the geometry it may refine the same data, or it may amount to authoring new data that happens
> to share a label.
>
> The specification does not decide which of those is correct — that depends on the
> representation and the geometry. It requires that the user is never left guessing which one is
> happening.

### 4.17 Provenance — `RS-PRV`

#### Recording

**RS-PRV-1** *(phase 4)*
The system shall record provenance for every result.

**RS-PRV-2** *(phase 4)*
The system shall record, for each provenance entry, what produced or changed the result, when, and
by what means.

**RS-PRV-3** *(phase 4)*
The system shall record provenance as an ordered history, and shall not replace an earlier entry
when adding a later one.

**RS-PRV-4** *(phase 4)*
WHEN a user edits a result, the system shall append a provenance entry identifying that user as
having edited it.

**RS-PRV-5** *(phase 4)*
IF a result is saved without having been edited since it was last saved, THEN the system shall not
append a provenance entry.

> **Note (RS-PRV-4, RS-PRV-5):** Provenance records what happened to the **data**, not what
> happened to the file. Re-saving an unchanged result is not a contribution to it, and an
> implementation that appends on every write produces a history that grows without saying anything.

**RS-PRV-6** *(phase 4)*
WHERE a result was produced by an algorithm, the system shall record that algorithm's identity,
version, and parameters.

**RS-PRV-7** *(phase 4)*
The system shall record enough of an algorithm's parameters to identify the configuration that
produced the result.

**RS-PRV-8** *(phase 4)*
The system shall record provenance at the level it applies to: the result set, a member, or a
component.

**RS-PRV-9** *(phase 4)*
WHERE components of a member have different provenance, the system shall record it per component.

#### Inspection

**RS-PRV-10** *(phase 4)*
The system shall allow the user to select any result and see its provenance.

**RS-PRV-11** *(phase 4)*
The system shall present provenance as a history, in the order the contributions were made.

**RS-PRV-12** *(phase 4)*
The system shall distinguish, in that presentation, a contribution made by a person from a
contribution made by an algorithm.

**RS-PRV-13** *(phase 4)*
WHERE a result's provenance is inherited from a level above it, the system shall show that
provenance and shall show that it is inherited.

**RS-PRV-14** *(phase 4)*
IF a result has no recorded provenance, THEN the system shall state that rather than presenting an
empty history.

#### Persistence

**RS-PRV-15** *(phase 4)*
WHEN a result set is saved, the system shall write its provenance history into the output objects.

**RS-PRV-16** *(phase 4)*
The system shall write instance-wide system provenance once per output instance in
`ContributingEquipmentSequence` (0018,A001), and shall identify the producing system in the
equipment module.

**RS-PRV-17** *(phase 4)*
The system shall write per-item algorithm provenance using the Algorithm Identification macro, in
the sequence the output object type defines:

| Output item | Sequence |
| --- | --- |
| SEG segment | `SegmentationAlgorithmIdentificationSequence` (0062,0007) |
| RTSTRUCT ROI | `ROIDerivationAlgorithmIdentificationSequence` (3006,0037) |
| Annotation group | `AnnotationGroupAlgorithmIdentificationSequence` (006A,0008) |
| SR observation or group | TID 4019 content items |

**RS-PRV-18** *(phase 4)*
The system shall repeat the algorithm identification for every automatically generated item whose
algorithm must be known, and shall not rely on instance-wide provenance to attribute an item to an
algorithm.

> **Note (RS-PRV-18):** SEG and RTSTRUCT define no inheritance from
> `ContributingEquipmentSequence`. An absent per-item sequence does **not** formally mean "inherit
> the algorithm from the instance", so an item without its own record is an item whose algorithm is
> unknown to a conformant reader — however obvious it looks in our own viewer.

**RS-PRV-19** *(phase 4)*
WHERE the output object type defines container-level algorithm provenance, the system shall be
permitted to record it once at the container and to allow a contained item to override it.

**RS-PRV-20** *(phase 4)*
The system shall set the generation-type attribute the output object defines:
`SegmentAlgorithmType` (0062,0008), `ROIGenerationAlgorithm` (3006,0036), or
`AnnotationGroupGenerationType` (006A,0007).

**RS-PRV-21** *(phase 4)*
The system shall record a human creator using the content-creator or observer attribute the output
object defines.

**RS-PRV-22** *(phase 4)*
IF contours within one RTSTRUCT ROI would carry different provenance, THEN the system shall write
them as separate ROIs.

> **Note (RS-PRV-22):** RTSTRUCT attaches provenance at the ROI, not to individual contours within
> one. Splitting is the only conformant way to represent contours of differing origin.

**RS-PRV-23** *(phase 4)*
WHEN a result set is loaded, the system shall reconstruct its provenance history from the output
objects.

**RS-PRV-24** *(phase 4)*
The system shall produce conformant provenance without requiring a private extension.

**RS-PRV-25** *(phase 4)*
WHERE a deployment removes the duplication `RS-PRV-18` causes, the system shall do so through a
documented private extension, and shall continue to write the standard per-item records.

> **Note (RS-PRV-25):** There is no public tag providing a provenance registry plus a per-item
> reference to it, so deduplication costs a private extension. A private registry that *replaced*
> the per-item records would make the object unreadable to everyone else, which is why the standard
> records stay.

### 4.18 Compatibility — `RS-COMPAT`

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

**RS-TOOL-3** *(phase 2)*
WHEN a tool that creates or edits results is activated, the system shall resolve a target result
set for the active viewport before the first edit is committed.

**RS-TOOL-4** *(phase 2)*
WHEN target resolution finds exactly one applicable result set among the active viewport's result
layers, the system shall use that result set without prompting the user.

**RS-TOOL-5** *(phase 2)*
WHEN target resolution finds more than one applicable result set among the active viewport's result
layers and one of them is marked active for that viewport, the system shall use the active one
without prompting the user.

**RS-TOOL-6** *(phase 2)*
WHEN target resolution finds more than one applicable result set among the active viewport's result
layers and none is marked active, the system shall prompt the user to select one of them or to
create a new result set.

**RS-TOOL-7** *(phase 2)*
WHEN target resolution finds no applicable result set, the system shall create a new result set,
create the member and representation required by the activated tool with the applicability its
result type declares, mark the result set as changed, open or reveal the result-set sidebar, select
the appropriate sub-tab, and show the new member in it.

**RS-TOOL-8** *(phase 2)*
WHEN a member is created by `RS-TOOL-7`, the system shall create it without any additional user step
beyond activating the tool.

**RS-TOOL-9** *(phase 2)*
IF the user cancels the selection prompt of `RS-TOOL-6`, THEN the system shall not create a result
set, shall not create a member, and shall not commit the pending edit.

**RS-TOOL-10** *(phase 2)*
IF the active viewport displays no image data that the activated tool's result type can apply to,
THEN the system shall present the tool as unavailable and shall state the reason.

**RS-TOOL-11** *(phase 2)*
WHEN a tool commits an edit, the system shall mark the owning result set as changed.

**RS-TOOL-12** *(phase 2)*
The system shall apply `RS-TOOL-3` through `RS-TOOL-11` identically for every result type.

**RS-TOOL-13** *(phase 2)*
WHEN a tool creates a result set because none was suitable, the system shall give it a default
name.

**RS-TOOL-14** *(phase 2)*
WHEN tools of different result types create results and no result-set name has been chosen, the
system shall use the same default name for all of them.

**RS-TOOL-15** *(phase 2)*
IF no result set, no member, or no component exists that a tool could act on, THEN the system
shall not present that tool as unavailable, and shall create what the tool needs when the tool is
used.

**RS-TOOL-16** *(phase 2)*
The system shall treat the absence of a suitable result set, member, or component as a reason to
create one, and shall not treat it as a reason to disable, warn, or report an error.

**RS-TOOL-17** *(phase 2)*
WHEN a tool creates a result because none existed, the system shall create every intermediate
object that tool requires, including the result set, the member, and the member's first component.

**RS-TOOL-18** *(phase 2)*
WHEN a tool creates a result set, the system shall make it the active result set for the viewport
the tool was used in.

**RS-TOOL-19** *(phase 2)*
The system shall limit the unavailability of `RS-TOOL-10` to the case where the active viewport
displays no image data the tool's result type can apply to.

> **Note (RS-TOOL-15, RS-TOOL-16):** This replaces the current behaviour, in which segmentation
> tools are disabled with `No segmentations available` when the viewport holds no segmentation, and
> with `Add segment to enable this tool` when the active segmentation has no segments. Both are the
> viewer telling the user to go and perform a setup step it could have performed itself. Neither
> condition says anything about whether the tool *could* work here — only that nobody has drawn
> anything yet, which is the normal state at the start of every piece of work.
>
> `RS-TOOL-17` covers the second message specifically: creating the segmentation is not enough if
> the tool then refuses for want of a segment. Everything the first stroke needs is created by the
> first stroke.
>
> `RS-TOOL-18` is what makes the second stroke reuse the first stroke's target rather than creating
> again, via `RS-TOOL-5`.
>
> The concrete change is [CP-TOOLCREATE](../changes/tool-create-on-first-use.md).

> **Note (RS-TOOL-14):** Because the name groups by default (`RS-ID-11`), one shared default name
> means a user who draws a segmentation, a contour, and an annotation without naming anything ends
> up with one result set holding all three, rather than three sets that happen to have been made in
> the same sitting. That is the behaviour the user expects and it costs nothing to get right at
> creation time; separating them afterwards is a rename, which `RS-ID-5` already allows.

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

Two result types are implemented: **`segmentation`** and **`annotation`**. They are the types
behind the three sidebars the phase-2 name model applies to — segmentation, contour, and
annotation.

| Property (`RS-DEF-3`) | `segmentation` | `annotation` |
| --- | --- | --- |
| Representations | `Labelmap`, `Contour` (`Surface` exists in rendering but is not a result-set member in this phase) | `Markup` |
| Sidebars | Segmentation, Contour | Annotation |
| Default applicability scope | the originating display set (`RS-APP-22`) | the originating display set (`RS-APP-22`) |
| Frame of Reference reach | per segment, on request (`RS-APP-20`, `RS-APP-23`) | not in this phase |
| Import modalities | `SEG`, `RTSTRUCT` | `SR` |
| Export modalities | `SEG`, `RTSTRUCT` | `SR` |
| Representation-independent operations | copy, combine, intersect, subtract, statistics, compare (`RS-OPS-2`) | copy, compare |
| Conversions | `Contour ⇄ Labelmap` (`RS-OPS-3`) | none |

> **Note:** `annotation` is in scope for **naming, grouping, per-viewport selection, and saving**
> — the phase-2 model — because that model has to reach the annotation sidebar to be worth
> having. The deeper annotation work in §2.2 stays deferred: `RS-OPS` beyond copy and compare, and
> the measurement-specific behaviour that belongs in the `MS` specification.

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

**RS-TYPE-ANN-1** *(phase 2)*
The system shall register `annotation` as a result type with the properties tabulated above.

**RS-TYPE-ANN-2** *(phase 2)*
The system shall allow a result set to contain `segmentation` and `annotation` members
simultaneously, in conformance with `RS-GRP-2`.

**RS-TYPE-ANN-3** *(phase 2)*
The system shall apply naming, grouping, per-viewport selection, and saving to `annotation`
members identically to `segmentation` members.

> These requirements move to the `SG`, `CT`, and `MS` specifications when those are written; the
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
| `RS-TOOL-15`..`RS-TOOL-19` | Playwright: open a study with no segmentation, select a labelmap tool, and draw. Assert the tool was never disabled, that a result set, member and segment were created, and that a second stroke reuses them rather than creating again. Repeat for a contour tool and an annotation tool. |
| `SB-COMP`, `SB-OWN`, `SB-TOOL` | Playwright tests against the result-set sidebar, written so they can be re-pointed at a second sidebar when the `SG` and `CT` specifications land. |
| `RS-SAVE`, `RS-STATE` | Unit tests on the export partitioner over synthetic result sets, plus end-to-end store-and-reload round trips asserting `RS-SAVE-13` and `RS-SAVE-17`. |
| `RS-SAVE-10`..`RS-SAVE-10e` | Save a result set producing a SEG series and an SR series; assert every output series carries a membership item, that the set is recoverable from series-level metadata alone (`RS-SAVE-10b`), and that a later save adding a third modality relates it without rewriting the first two (`RS-SAVE-10c`). Cross-study variant for `RS-SAVE-10d`. |
| `RS-IMP-2`, `RS-IMP-2a` | Load only the SEG series of that set and assert the SR series is brought in with it. |
| `RS-SAVE-11`, `RS-SAVE-11a` | Save a member three times and assert each output instance's `PredecessorDocumentsSequence` references exactly its immediate predecessor, and that reloading reconstructs the version order. |
| `RS-FRM` | Unit tests over a segment with content in two series, asserting the frames are derived from the segment data and grouped by series with no viewport involved. |
| `RS-NAV` | Playwright: activate a segment repeatedly and assert it walks its frames and wraps; repeat in a reconstructed orientation and assert it walks the displayed slices, not acquisition frames. |
| `RS-APP-19`..`RS-APP-23` | Unit tests on the four-level precedence, plus a test that a freshly imported result reaches only its own display set until Frame of Reference is asked for. |
| `RS-EDT` | Playwright: display a segmentation on a second display set, attempt an edit, assert it is refused with a reason; enable editing and assert the state is evident before the edit and recorded in provenance after. |
| `RS-PRV-1`..`RS-PRV-9` | Unit tests: an edit appends an entry naming the editor; a save of an unedited result appends nothing; a second edit appends without disturbing the first. |
| `RS-PRV-10`..`RS-PRV-14` | Playwright: select a segment produced by an algorithm and then edited by hand, and assert both contributions show in order and are distinguishable. |
| `RS-PRV-15`..`RS-PRV-23` | Round trip: save a result set whose segments have differing provenance, reload, and assert each segment's history is recovered. Assert per-item algorithm sequences are present rather than inferred. |
| `RS-PRV-22` | Unit test on the RTSTRUCT exporter: contours of differing provenance within one ROI are written as separate ROIs. |
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
7. **Per-item human attribution has no standard home.** `RS-PRV-4` requires recording which user
   edited a result. `ContributingEquipmentSequence` is for *equipment*, and its purpose code
   (109102, DCM, "Processing Equipment") does not describe a person; `ContentCreatorName`
   (0070,0084) is one value for the whole instance. So "user X edited segment 3, user Y edited
   segment 5" has no conformant per-item expression in SEG or RTSTRUCT. Options are instance-level
   attribution only, a private per-item extension under `RS-PRV-25`, or carrying the detail in an
   accompanying SR where TID 4019 and observer context exist. Undecided, and it limits what
   `RS-PRV-4` can promise on reload.

8. **Where the history lives across saves.** `RS-SAVE-11` makes each save a new SOP Instance
   chained by `PredecessorDocumentsSequence`, so a history could be read by walking that chain
   rather than being restated in each instance. Restating is self-contained but grows; chaining is
   compact but unreadable if an intermediate instance is unavailable. `RS-PRV-3` and `RS-PRV-23`
   require the history, not a particular carrier.

9. **`AlgorithmParameters` capacity.** (0066,0032) is LT, bounded at 10240 characters. A
   configuration hash and a handful of thresholds fit comfortably; a serialized model
   configuration may not. What gets recorded when the full configuration does not fit, and whether
   a digest alone satisfies `RS-PRV-7`, is unsettled.

10. **Group on/off: reach and surface** — *deferred to evaluation.* `RS-GRP-15`..`RS-GRP-19`
   specify a prototype so the decision can be taken from use. Ship it, run it, then decide:

   - **Is per-viewport the right default reach?** `RS-GRP-16` says yes because `RS-VP-3` does.
     Watch whether `RS-GRP-17`'s all-viewports action is what people actually reach for. If it is,
     the two should swap.
   - **Is the sidebar row the right surface?** Watch whether users look for the control in the
     viewport action menu instead, where `RS-VP-14`'s named-set selection lives. The two are not
     exclusive and both may be warranted.
   - **Does the third state of `RS-GRP-18` ever get seen, and is it understood?** If a mixed state
     is rare in practice, it may be simpler to make the reach uniform and remove the state
     entirely. If it is common, it needs a clearer treatment than a third icon.
   - **Does `RS-GRP-19` do what people expect?** Turning everything on is the convention and the
     reversible direction, but it may not match what a user means by clicking a half-on control.

   Review when the prototype has had real use, per §2.5. Whatever is decided replaces
   `RS-GRP-15`..`RS-GRP-19`; `RS-GRP-10`..`RS-GRP-14` are settled and are not in question.

11. **Terminology per result type.** `RS-CFG-4` allows the noun for a result set to be
   configured, but not yet the noun for a member, which reads differently for a segmentation
   than for a key object.
