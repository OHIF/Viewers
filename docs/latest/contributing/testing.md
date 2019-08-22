# Contributing: Tests

> Testing is an opinionated topic. Here is a rough overview of our testing
> philosiphy. See something you want to discuss or think should be changed? Open
> a PR and let's discuss.

You're an engineer. You know how to write code, and writing tests isn't all that
different. But do you know why we write tests? Do you know when to write one, or
what kind of test to write? How do you know if a test is a _"good"_ test? This
document's goal is to give you the tools you need to make those determinations.

Okay. So why do we write tests? To increase our... :drum::

**CONFIDENCE**

> I want to be confident that the code I'm writing... won't break the app that I
> have running in production. So whatever I do, I want to make sure that the
> kinds of tests I write bring me the most confidence possible and I need to be
> cognizant of the trade-offs I'm making when testing. - Kent C. Dodds

## Kinds of Tests

Test's buy us confidence, but not all tests are created equal. Each kind of test
has a different cost to write and maintain. An expensive test is worth it if it
gives us confidance that a payment is processed, but it may not be the best
choice for asserting an element's border color.

| Test Type   | Example                                                                  | Speed            | Cost                                                                     |
| ----------- | ------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------ |
| Static      | `addNumbers(1, '2')` was called with a `string`, `int` was expected.     | :rocket: Instant | :money_with_wings:                                                       |
| Unit        | `addNumbers(1, 2)` returns expected result `3`                           | :airplane: Fast  | :money_with_wings::money_with_wings:                                     |
| Integration | Clicking "Sign In", navigates to the dashboard (mocked network requests) | :running: Okay   | :money_with_wings::money_with_wings::money_with_wings:                   |
| End-to-end  | Clicking "Sign In", navigates to the dashboard (no mocks)                | :turtle: Slow    | :money_with_wings::money_with_wings::money_with_wings::money_with_wings: |

### Static Code Analysis

Modern tooling gives us this "for free". It can catch invalid regular
expressions, unused variables, and guarantee we're calling methods/functions
with the expected paramater types.

Example Tooling:

- [ESLint][eslint-rules]
- [TypeScript][typescript-docs] or [Flow][flow-org]

Where it falls short: Can't test business logic.

### Unit Tests

...

#### When should we unit test?

Follow the top level exports. Anything that is exposed as public API should have
unit tests. These are th

#### When should we avoid unit tests?

You're testing implementation details if:

- Your test does something that the consumer of your code would never do.
  - IE. Using a private function
- A refactor can break your tests

Where it falls short: That you're calling a dependency appropriately.

### Integration Tests

Integration tests take things one step further. You

Where it falls short: That you're passing the right data to your backend.

### End-to-End Tests

These are the most expensive tests to write and maintain. Largely because, when
they fail, they have the largest number of potential points of failure. So why
do we write them? Because they also buy us the most confidance.

We should reserve end-to-end tests for mission critical features. A good example
is testing user authentication. If a user can't sign in to your application,
it's an emergency. Having a high degree of confidance that users can always
authenticate is very valuable.

Where it falls short:

#### When should we test?

Mission critical features and functionality, or to cover a large breadth of
functionality until unit tests catch up. Unsure if we should have a test for
feature `X` or scenario `Y`? Open an issue and let's discuss.

## Further Reading

Okay, so hopefully you have more confidance in your understanding of _why_ we
test, and the trade-offs we weigh when determining what kind of test should be
written. For the _how_, check out some of the links below, or read some of the
existing tests in this repository.

### General

- [Assert(js) Conf 2018 Talks][assert-js-talks]
  - [Write tests. Not too many. Mostly integration.][kent-talk] - Kent C. Dodds
  - [I see your point, but…][gleb-talk] - Gleb Bahmutov
- [Static vs Unit vs Integration vs E2E Testing][kent-blog] - Kent C. Dodds
  (Blog)

### End-to-end Testing w/ Cypress

- [Getting Started](https://docs.cypress.io/guides/overview/why-cypress.html)
  - Be sure to check out `Getting Started` and `Core Concepts`
- [Best Practices](https://docs.cypress.io/guides/references/best-practices.html)
- [Example Recipes](https://docs.cypress.io/examples/examples/recipes.html)

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[eslint-rules]: https://eslint.org/docs/rules/
[typescript-docs]: https://www.typescriptlang.org/docs/home.html
[flow-org]: https://flow.org/
<!-- Talks -->
[assert-js-talks]: https://www.youtube.com/playlist?list=PLZ66c9_z3umNSrKSb5cmpxdXZcIPNvKGw
[kent-talk]: https://www.youtube.com/watch?list=PLV5CVI1eNcJgNqzNwcs4UKrlJdhfDjshf
[gleb-talk]: https://www.youtube.com/watch?v=5FnalKRjpZk
[kent-blog]: https://kentcdodds.com/blog/unit-vs-integration-vs-e2e-tests
<!-- Images -->
[testing-trophy]: https://twitter.com/kentcdodds/status/960723172591992832?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E960723172591992832&ref_url=https%3A%2F%2Fkentcdodds.com%2Fblog%2Fwrite-tests
[aaron-square]: https://twitter.com/Carofine247/status/966727489274961920
[gleb-pyramid]: https://twitter.com/Carofine247/status/966764532046684160/photo/3
[testing-pyramid]: https://dojo.ministryoftesting.com/dojo/lessons/the-mobile-test-pyramid
[testing-dorito]: https://twitter.com/denvercoder/status/960752578198843392
<!-- prettier-ignore-end -->
