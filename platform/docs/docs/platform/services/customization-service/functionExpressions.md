---
id: functionExpressions
title: Split Rule Expressions
summary: Where a split rule can use a @cornerstonejs/metadata safe expression in OHIF, and what OHIF does when an expression has an error. The language reference is in the Cornerstone docs.
sidebar_position: 13
---

# Split rule expressions

[Split rules](./displaySetSplitting.md) are `@cornerstonejs/metadata` rule
data. Most of a rule is a map of name to test — `"Modality": "CT"`,
`"isMultiFrame": false`, `"Rows": { "greaterThan": 256 }` — and where a test is
not enough, a context entry is an expression, and the rule reads the entry by
its name:

```jsonc
"context": { "isLargeCt": "Modality == 'CT' && Rows >= 256" },
"matches": { "isLargeCt": true }
```

The expression language is the **safe functions** of `@cornerstonejs/metadata`.
OHIF has no expression language of its own, so the same rule data compiles in
the viewer and on a server. The language reference is in the Cornerstone docs:

- [Safe functions](https://www.cornerstonejs.org/docs/concepts/safe-functions):
  the syntax, the operators, the helper functions, and the meaning of a missing
  value.
- [Display sets](https://www.cornerstonejs.org/docs/concepts/cornerstone-metadata/display-sets#sharing-rules-between-applications-the-display-set-rules):
  the rule fields, the context, and the `displaySet.` prefix.

:::note `defined` is a literal
`defined` is not a helper function. It is a literal for `==` and `!=` only:
`X == defined` is true when `X` has a value. `X != null` is the same test.
:::

## Where an expression goes

| Place | Form |
|---|---|
| a context entry (the `metadataContext` customization, or the `context` of a rule) | a string |
| an attribute value of `attributes` | `{ "expression": "..." }` |

`{ "template": "{SeriesDescription} b={DiffusionBValue}" }` is the simpler form
for text, in a context entry and in `attributes`.

A bare name always reads the series value. In `sortBy` and `attributes`, the
`displaySet.` prefix reads the value of the display set, for example
`{displaySet.sliceSpacing}` in a template.

## Errors

The metadata compiler parses every expression, and checks every name, when it
compiles the rule. A name that is not a DICOM keyword and not a context name is
a compile error, for example `unknown name 'modality'; did you mean
'Modality'?`. A private tag or a vendor attribute needs a declaration in the
context, for example `"myValue": { "attribute": "00191010" }`.

OHIF does not drop a rule that does not compile: the viewer creates **no
display sets**, and shows an error notification that names the rule (see
[Rule errors](./displaySetSplitting.md#rule-errors)). A mistake in a rule must
stop the display, because a grouping without that rule can look correct and
still be wrong.

An expression does not fail at run time. Only a function that code supplies,
for example a code entry of the context, can throw at run time. That error
stops display set creation for the study, and the notification names the rule,
the field and the series.

A keyword that the instance does not carry gives no value, and does not throw.
So a rule that reads an attribute that the data source does not supply
compiles, and then matches nothing. When an expression matches nothing, check
that the instance carries the attributes that it reads. `collectIdentifiers`
from `@cornerstonejs/metadata` reports the names that an expression reads.
