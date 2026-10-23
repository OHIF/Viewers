---
id: functionExpressions
title: Split Rule Expressions
summary: The safe expressions a split rule can use in a context entry or an attribute - the @cornerstonejs/metadata safe functions - and how the compiler checks the names that an expression reads.
sidebar_position: 13
---

# Split rule expressions

[Split rules](./displaySetSplitting.md) are `@cornerstonejs/metadata` raw
selector data. Most of a rule is a map of name to test — `"Modality": "CT"`,
`"isMultiFrame": false`, `"Rows": { "greaterThan": 256 }` — and where a test is
not enough, a context entry is an expression, and the rule reads the entry by
its name:

```jsonc
"context": { "isLargeCt": "Modality == 'CT' && Rows >= 256" },
"matches": { "isLargeCt": true }
```

The expression language is the **safe functions** of `@cornerstonejs/metadata`
(`compileExpression`). OHIF has no expression language or marker of its own:
the same rule data compiles in the viewer and on a server that builds a study
index. It is a small, safe subset of JavaScript expressions. There is no `eval`
or `new Function` (CSP-safe), no assignments, no arbitrary calls, and no
prototype access (`__proto__`, `constructor` and `prototype` are rejected at
parse time).

:::note Earlier revisions
An earlier revision of this feature had an OHIF-only `$function` customization
marker, with a function-signature registry and a
`customizationFunctionPolicy.denyAttributes` policy. They are gone. A later
revision had `{ "expression" }` conditions, `series` facts, `classifier` tests
and `customAttributes` recipes in a rule. They are gone too: put an expression
in a context entry, and read the entry by its name.
:::

## Where an expression goes

| Place | Form |
|---|---|
| a context entry (`displaySetContext`, or the `context` of a rule) | a string |
| an attribute value of `attributes` | `{ "expression": "..." }` |

`{ "template": "{SeriesDescription} b={DiffusionBValue}" }` is the simpler form
for text, in a context entry and in `attributes`.

## Supported syntax

- literals: numbers (including exponent notation, `1e3`, `2.5E-3`),
  `'strings'`, arrays, `true/false/null/undefined`, and template literals
- comparison: `== != < <= > >=`. There is no `===` or `!==`. `== null` is true
  for an absent value and for an empty value
- logic and arithmetic: `&& || !`, `+ - * / %`, ternary `a ? b : c`
- membership: `Modality in ['CR', 'DX', 'MG']`
- helper functions: `defined`, `includes`, `contains`, `startsWith`,
  `endsWith`, `lower`, `abs`, `min`, `max`, `round`, `floor`, `ceil`, `Number`,
  `String`. `includes(ImageType, 'LOCALIZER')` tests whole elements, and
  `contains(SeriesDescription, 'T1')` tests text
- aggregates over the series: `series.instances.count()`,
  `series.instances.count(x)`, `.min(x)`, `.max(x)`, `.sum(x)`. In
  `attributes` only, `displaySet.instances.*` runs over the display set

The `@cornerstonejs/metadata` documentation of safe functions has the full
reference.

## Name resolution

A name is a DICOM keyword of the dcmjs dictionary (`Modality`, `Rows`), or a
context name (`isLocalizer`, `sliceSpacing`). A keyword reads the attribute of
the instance; in `attributes`, it reads the first instance of the display set. A
context name reads the value of that entry. A group field reads by its path, for
example `planeGeometry.spacing`.

## Errors

The metadata compiler parses every expression, and checks every name, when it
compiles the rule. A name that is not a keyword and not a context name is a
compile error, with a suggestion when only the case differs:
`unknown name 'modality'; did you mean 'Modality'?`. A private tag or a vendor
attribute needs a declaration in the context, for example
`"myValue": { "attribute": "00191010" }`.

OHIF does not drop a rule that does not compile: the viewer creates **no
display sets**, and shows an error notification that names the rule (see
[Rule errors](./displaySetSplitting.md#rule-errors)). A mistake in a rule must
stop the display, because a grouping without that rule can look correct and
still be wrong.

An expression does not fail at run time: an error at run time evaluates to
`undefined`. Only a function that code supplies, for example a code entry of
the context, can throw at run time. That error stops display set creation for
the study, and the notification names the rule, the field and the series.

## A known attribute that the instance does not carry

A keyword that the instance does not carry gives no value, and does not throw.
That makes sparse DICOM tags usable (`DiffusionBValue == null`). It also means
that a rule that reads an attribute the data source does not supply compiles,
and then matches nothing, or groups every instance together.

When an expression matches nothing, check that the instance carries the
attributes that it reads. `collectIdentifiers` from `@cornerstonejs/metadata`
reports the names that an expression reads.
