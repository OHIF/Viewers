---
sidebar_position: 1
sidebar_label: Work Item — segment-level attribution
title: 'DICOM Work Item Proposal: segment-level attribution and approval'
summary: Draft DICOM work item proposal for a supplement adding per-item human attribution and approval to Segmentation, RT Structure Set and Annotation objects.
---

# DICOM Work Item Proposal

**Segment-Level Attribution and Approval in Derived Objects**

> **Status of this document.** Draft, prepared for submission to DICOM WG-06. It is written in the
> DICOM Work Item Proposal form so it can be submitted with minimal reshaping, but it has not been
> submitted and no supplement number has been assigned. Attribute tag numbers, VRs, and module
> membership cited below were checked against a DICOM data dictionary; module composition and code
> values should be re-checked against the current PS3.3 and PS3.16 before submission.
>
> OHIF's own requirements against this gap are `RS-PRV-26`..`RS-PRV-33` in the
> [result-set specification](../result-sets/requirements.md).

---

## 1. Work Item Name

Segment-Level Attribution and Approval in Derived Objects.

## 2. Proposer

| | |
| --- | --- |
| Proposer | Bill Wallace |
| Organization | Radical Imaging / Open Health Imaging Foundation (OHIF) |
| Contact | *to be completed on submission* |
| Sponsoring Working Group requested | WG-06 (Base Standard), for assignment |
| Suggested working groups | WG-23 (Artificial Intelligence / Application Hosting), WG-07 (Radiotherapy) for the RT ROI aspects |

## 3. Date of Proposal

2026-08-11

## 4. Proposed Work Item Type

Supplement. A Correction Proposal is not sufficient: the work adds new optional Attributes and a
new Macro rather than correcting existing text.

## 5. Problem Statement

DICOM can express **which algorithm** produced a segment, but not **which person** created,
modified, or approved it.

For a Segmentation instance (SOP Class 1.2.840.10008.5.1.4.1.1.66.4), per-segment provenance is
well served for software: `SegmentationAlgorithmIdentificationSequence` (0062,0007) carries the
Algorithm Identification Macro per segment, and `SegmentAlgorithmType` (0062,0008) distinguishes
`AUTOMATIC` from `SEMIAUTOMATIC` and `MANUAL`. Instance-wide contributions are recorded in
`ContributingEquipmentSequence` (0018,A001), which is repeatable and carries
`ContributionDateTime` (0018,A002).

There is no equivalent for people. The available attributes are:

| Attribute | Tag | Scope | Limitation |
| --- | --- | --- | --- |
| `ContentCreatorName` | (0070,0084) | Instance | One value; cannot express a second or later contributor |
| `ContentCreatorIdentificationCodeSequence` | (0070,0086) | Instance | Identifies the same single creator |
| `ContributingEquipmentSequence` | (0018,A001) | Instance | Describes *equipment*; its Purpose of Reference codes do not describe a person |
| `OperatorsName` | (0008,1070) | Instance | Acquisition semantics; not a derived-object author |

The consequences in practice:

1. **A corrected segment cannot be attributed.** Where an automatically generated segmentation is
   reviewed and three of twenty segments are corrected by a radiologist, the object can state that
   an algorithm produced the segmentation and that one person is its Content Creator. It cannot
   state which segments the person changed.
2. **Successive contributors are lost.** `ContentCreatorName` is a single value. A second reader
   editing the object either overwrites the first or is not recorded.
3. **Individual segments cannot be approved.** Approval exists in the RT Approval Module —
   `ApprovalStatus` (300E,0002), `ReviewerName` (300E,0008), `ReviewDate` (300E,0004),
   `ReviewTime` (300E,0005) — but applies to the whole instance and only to RT objects. Partial
   approval of a segmentation, which is the normal outcome of reviewing AI output, cannot be
   expressed.
4. **The gap is uneven across closely related objects.** RT Structure Set already has a per-ROI
   person: `ROIInterpreter` (3006,00A6) within `RTROIObservationsSequence` (3006,0080). Structured
   Reporting has full per-item observer context, and content items may override inherited context.
   Segmentation, which is the object most used to carry AI output for human review, has neither.

The absence is increasingly consequential. Regulatory and clinical-governance expectations around
AI-assisted findings assume it is possible to say who accepted a result. Human-in-the-loop review
of machine-generated segmentation is now a common workflow, and it is precisely the workflow DICOM
cannot currently record.

## 6. Scope and Field of Application

Add an optional, repeatable mechanism to record, **per segment, per ROI, or per annotation group**:

- the person or organization responsible for a contribution;
- the nature of that contribution — created, modified, reviewed, approved, rejected;
- when it occurred.

In scope:

- Segmentation IOD — Segment Description Macro.
- RT Structure Set IOD — RT ROI Observations Module, aligning it with the above without
  invalidating `ROIInterpreter`.
- Microscopy Bulk Simple Annotations IOD — Annotation Group.
- A defined term list or Context Group for contribution types.

Out of scope:

- Structured Reporting, which already provides this through observer context and TID 1002.
- Changes to `ContentCreatorName` or any existing Attribute's Type or semantics.
- Authentication and non-repudiation, which remain the province of Digital Signatures; this
  proposal records an assertion, it does not prove one.

## 7. Existing Mechanisms Considered and Rejected

| Mechanism | Why it does not close the gap |
| --- | --- |
| Standard Extended SOP Class carrying SR observer Attributes | Permits addition at the **instance** level only. Instance level is what `ContentCreatorName` already gives. Nesting SR Attributes inside `SegmentSequence` places them where the standard defines no meaning, and a receiver may discard Attributes not defined in the IOD. |
| Companion SR referencing segments by `TrackingUID` (0062,0021) | Conformant and workable, and is the current best practice. But attribution then depends on a second SOP Instance travelling with the first, and is lost whenever the Segmentation is handled alone. |
| Digital Signatures with `DataElementsSigned` (0400,0020) | Genuinely per-item and the correct mechanism for *attestation*. Requires PKI and certificate management disproportionate to recording that a user edited a segment, and does not express contribution history. Complementary rather than alternative. |
| `OriginalAttributesSequence` (0400,0561) | An ordered modification history, but defined for de-identification and coercion; `ModifyingSystem` (0400,0563) is a system, and the sequence records Attribute changes rather than changes to segment content. |
| Private Attributes | What implementors are doing, including OHIF. Works, but is per-vendor, opaque to every other reader, and may be stripped in transit. |

## 8. Proposed Technical Approach

The intent is to **reuse existing constructs** rather than introduce parallel ones.

### 8.1 A Contribution Macro

Define a Macro that may be included at item level in derived-object descriptions:

```
Contribution Sequence                             (gggg,eeee)  SQ   Type 3
  > Contribution Type Code Sequence               (gggg,eeee)  SQ   Type 1
      Baseline CID: created / modified / reviewed / approved / rejected
  > Person Name                                   (0040,A123)  PN   Type 2C
  > Person Identification Code Sequence           (0040,1101)  SQ   Type 3
  > Institution Name                              (0008,0080)  LO   Type 3
  > Contribution DateTime                         (0018,A002)  DT   Type 1
  > Contribution Description                      (0018,A003)  ST   Type 3
  > Algorithm Identification Macro                             --   Type 3
```

Notes on the shape:

- `PersonName` (0040,A123) and `PersonIdentificationCodeSequence` (0040,1101) are the Attributes
  already used for observer identity in SR, so identity is expressed the same way across objects.
- `ContributionDateTime` (0018,A002) and `ContributionDescription` (0018,A003) already exist and
  carry the intended meaning in `ContributingEquipmentSequence`.
- Including the Algorithm Identification Macro permits one uniform record whether the contributor
  was a person or software, and allows a contribution to name both — for example a person who
  accepted a specific algorithm's output.
- The sequence is repeatable, which is what makes a **history** expressible; each item is one
  contribution.

An alternative worth the working group's consideration is to permit `ParticipantSequence`
(0040,A07A), with `ParticipationType` (0040,A080) and `ParticipationDateTime` (0040,A082), at item
level in these objects. That adds no new Attributes at all. It was not proposed as the primary
approach because `ParticipationType` has SR-oriented Defined Terms, and because a contribution to a
segment is not obviously the same concept as participation in a report.

### 8.2 Inclusion points

| IOD | Include in |
| --- | --- |
| Segmentation | Segment Description Macro, per item of `SegmentSequence` (0062,0002) |
| RT Structure Set | Per item of `RTROIObservationsSequence` (3006,0080); `ROIInterpreter` (3006,00A6) retained, with the Macro as the richer form |
| Microscopy Bulk Simple Annotations | Per Annotation Group |

### 8.3 Approval

Approval is expressed as a Contribution whose Contribution Type is *approved* or *rejected*, rather
than as a separate status Attribute. This gives per-item approval with an identified approver and a
timestamp, and avoids defining a second, parallel status model alongside the RT Approval Module.

Whether a per-item approval implies anything about the instance as a whole, and how it relates to
`ApprovalStatus` (300E,0002) where both are present, needs working group direction.

## 9. Impact on the Existing Standard

- **Backward compatible.** All additions are Type 3. No existing Attribute changes Type, VR, or
  semantics. No SOP Class UID changes.
- **Old readers.** Ignore the new sequence and behave exactly as today.
- **Old writers.** Produce objects that remain conformant; absence of the sequence means only that
  no per-item attribution was recorded.
- **`ROIInterpreter`.** Retained. Where both are present the working group should state precedence;
  the natural rule is that the Macro is authoritative and `ROIInterpreter` is a summary.
- **No conflict with Digital Signatures.** A signature may cover the new sequence, making a
  contribution record attestable where a deployment requires it.

## 10. Relationship to Other Work

- Complements the Algorithm Identification Macro and
  `SegmentationAlgorithmIdentificationSequence` (0062,0007), which cover software provenance for
  the same items.
- Complements `ContributingEquipmentSequence` (0018,A001), which remains the instance-level record.
- Overlaps deliberately with the RT Approval Module, and the relationship needs to be stated.
- Related to ongoing interest in AI result provenance and in human-in-the-loop review of
  machine-generated findings.

## 11. Estimated Work Effort

| Item | Estimate |
| --- | --- |
| Supplement drafting | 3–4 working group meetings |
| Attribute and Macro definition, PS3.3 | Moderate — one new Macro, three inclusion points |
| Context Group for contribution types, PS3.16 | Small |
| Data dictionary additions, PS3.6 | Small |
| Public comment and letter ballot | Standard cycle |

No changes to PS3.4, PS3.5, PS3.7, or PS3.10 are anticipated.

## 12. Draft Changes to the Standard

Illustrative only; the working group would restate these.

> **Add to PS3.3, Section C.8.20.2, Segment Description Macro Attributes (Table C.8.20-4):**
> the Contribution Sequence Attribute, Type 3, with the item description of §8.1 above.

> **Add to PS3.3, Section C.8.8.8, RT ROI Observations Module Attributes (Table C.8.8.8-1):**
> the Contribution Sequence Attribute, Type 3, within the items of RT ROI Observations Sequence
> (3006,0080). Retain ROI Interpreter (3006,00A6).

> **Add to PS3.16:** a Context Group of Contribution Types, with initial values for *created*,
> *modified*, *reviewed*, *approved* and *rejected*.

> **Add to PS3.6:** the data dictionary entries for the new Attributes.

## 13. Supporting Information

The proposer maintains OHIF, an open-source DICOM viewer, in which this gap is currently being
worked around with private Attributes inside `SegmentSequence` items. That workaround, and the
requirements driving it, are recorded publicly at `RS-PRV-26`..`RS-PRV-33` of the
[result-set specification](../result-sets/requirements.md), including the reasoning for rejecting
each alternative in §7 above.

The proposer is willing to contribute drafting effort and to provide a reference implementation.
