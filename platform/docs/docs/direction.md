---
sidebar_position: 2
sidebar_label: Direction
title: Direction
---

# Direction

This document states what OHIF, the OHIF Viewer, Cornerstone3D and dcmjs are for. It states the
goals of the four projects, the order of those goals, and the rule that settles a conflict between
two goals.

## What this document is

**The audience.** The OHIF steering committee agrees to this document. The contributors and the
maintainers apply it. A developer who compares OHIF with a commercial product can read it, and that
reader is not the reason it exists.

**The force.** This document settles a conflict between two goals. A maintainer can also reject a
pull request because the pull request disagrees with a goal. That rejection is permitted, and it is
not automatic: a maintainer can accept a pull request that disagrees with a goal, and then say why.

**The tense.** The text is in the present tense. A statement that is not true today carries the
mark **[Not yet true]**. All such statements are listed in
[What is not yet true](#what-is-not-yet-true).

**The owner.** The OHIF steering committee owns this document. A pull request changes it, and a
member of the committee approves that pull request. There is no formal request-for-comments
process.

The committee owns this **document**. The maintainers of each repository own the **code**. A
maintainer who disagrees with the paragraph about their project changes this document. A maintainer
does not ignore this document.

**Open clauses.** Some clauses carry the mark **[Open]**. An [Open] clause states a default, and
that default has full force until the steering committee changes it. [Open] does not mean "not
enforced". All [Open] clauses are listed in [Open for decision](#open-for-decision).

**Where the companion documents are.** This document is the canonical one. The Cornerstone3D
documentation holds a short version that links to this document. The dcmjs repository holds a
`DIRECTION.md` that links to this document.

## The four projects

The four projects are different kinds of thing. The word for each kind is exact, and the word states
what an adopter can expect.

### dcmjs — a library

> Provide a standards-correct JavaScript implementation of DICOM at the single-instance level: read,
> write, naturalize and derive DICOM datasets, in the browser and in Node, without a network layer
> and without a rendering layer.

The two "without" clauses are the boundary. dcmjs has no network code, and dcmjs draws nothing on a
screen.

**[Not yet true]** One single-instance DICOM parser exists, and dcmjs is that parser.
`@cornerstonejs/dicom-image-loader` uses `dicom-parser` today, and dcmjs 1.0 holds the absorbed
`dicom-parser` tokenizer. The two paths converge on dcmjs.

### Cornerstone3D — a family of libraries

> Render medical images and volumes in the browser, and give a developer the tools to measure them,
> annotate them and segment them. Handle DICOM at the study level and the series level, and use
> dcmjs for the single-instance work.

"Cornerstone3D" in this document means the whole `@cornerstonejs` family: `core`, `tools`,
`dicom-image-loader`, `adapters`, `metadata`, `utils`, `ai`, `nifti-volume-loader`,
`labelmap-interpolation`, `polymorphic-segmentation` and `codemods`.

Cornerstone3D renders more than DICOM. It renders NIFTI volumes, meshes, whole-slide images,
waveforms, video and raw voxel arrays. Cornerstone3D depends on no user-interface framework.

### OHIF — a framework

> Provide a framework that a developer uses to build a medical imaging viewer for a specific need.

OHIF is a **framework** and not a library. An adopter registers extensions and modes into the
framework, and the framework controls the flow of the application. `@ohif/core` and the
user-interface components are separate: an adopter can use each of those two as a plain library.

### The OHIF Viewer — an application

> Provide a viewer that a deployment can put into production, and that also shows how to use the
> OHIF framework.

The limit is: **deployable by configuration, and not free to fork**. A deployment must be able to
run the Viewer in production with configuration, modes and extensions only. A change that makes an
adopter edit the source of the Viewer is outside the purpose of the Viewer.

## The goals

1. **Compliant.** Be DICOM compliant for the sources and the destinations, for parsing and for
   access. Handle a mistake in the data where that is possible. Permit a non-DICOM variant as an
   extension.
2. **Correct.** Display the data correctly. An image goes in the correct place, a segmentation goes
   in the correct place, and a measurement gives the correct value. Verification is part of this
   goal.
3. **Fast.** Do not make a user wait.
4. **Easy.** Make the common operation easy, and make the complex operation discoverable.
5. **Customizable.** Let an adopter change the viewer, or enhance the image display, without a fork.
6. **Private.** Send patient data only where the deployment sends it.
7. **Compatible.** Do not break a deployment that already works.

**Privacy is a constraint, and not a ranked goal.** The projects do not trade privacy against any
other goal. The other six goals compete, and the next section settles that competition.

### How the goals apply to each project

| Goal | dcmjs | Cornerstone3D | OHIF | The OHIF Viewer |
| ---- | ----- | ------------- | ---- | --------------- |
| **1 Compliant** | The reason the project exists. Reads and writes conformant DICOM. Tolerates non-conformant input when the intent is recoverable. | Study-level and series-level DICOM. The DICOMweb retrieval contract. | The sources and the destinations are DICOM compliant. A deployment can still map other data through a custom data source. | Applies. A DICOMweb back end is the usual case. |
| **2 Correct** | A read and then a write does not change the dataset. A derived object is valid. dcmjs displays nothing. | Geometry, pixel transformation, and the position of an annotation or a segment. | Construction of a display set, hanging, and the map from the data source into the internal model. | The whole application. |
| **3 Fast** | Bounded memory, and the throughput of the stream. | Render rate, decode rate, and progressive arrival. | The time that the framework itself adds. | The operations in [What "fast" means](#what-fast-means). |
| **4 Easy** | For a developer who calls the library: the common operation is the short path, and the complex operation is in the documentation. | For a developer who calls the library, as above. | For a developer who integrates: to build a viewer is the short path. | For a user of the application. |
| **5 Customizable** | A custom dictionary, filter or stream handler, without a fork. | A custom loader, tool or render path, without a fork. | Modes, extensions, services and data sources. This is the purpose of the framework. | Configuration and composition of modes, under the limit above. |
| **6 Private** | Provides de-identification tools. Has no network layer. | Retrieves only from the configured source. | Sends nothing outside the deployment. | Sends nothing outside the deployment. |
| **7 Compatible** | The API for the code that calls it. | The API for the code that calls it. | The API, and the contracts for an extension and a mode. | The **configuration**. A deployment that only configures continues to work. |

## How a conflict between two goals is settled

The order of the six competing goals is:

> **correct > compliant > fast > compatible > easy > customizable**

The order is a matter of **degree**. The order is not a strict order, and a higher goal does not win
every argument. Three rules apply, and they apply in this sequence.

### Rule 1 — try to keep both goals

Before you trade one goal against another, try to keep both. The usual shape is:

- The previous behaviour stays available as a configuration.
- The better behaviour becomes the default.

A reviewer can check whether you tried this. Try it first.

### Rule 2 — the higher goal wins, unless the degree says otherwise

The higher goal wins by default. A lower goal wins when the loss to the higher goal is **small** and
the gain to the lower goal is **large**. The pull request states that comparison in writing.

Two examples:

- A change keeps compatibility, and it makes the software very hard to use. **Easy wins.** The loss
  to compatibility is small, and the gain to ease of use is large.
- A change keeps compatibility, and it makes the software very slightly harder to use.
  **Compatible wins.** The gain to ease of use is too small to pay for the loss.

### Rule 3 — two things are outside the degree rule

- **A clinically significant correctness loss is not traded for any gain.**
  [What "correct" means](#what-correct-means) defines "clinically significant".
- **Privacy is not traded.**

## What "correct" means

Correctness is a matter of degree. The requirement is correctness at a **clinically significant**
level, and not exact mathematical correctness. Perfect correctness that makes the software
impossible to use is not the intent.

### The categories that are always significant

A change in any of these categories is clinically significant:

1. **Geometry and spatial registration** — the map from a pixel to the patient, the image position
   and orientation, the frame of reference, the spacing, and the order of the slices.
2. **Measured values and their units** — length, area, volume, angle, Hounsfield units, SUV, and the
   calibration behind each value.
3. **Identity and position of a segment or an annotation** — which segment or annotation, on which
   frame, at which coordinates.
4. **Transformation of a pixel value** — the rescale and modality LUT, the window and VOI LUT, the
   presentation LUT, and the decode of the transfer syntax.
5. **Identity and grouping of a study, a series and an instance** — which instances form a display
   set, and which study and series hold them.

### The tests that make a difference not significant

- A geometric difference that is smaller than one display pixel **and** smaller than one source
  voxel.
- A numeric difference that is below the precision of the displayed value, or below the
  quantisation step of the stored value.

**This list is open.** More tests can join it later. Some differences are clinically significant and
have no name here yet, and a reviewer argues each of those on its merits.

### Who decides

The reviewer of the pull request decides. The reviewer escalates to a maintainer. The steering
committee decides only when this document itself is in question.

### Verification, and the record

The projects do not seek regulatory clearance. Many deployments still use the software clinically.
So the projects record the information and the decisions that a deployment could use toward its own
clearance. That record is not complete, and it is not a hard requirement.

A change that alters what a user sees or measures is expected to carry a written specification.
Another change needs no specification.

**[Not yet true]** The specifications live in `platform/docs/docs/development/specs/`. The
specifications in the `specs/` directory at the root of the repository move there.

## What "fast" means

These operations must stay fast:

1. The study list appears and is usable.
2. The first image of a study appears.
3. **Tool interaction** — navigation and cine, window and level, placement and edit of a
   measurement, and edit of a segmentation.
4. A volume becomes ready for MPR or 3D.
5. The software creates and saves a derived object, such as a segmentation or a measurement report.

A pull request that claims a gain in speed names the operation that it improves.

The list leaves out "a study loads completely". That measurement rewards the wrong behaviour,
because a viewer that waits for a complete load scores better than a viewer that displays the first
image early.

### Informational guidance

The numbers below are **informational**. They are not requirements, and they are not definitions.
They describe what "fast" feels like. Not every operation can meet them.

- A result that appears in about 250 ms feels quick.
- A continuous operation, such as a fast scroll or a drag, needs about 10 to 30 frames each second
  to feel continuous.

A measured budget for one operation belongs in the specification for that operation, together with
the reference configuration that the measurement uses.

## What "compliant" means

The projects read and write conformant DICOM. The projects also handle data that is not conformant,
because that data exists and a user still needs to see it. Three rules apply.

### Rule 1 — record every repair

Every repair goes into a verification log. The log is on by default, and a deployment can turn the
log off.

**[Not yet true]** A verification log of this kind exists in the software.

### Rule 2 — tell the user only when the error is subtle

Tell the user when the repair can be wrong **and** a wrong repair is not obvious on the screen.

- A certain repair does not need a message. Example: an image position that is stored with the wrong
  VR, and whose value is still unambiguous.
- A repair whose failure is obvious does not need a message. Example: the interpretation of colour. A
  user sees a wrong colour immediately.
- A subtle repair needs a message, because a subtle error confuses the use of the software.

### Rule 3 — a deployment can declare a known deviation

A back end can deviate from DICOM in a systematic way. Example: a back end that always stores RGB
data while the DICOM says `YBR_FULL_422`. A deployment configures that deviation as a hard rule for
all data from that back end. The software then applies a rule, and the software does not repair
anything.

### When the value is neither derivable nor configured

The software shows the data, and the software puts a permanent visible mark on the viewport for as
long as it shows that data.

There is one exception. When a guess would put the data in the wrong place in space, or would
attribute the data to the wrong study or series — categories 1 and 5 of
[What "correct" means](#what-correct-means) — the software does not show the data. A mark on the
screen does not help a user who cannot see that a lesion is on the wrong slice.

### Data that is not DICOM

The **data source** is the extension point. A deployment writes a data source that maps another
format into the internal model. The internal model stays DICOM-shaped: it is naturalized DICOM JSON.

## Privacy

The software sends patient data only to the data sources that the deployment configures. It contains
no analytics, no telemetry and no error report that leaves the deployment.

"Leaves the deployment" depends on **who chooses the destination**. A log server that the deployment
configures is part of the deployment. The constraint is that the projects ship nothing that sends
data to a destination that **the projects** chose.

**[Not yet true]** The documentation states what the software stores in the browser, and for how
long.

The projects provide the tools to de-identify data. The projects do not decide when
de-identification is necessary, because that decision belongs to the deployment. The projects do not
make a deployment compliant with a privacy regulation. That responsibility stays with the
deployment.

## Compatibility

**[Open]** The clauses in this section are a default. The steering committee decides the final form.

There are two tiers of API:

- **Public.** The documentation describes it. A change to it follows the rules below.
- **Internal.** It can change in any release.

**An export that the documentation does not describe is internal, and it can change in any release.**

The rules for the public tier:

- A breaking change goes into a major release.
- A deprecation stays for at least two minor releases.
- A major release carries a migration guide.

For the OHIF Viewer, the public surface is the **configuration**, and not the code.

**[Not yet true]** A document lists the public API surface of each project.

## The regulatory position

**The projects do not seek regulatory clearance, and they do not intend to seek it.** Clearance is
not possible for a project of this kind.

- The OHIF Viewer does not have 510(k) clearance from the U.S. Food and Drug Administration, and it
  does not have a CE mark.
- The OHIF Viewer does not meet all of the criteria for HIPAA compliance.
- A deployment that uses the software clinically carries the whole regulatory responsibility.
- The license does not prevent a company from seeking clearance for a product that uses these
  projects. Several cleared products already do this.

The projects still record decisions in a form that a deployment can cite. See
[Verification, and the record](#verification-and-the-record).

## What is not a goal

**Governance and sustainability.** How the projects are funded and maintained is important, and it
belongs in a governance document. This document states direction. A single document that holds both
makes both harder to change.

**Accessibility and internationalization.** **[Open]** The Viewer ships eleven locales today. The
projects have not put resources into accessibility, and a goal that nobody works on becomes a promise
that a reader quotes back at the projects. "Not yet a goal" is the honest statement. The steering
committee can change this.

## What is not yet true

Every statement in this document is in the present tense, except these:

| Statement | Section |
| --------- | ------- |
| One single-instance DICOM parser exists, and dcmjs is that parser. | [dcmjs](#dcmjs--a-library) |
| The specifications live in `platform/docs/docs/development/specs/`. | [Verification](#verification-and-the-record) |
| A verification log for a repair exists in the software. | [What "compliant" means](#what-compliant-means) |
| The documentation states what the software stores in the browser, and for how long. | [Privacy](#privacy) |
| A document lists the public API surface of each project. | [Compatibility](#compatibility) |

## Open for decision

The steering committee decides these. Until it decides, the stated default has full force.

| Clause | Default | Section |
| ------ | ------- | ------- |
| The two API tiers, and the rule that an undocumented export is internal. | As written. | [Compatibility](#compatibility) |
| The length of the deprecation window. | Two minor releases. | [Compatibility](#compatibility) |
| Accessibility and internationalization as a goal. | Not a goal. | [What is not a goal](#what-is-not-a-goal) |

The order of the goals is **not** open. The order is the mechanism that applies every other clause
in this document.

## Change log

| Date | Change |
| ---- | ------ |
| 2026-09-18 | First version. |
