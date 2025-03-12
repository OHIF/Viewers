---
sidebar_position: 6
sidebar_label: Issue & PR Triage Process
---

# Our Process

Our process is a living, breathing thing. We strive to have regular
[retrospectives][retrospective] that help us shape and adapt our process to our
team's current needs. This document attempts to capture the broad strokes of
that process in an effort to:

- Strengthen community member involvement and understanding
- Welcome feedback and helpful suggestions

## Issue Triage

[GitHub issues][gh-issues] are the best way to provide feedback, ask questions,
and suggest changes to the OHIF Viewer's core team. Community issues generally
fall into one of three categories, and are marked with a `triage` label when
created.

| Issue Template Name    | Description                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Community: Report 🐛   | Describe a new issue; Provide steps to reproduce; Expected versus actual result?         |
| Community: Request ✋  | Describe a proposed new feature. Why should it be implemented? What is the impact/value? |
| Community: Question ❓ | Seek clarification or assistance relevant to the repository.                             |

_table 1. issue template names and descriptions_

Issues that require `triage` are akin to support tickets. As this is often our
first contact with would-be adopters and contributors, it's important that we
strive for timely responses and satisfactory resolutions. We attempt to
accomplish this by:

1. Responding to issue requiring `triage` at least once a week
2. Create new "official issues" from "community issues"
3. Provide clear guidance and next steps (when applicable)
4. Regularly clean up old (stale) issues

> 🖋 Less obviously, patterns in the issues being reported can highlight areas
> that need improvement. For example, users often have difficulty navigating
> CORS issues when deploying the OHIF Viewer -- how do we best reduce our ticket
> volume for this issue?

### Backlogged Issues

Community issues serve as vehicles of discussion that lead us to "backlogged
issues". Backlogged issues are the distilled and actionable information
extracted from community issues. They contain the scope and requirements
necessary for hand-off to a core-team (or community) contributor ^\_^

| Category | Description                                                                              | Labels                                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Bugs     | An issue with steps that produce a bug (an unexpected result).                           | [Bug: Verified 🐛][label-bug]                                                                                                        |
| Stories  | A feature/enhancement with a clear benefit, boundaries, and requirements.                | [Story 🙌][label-story]                                                                                                              |
| Tasks    | Changes that improve [UX], [DX], or test coverage; but don't impact application behavior | [Task: CI/Tooling 🤖][label-tooling], [Task: Docs 📖][label-docs], [Task: Refactor 🛠][label-refactor], [Task: Tests 🔬][label-tests] |

_table 2. backlogged issue types ([full list of labels][gh-labels])_

## Issue Curation (["backlog grooming"][groom-backlog])

If a [GitHub issue][gh-issues] has a `bug`, `story`, or `task` label; it's on
our backlog. If an issue is on our backlog, it means we are, at the very least,
committed to reviewing any community drafted Pull Requests to complete the
issue. If you're interested in seeing an issue completed but don't know where to
start, please don't hesitate to leave a comment!

While we don't yet have a long-term or quarterly road map, we do regularly add
items to our ["Active Development" GitHub Project Board][gh-board]. Items on
this project board are either in active development by Core Team members, or
queued up for development as in-progress items are completed.

> 🖋 Want to contribute but not sure where to start? Check out [Up for
> grabs][label-grabs] issues and our [Contributing
> documentation][contributing-docs]

## Contributions (Pull Requests)

Incoming Pull Requests (PRs) are triaged using the following labels. Code review
is performed on all PRs where the bug fix or added functionality is deemed
appropriate:

| Labels                                         | Description                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Classification**                             |                                                                                                             |
| [PR: Bug Fix][label-bug]                       | Filed to address a Bug.                                                                                     |
| [PR: Draft][draft]                             | Filed to gather early feedback from the core team, but which is not intended for merging in the short term. |
| **Review Workflow**                            |                                                                                                             |
| [PR: Awaiting Response 💬][awaiting-response]  | The core team is waiting for additional information from the author.                                        |
| [PR: Awaiting Review 👀][awaiting-review]      | The core team has not yet performed a code review.                                                          |
| [PR: Awaiting Revisions 🖊][awaiting-revisions] | Following code review, this label is applied until the author has made sufficient changes.                  |
| **QA**                                         |                                                                                                             |
| [PR: Awaiting User Cases 💃][awaiting-stories] | The PR code changes need common language descriptions of impact to end users before the review can start    |
| [PR: No UX Impact 🙃][no-ux-impact]            | The PR code changes do not impact the user's experience                                                     |

We rely on GitHub Checks and integrations with third party services to evaluate
changes in code quality and test coverage. Tests must pass and User cases must
be present (when applicable) before a PR can be merged to master, and code
quality and test coverage must not be changed by a significant margin. For some
repositories, visual screenshot-based tests are also included, and video
recordings of end-to-end tests are stored for later review.

[You can read more about our continuous integration efforts here](/development/continuous-integration.md)

## Releases

Releases are made automatically based on the type of commits which have been
merged (major.minor.patch). Releases are automatically pushed to NPM. Release
notes are automatically generated. Users can subscribe to GitHub and NPM
releases.

We host development, staging, and production environments for the Progressive
Web Application version of the OHIF Viewer. [Development][ohif-dev] always
reflects the latest changes on our master branch. [Staging][ohif-stage] is used
to regression test a release before a bi-weekly deploy to our [Production
environment][ohif-prod].

Important announcements are made on GitHub, tagged as Announcement, and pinned
so that they remain at the top of the Issue page.

The Core team occasionally performs full manual testing to begin the process of
releasing a Stable version. Once testing is complete, the known issues are
addressed and a Stable version is released.

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[groom-backlog]: https://www.agilealliance.org/glossary/backlog-grooming
[retrospective]: https://www.atlassian.com/team-playbook/plays/retrospective
[gh-issues]: https://github.com/OHIF/Viewers/issues/new/choose
[gh-labels]: https://github.com/OHIF/Viewers/labels
<!-- Issue Labels -->
[label-story]: https://github.com/OHIF/Viewers/labels/Story%20%3Araised_hands%3A
[label-tooling]: https://github.com/OHIF/Viewers/labels/Task%3A%20CI%2FTooling%20%3Arobot%3A
[label-docs]: https://github.com/OHIF/Viewers/labels/Task%3A%20Docs%20%3Abook%3A
[label-refactor]: https://github.com/OHIF/Viewers/labels/Task%3A%20Refactor%20%3Ahammer_and_wrench%3A
[label-tests]: https://github.com/OHIF/Viewers/labels/Task%3A%20Tests%20%3Amicroscope%3A
[label-bug]: https://github.com/OHIF/Viewers/labels/Bug%3A%20Verified%20%3Abug%3A
<!-- PR Labels -->
[draft]: https://github.com/OHIF/Viewers/labels/PR%3A%20Draft
[awaiting-response]: https://github.com/OHIF/Viewers/labels/PR%3A%20Awaiting%20Response%20%3Aspeech_balloon%3A
[awaiting-review]: https://github.com/OHIF/Viewers/labels/PR%3A%20Awaiting%20Review%20%3Aeyes%3A
[awaiting-stories]: https://github.com/OHIF/Viewers/labels/PR%3A%20Awaiting%20UX%20Stories%20%3Adancer%3A
[awaiting-revisions]: https://github.com/OHIF/Viewers/labels/PR%3A%20Awaiting%20Revisions%20%3Apen%3A
[no-ux-impact]: https://github.com/OHIF/Viewers/labels/PR%3A%20No%20UX%20Impact%20%3Aupside_down_face%3A
<!-- -->
[ohif-dev]: https://viewer-dev.ohif.org
[ohif-stage]: https://viewer-stage.ohif.org
[ohif-prod]: https://viewer.ohif.org
[gh-board]: https://github.com/OHIF/Viewers/projects/4
[label-grabs]: https://github.com/OHIF/Viewers/issues?q=is%3Aissue+is%3Aopen+label%3A%22Up+For+Grabs+%3Araising_hand_woman%3A%22
[contributing-docs]: ./development/contributing.md
<!-- prettier-ignore-end -->
