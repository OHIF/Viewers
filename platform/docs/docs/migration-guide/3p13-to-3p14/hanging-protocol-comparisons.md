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

## Number values

`greaterThan`, `greaterThanOrEqual`, `lessThan` and `lessThanOrEqual` now read the value as
`@cornerstonejs/metadata` does:

- A numeric string reads as a number: `'5'` is 5. Before 3.14, `greaterThan` failed on a
  string value.
- An array reads as its first element: `[5]` is 5. Before 3.14, `greaterThan` failed on an
  array value.
- A value with no number fails: `null`, `undefined`, `''`. Before 3.14, `lessThan` passed
  on a missing value, because JavaScript reads `null < 10` as true.

The OHIF hanging protocols do not change. Their number rules read `numImageFrames` and
`numberOfDisplaySetsWithImages`, which are numbers.

## What to change

Find each `greaterThan` and `lessThan` constraint in your hanging protocols. For each one,
decide which meaning the rule needs:

- The rule needs the old meaning. Rename `greaterThan` to `greaterThanOrEqual`, and
  `lessThan` to `lessThanOrEqual`. Keep the value. This change is exact for every value,
  also for a value that is not an integer.
- The rule needs the strict meaning. Make no change. For example,
  `numImageFrames: { greaterThan: 0 }` now fails for a display set with 0 image frames, such
  as a whole slide or ECG display set. Before 3.14, `numImageFrames: { greaterThan:
  { value: 0 } }` matched these display sets.

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
- The rules `numImageFrames: { greaterThan: { value: 0 } }` change to
  `greaterThanOrEqual: { value: 0 }`. The match does not change: a display set with 0 image
  frames (whole slide, ECG) still matches, so the default protocol still shows a whole slide
  study. The rules are in the default protocol, `seriesSelectors`, `@ohif/hpCompare`,
  `@ohif/hpScale`, the dynamic volume protocol and the test protocol `hpTestSwitch`.

- The rules `numberOfDisplaySetsWithImages: { greaterThan: 0 }` (`studyWithImages`,
  `@ohif/hpScale`, and the test protocol `hpTestSwitch`) now run. Before 3.14 they always
  passed (see the next section). Now a study with 0 display sets with images no longer gets
  the weight of the `OneOrMoreSeries` rule.

## A falsy operand

Before 3.14, a constraint with the operand `0`, `false` or `''` never ran, because
`validate.js` skips a validator with a falsy operand. So `greaterThan: 0` and `equals: 0`
always passed, whatever the value. The operand `{ value: 0 }` did run. Now every operand
runs. Check each constraint with the operand `0`, `false` or `''` in your hanging protocols:
it now tests the value.

`notNull: false` now means "has no value". Before 3.14, it always passed.

## No value

`notNull` now reads an empty value as no value, as `@cornerstonejs/metadata` does. No value is
`undefined`, `null`, `''`, or an array whose elements all have no value (`[]`, `['']`,
`[null]`). So `notNull: true` now also fails on `''`, `[]` and an array of empty elements.
Before 3.14, it failed only on `null` and `undefined`. `0` and `false` are values.

The OHIF hanging protocols do not change. The only `notNull` rule, `prior`
`StudyInstanceUID` in `@ohif/hpCompare`, reads a UID or `undefined`.

## Numbers, numeric strings and booleans

`equals`, `doesNotEqual`, `includes` and `doesNotInclude` now read a numeric string as a
number when the other value is a number, as `@cornerstonejs/metadata` does. So
`equals: 1` holds for the value `'1'`, and `includes: [1, 2]` holds for `['2']`. An empty
string is not a number, so `''` does not equal `0`. Two strings still compare as text, so
`'1.0'` does not equal `'1'`.

A boolean now equals the number `1` or `0`, and the text `'true'` or `'false'`. So
`equals: true` holds for the value `1` and for `'true'`, and `equals: false` holds for `0`
and for `'false'`. A boolean does not equal any other value: `true` does not equal `'1'`.

The OHIF hanging protocols do not change. Each `equals: true` in them reads
`isDisplaySetFromUrl`, which is a boolean.

## `equals`, `doesNotEqual`, `includes` and `doesNotInclude`

`equals` and `doesNotEqual` now compare the whole value. A single test value is the same as
an array of one value. Before 3.14, a single test value was compared with the first element
of a multi-valued attribute only, against the documentation of `equals`.

`includes` and `doesNotInclude` now accept a single test value. Before 3.14, a single test
value always failed, with "must be an array".

| Constraint | Attribute value | 3.13 | 3.14 |
|---|---|---|---|
| `equals: 'ORIGINAL'` | `['ORIGINAL', 'PRIMARY']` | passes (first element) | fails |
| `equals: 'ORIGINAL'` | `['ORIGINAL']` or `'ORIGINAL'` | passes | passes |
| `doesNotEqual: 'ORIGINAL'` | `['ORIGINAL', 'PRIMARY']` | fails | passes |
| `includes: 'ORIGINAL'` | `['ORIGINAL', 'PRIMARY']` | fails ("must be an array") | passes |
| `doesNotInclude: 'LOCALIZER'` | `['ORIGINAL', 'PRIMARY']` | fails ("must be an array") | passes |

What to change: find each `equals` and `doesNotEqual` with a single test value on a
multi-valued attribute, for example `ImageType`. To test that the value holds the test
value, change `equals` to `includes`, and `doesNotEqual` to `doesNotInclude`:

```js
// 3.13: ImageType value 1 is ORIGINAL
constraint: { equals: 'ORIGINAL' }

// 3.14: ImageType holds ORIGINAL
constraint: { includes: 'ORIGINAL' }
```

The OHIF hanging protocols do not change. Each `equals` in them compares a single-valued
attribute, or uses an array with the full value (`PatientOrientation`).

## Other changes to the constraint list

- The `Constraint` type of `@ohif/core` (`Types.HangingProtocol.Constraint`) now lists all
  of the validators. The type had `notEquals`, which no validator implements. Use
  `doesNotEqual`. The `{ value }` form of a constraint now also accepts an array of strings or
  numbers.
- The operand wrappers `{ value }` and `{ attribute, from }` are for hanging protocols only.
  The `@cornerstonejs/metadata` split rules do not accept them yet.
