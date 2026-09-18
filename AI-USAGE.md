# AI-USAGE.md

> Keep this file factual. Update it during the implementation, not only at the end.

## Tools used

- Claude Code — implementation assistance inside the repository.
- ChatGPT — initial task analysis, architecture planning, protocol design, and review assistance.

## How AI was used

### Planning

AI was used to:

- extract requirements from the supplied test-task PDF;
- compare repository strategies;
- design the `postMessage` contract;
- identify async/correlation risks;
- prepare a PR-by-PR implementation plan;
- identify OHIF APIs that must be verified against the actual checkout.

### Implementation

For every AI-assisted code change, record:

- PR/feature;
- what the prompt asked AI to do;
- which parts were accepted;
- which parts were changed manually;
- why they were changed;
- how the result was verified.

Suggested log:

| PR | AI assistance | Kept | Reworked | Verification |
|---|---|---|---|---|
| PR 1 | TBD | TBD | TBD | TBD |
| PR 2 | TBD | TBD | TBD | TBD |
| PR 3 | TBD | TBD | TBD | TBD |
| PR 4 | TBD | TBD | TBD | TBD |
| PR 5 | TBD | TBD | TBD | TBD |

## Verification policy

AI output is not treated as authoritative for OHIF internals.

Before accepting AI-generated OHIF integration code, the implementation is checked against:

- the actual forked OHIF source;
- the actual selected OHIF version;
- browser behavior with a real study;
- actual `measurementService` event payloads.

## Examples of expected human review

Document concrete examples here during development, for example:

- AI initially assumed an area field was top-level, but the actual OHIF measurement stored it in cached stats, so the adapter was rewritten.
- AI suggested using wildcard `postMessage` target origin; this was rejected and replaced with an exact configured origin.
- AI suggested a generic queue; activation semantics were refined to guarantee only one active drawing intent.

Only keep examples that actually occurred.

## Responsibility

All submitted code is reviewed and understood by the author.

The author must be able to:

- explain the message protocol;
- explain correlation IDs;
- explain handshake/queue behavior;
- explain cleanup;
- change the tool live;
- add a measurement field through the whole chain;
- diagnose a broken handshake.
