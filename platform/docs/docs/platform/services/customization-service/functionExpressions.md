---
id: functionExpressions
title: Split Rule Expressions
summary: The safe expressions a split rule can use for a condition or a value - the @cornerstonejs/metadata safe functions - and how to diagnose one that matches nothing.
sidebar_position: 13
---

# Split rule expressions

[Split rules](./displaySetSplitting.md) are `@cornerstonejs/metadata` raw
selector data. Most of a rule is structural — `{ "attribute": "Modality",
"equals": "CT" }`, `{ "all": [...] }`, `{ "seriesFact": "hasScout" }` — and
where the structural form is not enough, a condition or a value is an
expression:

```jsonc
"matches": { "expression": "Modality === 'CT' && Rows >= 256" }
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
`customizationFunctionPolicy.denyAttributes` policy. They are gone. Write
`{ "expression": "..." }` in the rule, which the metadata compiler reads.
:::

## Supported syntax

- literals: numbers (including exponent notation, `1e3`, `2.5E-3`),
  `'strings'`, arrays, `true/false/null/undefined`, and template literals for
  building strings: `` `${SeriesDescription} #${InstanceNumber}` ``
- member/index access: `context.series.hasScout`, `ImageType[2]`
- comparison: `== != === !== < <= > >=` (`==`/`!=` treat `null` and
  `undefined` as equal and compare numeric strings numerically)
- logic and arithmetic: `&& || !`, `+ - * / %`, ternary `a ? b : c`
- membership: `Modality in ['CR', 'DX', 'MG']`
- helper functions: `defined(x)`, `includes(listOrString, v)`,
  `startsWith(s, p)`, `endsWith(s, p)`, `abs`, `min`, `max`, `round`,
  `floor`, `ceil`, `Number`, `String`

## Name resolution

A bare identifier reads a field of the instance the rule is looking at, so
`Modality` or `Rows` read the instance's DICOM tags. The rule's series facts are
reached through `context.series`:

| Where | Bare identifiers read |
|---|---|
| `matches`, a `groupBy` value, `runBy` | the instance |
| a `series` fact's `when` | each instance of the series (the scope decides how the results combine) |
| `customAttributes.fromFirstInstance` | the group's first instance |

## Errors

The metadata compiler parses every expression when it compiles the rule. A
parse error names the expression, and OHIF then **drops** that one rule with a
console warning; the other rules stay in charge. An error at run time evaluates
to `undefined`.

## Unknown attributes resolve to `undefined`

An expression naming an attribute the instance does not carry evaluates to
`undefined` rather than throwing, which is what makes sparse DICOM tags usable
(`DiffusionBValue != undefined`). The cost is that a typo behaves the same way:
`Modallity === 'CT'` compiles cleanly and then matches nothing.

There is deliberately no validation against a known-attribute list. A
naturalized instance carries private tags, vendor additions and per-frame data
folded in by the naturalizer, so no dictionary enumerates it — validating
against one would reject expressions that would have worked, and a false
rejection breaks a deployment where a silent no-match only puzzles one.

When an expression mysteriously matches nothing, a misspelt attribute is the
first thing to check. `collectIdentifiers` from `@cornerstonejs/metadata`
reports what an expression actually reads, which is the quickest way to see it.
