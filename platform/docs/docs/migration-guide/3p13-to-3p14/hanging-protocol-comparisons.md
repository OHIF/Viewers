---
sidebar_position: 12
sidebar_label: Hanging protocol comparisons
title: Hanging protocol comparisons
---

# Hanging protocol comparisons

3.14 gives the hanging protocol constraints the meaning of the display set split rule
operators of the same names, where the two can agree today. "Known differences from
`@cornerstonejs/metadata`" lists the differences that remain. On this page,
`@cornerstonejs/metadata` means the split rule operators of
[cornerstonejs/cornerstone3D#2861](https://github.com/cornerstonejs/cornerstone3D/pull/2861),
which are not released yet.

The `greaterThan` and `lessThan` constraints of a hanging protocol are now strict. Before
3.14, `greaterThan` tested `>=` and `lessThan` tested `<=`, and the hanging protocol
documentation said so ("value is >= to rule"). 3.14 changes this documented meaning on
purpose, so that one name has one meaning in hanging protocols and in split rules.

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
  `lessThan` to `lessThanOrEqual`. Keep the value. This change is exact for every finite number
  value, also for a value that is not an integer. For a text value, an array value or no
  value, the result can change; see "Number values".
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

These rules change, and keep their match for a number value (for a numeric string, see
below):

- `@ohif/hpMammo`: `numberOfDisplaySetsWithImages` changes from `greaterThan: 2` to
  `greaterThanOrEqual: 2`.
- `@ohif/frameView`: `numImageFrames` changes from `greaterThan: { value: 16 }` to
  `greaterThanOrEqual: { value: 16 }`.
- The rules `numImageFrames: { greaterThan: { value: 0 } }` change to
  `greaterThanOrEqual: { value: 0 }`. A display set with 0 image frames (whole slide, ECG)
  still matches, so the default protocol still shows a whole slide study. The rules are in
  the default protocol, `seriesSelectors`, `@ohif/hpCompare`, `@ohif/hpScale`, the dynamic
  volume protocol and the test protocol `hpTestSwitch`.

These matches change:

- The `OneOrMoreSeries` rule `numberOfDisplaySetsWithImages: { greaterThan: 0 }` now runs
  (see "A falsy operand"). It is in the rule list `studyWithImages` of `@ohif/mnGrid` and
  `@ohif/mnGrid8`, and in `@ohif/hpScale` and the test protocol `hpTestSwitch`. Before 3.14 it
  always passed. Now a study with 0 display sets with images no longer gets its weight. The
  OHIF modes show no change: the segmentation mode lists only `@ohif/mnGrid`, and when no
  protocol scores, the protocol engine uses the `default` protocol when the mode lists it,
  else the first protocol of the mode.
- `@ohif/hpMammo` has the `required` rule `PatientOrientation: { doesNotContain: ['P', 'FL'] }`.
  A display set has no `PatientOrientation`, so the rule reads it from the first instance.
  Before 3.14, the rule failed with an error when the instance had no `PatientOrientation`
  (absent or `null`), so the display set did not match. Now the rule holds on no value (see
  "Text values"). So a mammography display set with no `PatientOrientation` can now fill that
  viewport, when its other required rules hold.
- A numeric string `numImageFrames` now matches the number rules. The stack SOP class
  handler copies `NumberOfFrames` of a multi-frame instance as it is, and a data source can
  give it as text. Before 3.14, `greaterThan` failed on a string, so such a display set did
  not match `@ohif/frameView` or the `numImageFrames` selectors. Now `'30'` reads as 30.

These rules change their result only for a display set that the stack SOP class handler does
not make, because that handler sets `SeriesDescription` to `''` when the instance has none:

- `@ohif/hpMammo` `SeriesDescription: { doesNotContain: 'CC' }` (`required`), and the PT rule
  `SeriesDescription: { doesNotContain: { value: 'Uncorrected' } }` (weight 2) of the TMTV
  protocol and the dynamic volume protocol. On `''`, these rules held before 3.14 too. On a
  display set with no `SeriesDescription` attribute (`undefined` or `null`), they failed
  with an error before 3.14, and now hold. In TMTV, such a PT display set now scores 4 (the
  same as a PT whose description does not name the correction, and as a stack PT display set
  with no description); before, it scored 2.

## Number values

`greaterThan`, `greaterThanOrEqual`, `lessThan` and `lessThanOrEqual` now read the value as
`@cornerstonejs/metadata` does:

- A numeric string reads as a number: `'5'` is 5. Before 3.14, `greaterThan` failed on a
  string value, and `lessThan` let JavaScript convert it, so `' '` read as 0 and passed
  `lessThan: 5`. Now `' '` has no number and fails.
- An array reads as its first element: `[5]` is 5. Before 3.14, `greaterThan` failed on an
  array value, and `lessThan` let JavaScript convert it, so `['5', '9']` failed
  `lessThan: 6` and now passes.
- A value with no number fails: `null`, `undefined`, `''`, `true`. Before 3.14, JavaScript
  compared `null` and `true` as numbers, so `lessThan: 10` passed on `null`, and
  `greaterThan: { value: 0 }` passed on `null` (`null >= 0`) and on `true`. A `null` value
  comes from an empty instance attribute (dcmjs gives an empty Type 2 element as `null`) or
  from a custom attribute callback. A missing attribute is `undefined`, which failed before
  too. `Infinity` is not a finite number, so it fails now too.

The test value reads in the same way: `'4'` and `['4']` are 4. A test value with no number
fails: `''`, `[]`, `null`, `'a'`. Before 3.14, `greaterThan: []` passed on every number value.
`@cornerstonejs/metadata` accepts a finite number only, so `greaterThan: '4'` is an error
there.

`range` reads the value and its two bounds in the same way. So `range: [1, 10]` now holds
for `'5'` and for `[5, 60]` (the first element is 5), and fails for `[50, 60]`, `null` and
`''`. Before 3.14, `range` compared an array value as it was, so `[50, 60]` passed. The
bounds must be two numbers, or two numeric strings, so `range: [[1], 10]` now fails.

The test values of the OHIF hanging protocols are numbers, and no OHIF hanging protocol uses
`range`. Their values are numbers, except the numeric string `numImageFrames` in "The OHIF
hanging protocols".

## A falsy operand

Before 3.14, a constraint with the operand `0`, `false` or `''` never ran, because
`validate.js` skips a validator with a falsy operand. So `greaterThan: 0` and `equals: 0`
always passed, whatever the value. The operand `{ value: 0 }` did run. Now the operand `0`,
`false` or `''` runs for every OHIF validator. Check each such constraint in your hanging
protocols: it now tests the value.

- An operand `null`, `undefined` or `NaN` skips the validator, and the rule passes. Before
  3.14, an operand `null` made `HPMatcher` throw "Cannot convert undefined or null to object".
- The OHIF validators are `equals`, `doesNotEqual`, `includes`, `doesNotInclude`, `contains`,
  `containsI`, `containsAll`, `doesNotContain`, `doesNotContainI`, `startsWith`, `endsWith`,
  `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `range` and `notNull`.
  A `validate.js` built-in validator keeps its meaning: `presence: false` turns it off. A
  validator that your application adds to `validate.validators` also keeps the `validate.js`
  meaning.
- A text validator reads a number or a boolean operand as text: `startsWith: 0` tests for
  `'0'`, and `doesNotContain: 0` holds for `'abc'` (see "Text values"). Before 3.14, the bare
  operand `0` skipped the rule, so it passed. The operand `{ value: 0 }` failed with an
  error (`startsWith`) or always failed (`doesNotContain`).
- An operand `''` runs the text validators too. Every text contains `''`, so
  `doesNotContain: ''` and `doesNotContainI: ''` now fail on every value that has a text.
  `contains: ''`, `startsWith: ''`, `endsWith: ''` and `equals: ''` now fail on a missing
  value, and `containsAll: ''` fails with "must be an array". Before 3.14, all of these
  always passed.
- No OHIF hanging protocol uses the operand `0`, `false` or `''` with a text validator.

An `{ attribute, from }` operand that gives no value now reaches the validator as
`undefined`. Before 3.14, the validator got the wrapper object. So
`equals: { attribute: 'X' }` now holds when the value and `X` are both missing, and
`doesNotEqual` fails. Two different kinds of no value are not equal: the value `''` or `[]`
with `X` missing fails `equals`. A text validator gets no text from such an operand, so
`contains` fails.

`HPMatcher` reads an attribute of the display set, and, when the display set has no value
(`undefined` or `null`), the attribute of its first instance. So a `null` instance attribute
reaches the validator as `null`, and `equals: { value: null }` holds on it. A missing
attribute is `undefined`, and `equals: { value: null }` does not hold on it. Use
`notNull: false` to test for no value of any kind.

`notNull: false` now means "has no value". Before 3.14, it always passed.

## Text values

`contains`, `containsI`, `doesNotContain`, `doesNotContainI`, `startsWith` and `endsWith`
now read the value as `@cornerstonejs/metadata` does:

- Each element of the value that has a value reads as text: `5` is `'5'`, and `[null,
  'R MLO']` is `['R MLO']`. Before 3.14, a number value failed `startsWith` with "Value must
  be a string or an array", and passed `contains` (a number has no `indexOf`).
- A value with no value gives no text. So `contains`, `containsI`, `startsWith` and
  `endsWith` fail, and `doesNotContain` and `doesNotContainI` hold. Before 3.14, on a
  missing value, `contains`, `containsI`, `doesNotContain` and `doesNotContainI` failed
  with an error ("Something went wrong during validation"), and `startsWith` and `endsWith`
  failed with "must be a string or an array".
- An object reads as the text `'[object Object]'`. So on a person name object
  (`PatientName` as `{ Alphabetic }`), `contains` and `containsI` now fail, and
  `doesNotContain` and `doesNotContainI` now hold. Before 3.14, an object has no `indexOf`,
  so `contains` and `containsI` passed, and `doesNotContain` and `doesNotContainI` failed.
  Read a text field, for example a custom attribute that gives the name as text.
- The test value reads as text too (see "A falsy operand"). A `null` or `undefined` test
  value gives no text. `@cornerstonejs/metadata` accepts a string operand only, so
  `startsWith: 0` is an error there.

The rule holds when one text of the value passes the test with one test value, as before.
The `@ohif/hpMammo` and TMTV results are in "The OHIF hanging protocols".

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

The OHIF hanging protocols do not change. Each `equals: true` and `equals: { value: true }`
in them reads `isDisplaySetFromUrl` or `isReconstructable`, which are booleans.

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

## Known differences from `@cornerstonejs/metadata`

The hanging protocol constraints and the split rule operators of the same names still differ
here:

- `equals: null` means "has no value" in `@cornerstonejs/metadata`. In a hanging protocol,
  the operand `null` skips the constraint, and the rule passes. Use `notNull: false`.
- A boolean equals `1` or `0` here. `@cornerstonejs/metadata` gives `true` equal to `'true'`
  only; the same meaning as here is planned for cornerstonejs/cornerstone3D#2861.
- `greaterThanOrEqual` and `lessThanOrEqual` are not split rule operators yet.
- `@cornerstonejs/metadata` rejects an operand of the wrong kind: a number operand of a text
  operator (`startsWith: 0`), a text operand of a number operator (`greaterThan: '4'`), and
  an array operand of `equals` and `doesNotEqual`. The hanging protocol constraints read such
  an operand as text or as a number, and compare an array operand with the whole value.
- `includes: ''` holds on the value `''` here, and an `includes` operand that gives no value
  holds on a missing value. The split rule `includes` fails on no value.
- `equals: ''` holds on the value `['']` here. The split rules keep an empty text and an empty
  array apart.
- An empty array operand: `contains: []` always fails and `doesNotContain: []` always holds
  here. The split rules reject an empty array operand.
- A number operator accepts an array of one number as the operand here
  (`greaterThan: [16]`). The split rules accept a finite number only.
- `containsAll` needs an array value and an array operand here (`['a']` with
  `containsAll: 'a'` fails with "must be an array"), and it compares with `===`, so
  `['1', 'b']` with `containsAll: [1]` fails. `@cornerstonejs/metadata` accepts a single
  operand, and compares a number and a numeric string by value.
- `notNull` reads any operand other than `false` as `true`. `@cornerstonejs/metadata`
  accepts a boolean only.
- The operand wrappers `{ value }` and `{ attribute, from }` are for hanging protocols only.

## Other changes to the constraint list

- The `Constraint` type of `@ohif/core` (`Types.HangingProtocol.Constraint`) now lists all
  of the validators. The type had `notEquals`, which no validator implements. Use
  `doesNotEqual`. The `{ value }` form of a constraint now also accepts an array of strings or
  numbers, and `notNull` accepts `{ value: boolean }`.
- The error messages of the validators changed. They show the test value as JSON, for
  example `must equal ""` and `must include one of []`. `HPMatcher` gives them in the match
  details only. Do not test for the old text.
