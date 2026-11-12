---
sidebar_position: 1
sidebar_label: Requirements (EARS)
title: Display set splitting — requirements
summary: Declarative, deterministic split rules that let a user fix how the images of a series are grouped into display sets, that an AI assistant can write from a clinical description, and that a server can reuse.
---

# Display set splitting — requirements

**Prefix:** `SP` (split rules) — *proposed, not yet reserved in the specification register.*
**Source:** [OHIF/Viewers#6137](https://github.com/OHIF/Viewers/pull/6137) — *feat: Add ability to
use new display set split rules*.
**Status:** Draft, under review. This document holds the user requirements. The
[implementation specification](./implementation.md) holds the implementation requirements.
**Affects:** `@ohif/core` (`DisplaySetService`, `CustomizationService`), `@ohif/extension-default`,
`@cornerstonejs/metadata`.
**Related:** [Display Set Splitting](../../../platform/services/customization-service/displaySetSplitting.md)
— the reference documentation for the rule format.
[Split Rule Expressions](../../../platform/services/customization-service/functionExpressions.md)
— the reference documentation for the expression language.

---

## 1. Purpose

**The goal: allow users to fix the grouping of images into display sets for their specific
data.**

A display set is the unit that the study browser shows and that a viewport displays. The OHIF
defaults group the images of a series well for most data. Some data needs a different grouping:

- a CT series that holds a scout image and an axial volume,
- an MR diffusion series that mixes b-values,
- an ultrasound series that mixes single images and clips,
- a vendor series that puts two acquisitions in one series.

Before this work, a change to the grouping needed a new SOP class handler in TypeScript and a new
build of OHIF. This specification defines a different route. A **split rule** is a short,
declarative text entry. A person can read the rule, a reviewer can check the rule in a diff, and
OHIF applies the rule the same way every time.

Two kinds of person write rules:

1. **An experienced rule author** writes the rule directly.
2. **A clinical user** describes the problem to an AI assistant, for example Claude, in clinical
   words: "the first image of every CT is the scout, and the scout breaks the MPR". The assistant
   writes the rule. The clinical user tests the rule on the study, and a reviewer adds the rule to
   the deployment.

The second route is the more likely route. The rule format is therefore designed so that an
assistant can write a correct rule, and so that a person who did not write the rule can still
read and check it.

The same rule must also work outside the viewer. A server that builds a study index must be able
to read the rule and produce the same display sets. A tool must be able to generate rules again
and again, and each new generation must replace the earlier rule safely.

> The motivating consequence is clinical. A wrong grouping is not only untidy. A scout image in a
> volume makes the volume non-reconstructable, so MPR is not available. Mixed b-values in one
> stack give one window level for images with very different intensities. The user sees a
> problem, but today the user cannot fix it.

## 2. Scope

### 2.1 How to read this specification

This document states the **user requirements** (§4): what the user must be able to do, or must
be able to determine, to work safely. A user requirement names no class, file, endpoint, or
algorithm. The [implementation specification](./implementation.md) states the **implementation
requirements**: how the work was done, or the recommended approach. Each implementation
requirement cites the user requirements that it satisfies.

You can change the implementation specification freely when a better approach appears. You
change this document in two cases only: a requirement describes the behaviour wrongly, or the
intended user-facing behaviour changes. An implementation that is inconvenient is never a reason
to change this document.

### 2.2 In scope

- Split rules for the instances of a series, with the `@cornerstonejs/metadata` default rules.
- The handler step: a rule names a generic handler, and the SOP class handler that declares that
  name extends the display set.
- The layering of rules from the defaults, a mode, the app config, and a URL module.
- The rule format: the `@cornerstonejs/metadata` raw selector form (`DisplaySetRules`).
  This form is the one definitive rule format.
- The stability of display sets when instances arrive later, or when the rules change during a
  session.
- Reuse of rules by a server (§4.6). The server implementation itself is future work.

### 2.3 Out of scope

- **The content of secondary objects** — SEG, SR, RT Structure Set, Parametric Map, PDF, video,
  whole-slide, and ECG. A default rule makes their display sets, and their dedicated extensions
  add the fields of each kind of object. The result-set specification (`RS-DS`)
  covers display sets for secondary results.
- **One display set from two or more series.** This is intended functionality, and it is future
  work. The engine splits one series at a time today. See `SP-FIX-7` and §6 item 2.
- **A split of the frames of one multiframe instance** — for example, an MR instance that holds
  interleaved echo 1 and echo 2 frames. This is intended functionality for a follow-up pull
  request. See `SP-FIX-8` and §6 item 6.
- **A graphical rule editor** in the viewer.
- **Automatic deployment of a generated rule.** A person always applies the rule (`SP-DESC-5`).
- **Hanging protocols.** A hanging protocol selects display sets. A split rule creates display
  sets. The two stay separate, although a rule can set attributes that a hanging protocol reads.
  Since [OHIF/Viewers#6386](https://github.com/OHIF/Viewers/pull/6386), a hanging protocol
  constraint and a split rule operator of the same name have the same meaning in most cases. The
  migration guide [Hanging protocol comparisons](../../../migration-guide/3p13-to-3p14/hanging-protocol-comparisons.md)
  lists the differences that remain.

## 3. Definitions

**Display set.** A group of instances that the study browser shows as one item and that one
viewport displays.

**Split rule** (or **rule**). One declarative entry that states which instances it claims, how it
groups them, how it orders them, and what attributes the resulting display sets get.

**Rule set.** The rules that apply to a deployment: the rule registry and the rule order.

**Rule registry.** The rules of a deployment, keyed by rule id. A rule in the registry does nothing
until the rule order names it.

**Rule id.** The key of a rule in the rule registry. One id names one rule.

**Rule order.** The list of rule ids that sets the evaluation order of the rules. A rule that the
rule order does not name is off.

**Claim.** An instance is claimed by the first rule, in rule order, that matches the instance.

**Series fact.** A value that a rule computes once from all of the instances of a series, for
example the frame count of the series. All rules of a split share the series facts. The
[series context](./series-context.md) specification defines them.

**Split key.** The identity of the group that created a display set. The split key holds the rule
id and the rule's grouping values. The split key holds no position.

**Rule layer.** One source of rule changes: the defaults, a mode, the app config, or a URL module.

**Rule author.** A person who writes a rule directly.

**Clinical user.** A person who knows the data and the clinical problem, and who does not know the
rule syntax.

**Assistant.** An AI assistant that writes a rule from the description of a clinical user.

**Reviewer.** A person who checks a rule before the rule goes into a deployment.

**Server index.** A study-level index that a server builds, for example with Static-DICOMWeb, and
that lists the display sets of a study.

*The system* means the OHIF Viewer, the rule format, and its documentation, unless a requirement
narrows it.

---

## 4. User requirements

> Change these only if a requirement describes the behaviour wrongly, or if the intended
> user-facing behaviour changes.

### 4.1 Fix the grouping — `SP-FIX`

**SP-FIX-1**
The system shall let a deployment change how the instances of a series are grouped into display
sets, without a change to the OHIF source code and without a new build.

**SP-FIX-2**
The system shall let a rule split one series into two or more display sets.

**SP-FIX-3**
The system shall let a rule set the label and the series description that the study browser and
the viewport overlay show for each display set that the rule creates.

**SP-FIX-4**
The system shall let a rule set the order of the images in each display set that the rule creates.

**SP-FIX-5**
The system shall let a deployment turn off, replace, change, or move one default rule, and keep all
of the other default rules.

**SP-FIX-6**
WHEN no custom rule matches an instance, the system shall group that instance exactly as it would
without the custom rules.

> A rule for CT scouts must not change the MR series of the same study. A user who adds one rule
> must be able to trust that the rest of the study looks as it did before.

**SP-FIX-7** *(deferred)*
WHERE a deployment needs one display set from the instances of two or more series, the system
shall let a rule make that display set.

> Deferred. This is intended functionality, and it is future work. The engine gets one series at a
> time today. The requirement stays so that the design does not exclude it. See §6 item 2.

**SP-FIX-8** *(deferred)*
WHERE one multiframe instance holds the frames of two or more acquisitions, the system shall let a
rule split those frames into separate display sets.

> Deferred to a follow-up pull request. The example is an MR instance with interleaved echo 1 and
> echo 2 frames. The engine claims and groups whole instances today, so a rule cannot separate the
> frames of one instance. See §6 item 6.

**SP-FIX-9**
WHILE the split rules are on and the rule order holds the catch-all rule, the system shall show an
instance that no other rule gives to an extension of the mode as an unsupported display set. The
system shall show the same instance with the display of its extension while the split rules are
off.

**SP-FIX-11**
WHERE a deployment removes the catch-all rule from the rule order, the system shall give an
instance that no rule claims to the display of its extension, as when the split rules are off.

**SP-FIX-10**
The documentation shall state what an extension must add so that its display sets show while the
split rules are on.

> An extension of another party that shows a private kind of object must take part in the rules,
> or a deployment that turns on the rules shows its objects as unsupported. The rules are off by
> default, so a deployment that does not turn them on sees no change. The migration guide
> *Display set split rules and SOP class handlers* states the steps.

### 4.2 Describe the problem, get a rule — `SP-DESC`

**SP-DESC-1**
The rule format shall let a clinical user get a correct rule from a description of the problem in
clinical words, through an assistant, without knowledge of the rule syntax.

**SP-DESC-2**
The documentation shall give an assistant all of the information that a correct rule needs: the
rule fields, the expression language, the default rule order, the ownership test for SOP classes, and
one complete worked example.

**SP-DESC-3**
The rule format shall let a rule carry comments that state the problem the rule fixes and the
series that the rule changes.

**SP-DESC-4**
The system shall let a user apply a new rule to a study that is open in the viewer, and see the
resulting display sets, before the rule goes into a deployment.

**SP-DESC-5**
The system shall not apply a rule from an assistant to a deployment without an action by a person.

**SP-DESC-6**
The system shall let a user give an assistant the attributes that a rule needs, without the
patient identifiers of the study.

> A clinical user who describes a problem will want to show the assistant the data. The data
> carries patient names and identifiers beside the acquisition tags. The route from "this study
> groups wrongly" to "here is a rule" must not need those identifiers.

### 4.3 Readable and reviewable — `SP-READ`

**SP-READ-1**
A rule shall be data that a person can read without a build step and without execution of code.

**SP-READ-2**
A rule shall be text that a code review diff shows line by line.

**SP-READ-3**
A change to one rule shall change only the rule set entry with that rule id.

**SP-READ-4**
The system shall let a user determine which rule created a given display set.

**SP-READ-5**
The system shall let a user determine which attributes an expression reads.

> `SP-READ-5` is for the most common defect: a misspelt attribute. `Modallity === 'CT'` is a
> valid expression that matches nothing.

**SP-READ-6**
The system shall let a hanging protocol, or another reader of display sets, determine which
display sets come from one group of related rules, whichever rule of the group created each
display set.

> Several rules can make one kind of display set, because the data comes in different forms. For
> example, mammography can arrive as breast tomosynthesis, as legacy mammography with all its
> views in one series, and as mammography that the modality already split into one series for
> each view. A deployment can also have a breast tomosynthesis rule for CT. Each form needs its
> own rule, but a hanging protocol must find all of these display sets as mammography, and must
> not list every rule id.
>
> A rule is its own group unless the deployment says otherwise. The deployment sets a group only
> where it must treat several rules as one.

### 4.4 Deterministic and stable — `SP-DET`

**SP-DET-1**
WHEN the system splits the same complete series with the same rule set, the system shall produce
the same display sets, with the same instances, in the same order, with the same split keys.

**SP-DET-2**
WHEN the system splits a complete series in one pass, the result shall not depend on the order in
which the instances arrived.

**SP-DET-3**
WHILE a series is shown, WHEN new instances of that series arrive, the system shall keep every
existing display set, its instances, and its identity, so that the viewport keeps its state.

**SP-DET-4**
WHILE a series is shown, WHEN the rule set changes, the system shall keep every existing display
set, its instances, and its identity, so that the viewport keeps its state.

> `SP-DET-3` and `SP-DET-4` protect viewport state. A display set that disappears, or that loses
> an instance, loses its viewport, its measurements context, and its presentation state. So an
> incremental split can give a different result from a split of the complete series from the
> start. The reference documentation states the difference with an ultrasound example. That
> difference is correct behaviour, not a defect.

### 4.5 Safe — `SP-SAFE`

**SP-SAFE-1**
A rule shall not be able to run code other than the expressions of the rule expression language.

**SP-SAFE-2**
The system shall evaluate every condition of a rule, for every instance, to a definite result:
the rule applies, or the rule does not apply.

> The safe functions give this guarantee. An expression has no side effects, and an attribute
> that an instance does not carry gives `undefined`, not an error. So a user can always determine
> whether a valid rule applies to an instance.

**SP-SAFE-3**
IF a rule fails at run time, THEN the system shall create no further display sets for the study,
and shall show the user an error that names the rule and the series.

> A fallback to the grouping without rules has the same problem as a dropped rule (`SP-SAFE-7`):
> the grouping looks correct, but it is not the grouping that the deployment intended. A valid raw
> rule cannot fail at run time (`SP-SAFE-2`). A rule that code supplies as a function can. The
> display sets that exist before the failure stay, as `SP-DET-3` requires.

**SP-SAFE-7**
IF a rule in the rule set has an error, THEN the system shall create no display sets for any
study, and shall show the user an error that names the rule.

> A rule can be critical for the clinician who views the study. A rule that the system drops,
> silently or with a warning, gives a grouping that looks correct but is not the grouping that the
> deployment intended. An error that stops the display is safer than a wrong display.
>
> One rule set applies to every study, so an error in the rule set blocks the load of every
> study. This is the same as other errors that prevent the load of a study. The error stays until
> the rule set changes.

**SP-SAFE-4**
The default rules shall not claim an instance that a dedicated extension handles.

**SP-SAFE-5**
WHERE a deployment loads rules from a URL, the system shall load rules only from the locations that
the deployment allows.

**SP-SAFE-6** *(deferred)*
WHERE a deployment denies a rule attribute, the system shall not let any rule compute that
attribute.

> A rule can put any attribute of an instance into a label, and that includes `PatientName`.
> `SP-SAFE-6` lets a deployment keep that text out of the screen, and still let rules split.

### 4.6 Reuse outside the viewer — `SP-REUSE`

**SP-REUSE-1**
A rule shall have the same meaning in the viewer and in a server index.

**SP-REUSE-2**
WHERE a server builds a server index, the server shall produce the same display sets as the
viewer, for the same instances and the same rule set.

**SP-REUSE-3**
A tool that generates a rule shall produce the same rule text for the same input.

**SP-REUSE-4**
WHEN a rule with an existing rule id is applied again, the system shall replace that rule and not
add a second copy.

> `SP-REUSE-3` and `SP-REUSE-4` together make generation repeatable. A tool can generate the rules
> for a data source every night. The result is either no change or a clear diff, and never a
> growing pile of copies.

**SP-REUSE-5**
The system shall let a tool check a rule for errors without a viewer.

---

## 5. Implementation requirements

The [implementation specification](./implementation.md) holds the implementation requirements:
the groups `SP-FORM`, `SP-PIPE`, `SP-EXPR`, `SP-DEPLOY`, and `SP-SRV`.

---

## 6. Open questions

| # | Question | State |
| --- | --- | --- |
| 1 | Which data form is the exchange format for a server? | **Resolved.** The `@cornerstonejs/metadata` `DisplaySetRules` form is definitive, for the viewer and for a server. |
| 2 | One display set from two or more series (`SP-FIX-7`). | **Deferred — future work.** This is intended functionality. The work must decide how to order the instances across the series, and what a display set with items from several series means: its series attributes, its `SeriesInstanceUID`, and its reconciliation when one series gets new instances. The engine gets one series at a time today (`SP-PIPE-4`), and a study-level pass must keep `SP-DET-3`. |
| 5 | The prefix `SP` must go into §1 of the specification register (`specs/index.md`). | **Deferred.** The register is not on this branch. Add the prefix on a branch that holds the register. |
| 6 | A split of the frames of one multiframe instance (`SP-FIX-8`), for example an MR instance with interleaved echo 1 and echo 2 frames. | **Deferred — follow-up pull request.** Out of scope for this change, and intended functionality. The engine claims and groups whole instances today, so the work needs a claim and a grouping for each frame. |
| 7 | A series fact in the raw form is a named boolean only. Can the CT scout example `split/scoutSeries.jsonc` use the raw form? | **Resolved.** The example uses the boolean series fact `hasScout` (scope `mixed`: the series mixes images with and without `LOCALIZER` in `ImageType`), and then matches each localizer instance. The [series context](./series-context.md) specification adds series facts that hold any value. |
| 8 | What does the system do with a rule that has an error? | **Resolved.** The system does not drop the rule. A dropped rule can be a critical rule for the clinician, so the system creates no display sets and shows an error that names the rule (`SP-SAFE-7`, `SP-PIPE-13`). `SP-SAFE-2` states the guarantee of the safe functions: a valid rule always either applies or does not apply. An error in the rule set blocks the load of every study, as other errors that prevent a study load do. |
| 9 | What mechanism lets a deployment deny a rule attribute (`SP-SAFE-6`)? | **Deferred — future item.** |
| 10 | Must a run-time failure of a rule also stop display set creation, as `SP-SAFE-7` does for a rule with an error? | **Resolved — yes.** `SP-SAFE-3` and `SP-PIPE-9` require the stop and an error that names the rule and the series. `SP-PIPE-14` names the field too. |

## 7. Traceability

| Requirement group | Source |
| --- | --- |
| `SP-FIX`, `SP-DET`, `SP-SAFE` | [OHIF/Viewers#6137](https://github.com/OHIF/Viewers/pull/6137), and the reference documentation *Display Set Splitting* |
| `SP-DESC` | The goal in §1: a clinical user describes the problem, and an assistant writes the rule |
| `SP-REUSE` | The decision that the raw selector form is definitive (§6 item 1), and the design of one rule set for the viewer and the server ([OHIF/Viewers#6137](https://github.com/OHIF/Viewers/pull/6137), [cornerstonejs/cornerstone3D#2861](https://github.com/cornerstonejs/cornerstone3D/pull/2861)) |

## 8. Verification

| Requirement group | Test |
| --- | --- |
| `SP-FIX` | `extensions/default/src/displaySetSplitting/urlSplitModules.test.ts`, and the default rule tests of `@cornerstonejs/metadata` |
| `SP-DET` | `platform/core/src/services/DisplaySetService/DisplaySetService.test.ts` |
| `SP-FIX-9` | `DisplaySetService.test.ts` ("gives an unknown name the unsupported handler"), and the `unsupported` rule tests of `@cornerstonejs/metadata` |
| `SP-FIX-10` | A review of the migration guide *Display set split rules and SOP class handlers* |
| `SP-READ-4`, `SP-READ-6` | `extensions/default/src/displaySetSplitting/makeDisplaySetFromInstanceGroup.test.ts`, and the `groupId` tests in `displaySetRules.test.ts` of `@cornerstonejs/metadata` |
| `SP-SAFE-1`, `SP-SAFE-2` | The safe function and raw selector tests of `@cornerstonejs/metadata` (`compile.test.ts`, `displaySetRules.test.ts`, `expression.test.ts`) |
| `SP-SAFE-3` | `DisplaySetService.test.ts`, the run-time part of `split rule errors` |
| `SP-SAFE-7` | `compileSplitRules.test.ts` ("a rule that does not compile is reported, not dropped") and `DisplaySetService.test.ts`, the compile part of `split rule errors` |
| `SP-SAFE-6` | *Deferred* — §6 item 9 |
| `SP-DESC-4`, `SP-FIX-3` | *Pending* — a Playwright test that loads a split rule module and checks the new items in the study browser |
| `SP-SUM` | See §8 of the [series context](./series-context.md) specification |
| The implementation requirements | See §4 of the [implementation specification](./implementation.md) |
