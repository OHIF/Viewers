# Contributing: Tests

> Testing is an opinionated topic. Here is a rough overview of our testing
> philosiphy. See something you want to discuss or think should be changed? Open
> a PR and let's discuss.

Why do we write tests?

- Increase confidance

## Kinds of Tests

Test's buy us confidence, but not all tests are created equal. Each kind of test
has a different cost to write and maintain. More costly tests

| Test Type   | Example                                                              | Speed            | Cost                                                                     |
| ----------- | -------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| Static      | `addNumbers(1, '2')` was called with a `string`, `int` was expected. | :rocket: Instant | :money_with_wings:                                                       |
| Unit        | `addNumbers(1, 2)` returns expected result `3`                       | :airplane: Fast  | :money_with_wings::money_with_wings:                                     |
| Integration |                                                                      | :running: Okay   | :money_with_wings::money_with_wings::money_with_wings:                   |
| End-to-end  | When I click "Sign In", the page navigates to the dashboard.         | :turtle: Slow    | :money_with_wings::money_with_wings::money_with_wings::money_with_wings: |

### Static Code Analysis

Modern tooling gives us this "for free". It can catch invalid regular
expressions, unused variables, and guarantee we're calling methods/functions
with the expected paramater types.

Example Tooling:

- [ESLint][eslint-rules]
- [TypeScript][typescript-docs] or Flow

Static code analysis can't test business logic.

### Unit Tests

...

#### What should be unit tested?

Follow the top level exports. Anything that is exposed as public API should have
unit tests. These are th

#### What should NOT be unit tested?

You're testing implementation details if:

- Your test does something that the consumer of your code would never do.
  - IE. Using a private function
- A refactor can break your tests

### Integration Tests

...

### End-to-End Tests

...

## Further Reading

- [Assert(js) Conf 2018 Talks][assert-js-talks]
  - [Write tests. Not too many. Mostly integration.][kent-talk] - Kent C. Dodds
  - [I see your point, but…][gleb-talk] - Gleb Bahmutov

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[eslint-rules]: https://eslint.org/docs/rules/
[typescript-docs]: https://www.typescriptlang.org/docs/home.html
<!-- Talks -->
[assert-js-talks]: https://www.youtube.com/playlist?list=PLZ66c9_z3umNSrKSb5cmpxdXZcIPNvKGw
[kent-talk]: https://www.youtube.com/watch?list=PLV5CVI1eNcJgNqzNwcs4UKrlJdhfDjshf
[gleb-talk]: https://www.youtube.com/watch?v=5FnalKRjpZk
<!-- Images -->
[testing-trophy]: https://twitter.com/kentcdodds/status/960723172591992832?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E960723172591992832&ref_url=https%3A%2F%2Fkentcdodds.com%2Fblog%2Fwrite-tests
[aaron-square]: https://twitter.com/Carofine247/status/966727489274961920
[gleb-pyramid]: https://twitter.com/Carofine247/status/966764532046684160/photo/3
[testing-pyramid]: https://dojo.ministryoftesting.com/dojo/lessons/the-mobile-test-pyramid
[testing-dorito]: https://twitter.com/denvercoder/status/960752578198843392
<!-- prettier-ignore-end -->
