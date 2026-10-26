---
sidebar_position: 12
sidebar_label: Hanging protocol comparisons
title: Hanging protocol comparisons
---

# Hanging protocol comparisons

The `greaterThan` and `lessThan` constraints of a hanging protocol are now strict.
Before 3.14, `greaterThan` tested `>=` and `lessThan` tested `<=`. The doc comments and
the error messages of the validators already said "greater than" and "less than".

Two new constraints give the old meaning: `greaterThanOrEqual` and `lessThanOrEqual`.

| Constraint | 3.13 | 3.14 |
|---|---|---|
| `greaterThan: n` | value `>=` n | value `>` n |
| `lessThan: n` | value `<=` n | value `<` n |
| `greaterThanOrEqual: n` | not available ("Unknown validator") | value `>=` n |
| `lessThanOrEqual: n` | not available ("Unknown validator") | value `<=` n |

## What to change

Find each `greaterThan` and `lessThan` constraint in your hanging protocols. For each one,
decide which meaning the rule needs:

- The rule needs the old meaning. Rename `greaterThan` to `greaterThanOrEqual`, and
  `lessThan` to `lessThanOrEqual`. Keep the value. This change is exact for every value,
  also for a value that is not an integer.
- The rule needs the strict meaning. Make no change. A rule such as
  `numImageFrames: { greaterThan: 0 }` now means "the display set has images", as its name
  says.

```js
// 3.13: matches a study with 2 or more display sets with images
constraint: { greaterThan: 2 }

// 3.14: the same match
constraint: { greaterThanOrEqual: 2 }
```

For an integer attribute, `greaterThan: n - 1` gives the same result as
`greaterThanOrEqual: n`.

## The OHIF hanging protocols

- `@ohif/hpMammo`: `numberOfDisplaySetsWithImages` changes from
  `greaterThan: 2` to `greaterThanOrEqual: 2`. The match does not change.
- `@ohif/frameView`: `numImageFrames` changes from `greaterThan: 16` to
  `greaterThanOrEqual: 16`. The match does not change.
- The rules `numImageFrames: { greaterThan: 0 }` and
  `numberOfDisplaySetsWithImages: { greaterThan: 0 }` do not change. They are now strict,
  so a display set with 0 image frames, or a study with 0 display sets with images, no
  longer gets the weight of the rule. When the rule is `required`, the display set or the
  protocol no longer matches. This is the intended meaning of these rules: the comments call
  them "match series with images".

## Other changes to the constraint list

- The `Constraint` type of `@ohif/core` (`Types.HangingProtocol.Constraint`) now lists all
  of the validators. The type had `notEquals`, which no validator implements. Use
  `doesNotEqual`.
