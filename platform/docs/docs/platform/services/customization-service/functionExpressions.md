---
id: functionExpressions
title: $function Expressions
summary: The safe expression language that data-only customizations use to compute values, how its call signatures are declared, and how a deployment withholds attributes from it.
sidebar_position: 13
---

# `$function`: safe expressions in data customizations

Data-only customizations — JSONC URL modules and JSON app configs — are parsed
as data and never executed. Where such a customization needs a computed value
instead of a literal, it writes a `$function` marker:

```jsonc
{ "$function": "Modality === 'CT' && Rows >= 256" }
```

A `{ "$function": "<expression>" }` value anywhere in a customization is
compiled — once, at read time — into a plain closure. The expression
language is a small, safe subset of JavaScript expressions. There is no
`eval` or `new Function` (CSP-safe), no assignments, no arbitrary calls, and
no prototype access (`__proto__`, `constructor` and `prototype` are rejected
at parse time).

The main user today is [display set splitting](./displaySetSplitting.md), and
the examples below come from its split rules. The mechanism itself is not
specific to split rules: expressions can return strings as well as booleans,
so the same marker works for text-producing customizations such as viewport
overlay items.

## Supported syntax

- literals: numbers (including exponent notation, `1e3`, `2.5E-3`),
  `'strings'`, arrays, `true/false/null/undefined`, and template literals for
  building strings: `` `${SeriesDescription} #${InstanceNumber}` ``
- member/index access: `context.series.frameCount`, `instances[0]`
- comparison: `== != === !== < <= > >=` (`==`/`!=` treat `null` and
  `undefined` as equal and compare numeric strings numerically)
- logic and arithmetic: `&& || !`, `+ - * / %`, ternary `a ? b : c`
- membership: `Modality in ['CR', 'DX', 'MG']`
- helper functions: `defined(x)`, `includes(listOrString, v)`,
  `startsWith(s, p)`, `endsWith(s, p)`, `abs`, `min`, `max`, `round`,
  `floor`, `ceil`, `Number`, `String` (`min()`/`max()` with no arguments
  evaluate to `undefined` rather than `±Infinity`)
- aggregates over a list, evaluating the second argument once per element:
  `some(instances, DiffusionBValue != undefined)`,
  `every(list, expr)`, `count(list, expr)`, `minOf(list, expr)`,
  `maxOf(list, expr)`, `sumOf(list, expr)`

## Name resolution

The compiled closure's arguments bind to declared parameter names (default
`['instance', 'context']`; override with
`{ "$function": { "expr": "...", "params": [...] } }`). Bare identifiers
resolve parameter names first, then fields of the **first** argument — so
with the default parameters, bare `Modality` or `Rows` read the instance's
DICOM tags, while anything else is reached through `context`.

:::caution Bare identifiers still bind to the first argument
With two subjects in scope — a comparator `(a, b, context)` — a bare
`SliceLocation` resolves against `a`, the first argument, rather than being an
error. So `SliceLocation - b.SliceLocation` silently means
`a.SliceLocation - b.SliceLocation`. Write `a.` and `b.` explicitly in a
comparator.
:::

## Errors

Parse errors are reported at customization-read time with the offending
expression; runtime errors warn once and evaluate to `undefined`.

A marker that fails to compile resolves to `undefined`, and the rest of the
customization is still read. What `undefined` means is up to the code that
reads the value — the caller is responsible for refusing a value where
`undefined` would be dangerous. Split rules, for example, drop a rule whose
`matches` did not compile (see
[display set splitting](./displaySetSplitting.md#split-rules-as-data)).

## Where the language lives

The expression language itself lives in `@cornerstonejs/metadata` (as
`compileExpression`, part of its **safe functions**) rather than in OHIF, so a
server building a study index compiles the same expressions the viewer does.
OHIF contributes only the `$function` marker that wires it into
customizations.

## How a `$function` is called

The compiled closure's parameters are declared by the code that **calls** it, not
by the data that writes it:

```ts
customizationService.registerFunctionSignatures({
  // `splitRules` is keyed by rule id, so `*` is the rule id.
  'useMetadataDisplaySet.splitRules.*.matches': ['instance', 'context'],
  'useMetadataDisplaySet.splitRules.*.compareInstances': ['a', 'b', 'context'],
  'useMetadataDisplaySet.compareInstances': ['a', 'b', 'context'],
});
```

The extension that reads a customization registers its signatures, so data
written in JSONC does not state a convention and cannot state a wrong one. A
marker that declares `params` disagreeing with the registered signature is
compiled with the registered one and warns — data changing its own calling
convention is how a marker computes nonsense while looking correct. With
nothing registered for a path, the default `['instance', 'context']` applies
and a marker's own `params` are honoured.

Paths use the same syntax as the deny list below.

## Withholding an attribute from data

A `$function` cannot run code; it computes the value of the attribute it sits on
from the subject it is handed. A deployment that nonetheless wants to keep data
out of a particular attribute names it in
`appConfig.customizationFunctionPolicy.denyAttributes`:

```js
window.config = {
  customizationFunctionPolicy: {
    denyAttributes: [
      // this deployment composes series labels centrally
      'useMetadataDisplaySet.splitRules.*.customAttributes.SeriesDescription',
    ],
  },
};
```

A path is the chain of object keys from the customization id to the key holding
the marker. Object keys are segments, so a split rule's id is a segment:
`useMetadataDisplaySet.splitRules.ctScout.matches`. **Array indices are not
segments**, so one pattern covers every item in a list and stays valid when the
list is reordered. `*` matches exactly one segment (useful for author-named keys
such as a rule id or a series fact); a trailing `**` matches any remaining
segments. A refused marker resolves to `undefined` with a
console warning naming the path, and the rest of the customization still applies.

**Nothing is denied by default.** `['**']` switches `$function` off entirely.

It is a deny list rather than an allow list because the set of attributes a
customization may legitimately compute is not knowable in advance — a split
rule's `customAttributes` keys, for example, are chosen by its author — so an
allow list would refuse working configurations by default, which is a worse
failure than the one it would prevent.

Like `customizationUrlPrefixes`, this policy is read from the **app config and
never from a customization** — customizations can be loaded from the URL, so a
customization able to define the policy could lift its own restrictions.

## Unknown attributes resolve to `undefined`

An expression naming an attribute the subject does not carry evaluates to
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
