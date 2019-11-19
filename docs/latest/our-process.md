# Our Process

Our process is a living, breathing thing. We strive to have regular [retrospectives][retrospective] that help us
shape and adapt our process to our team's current needs. This document attempts to capture the broad strokes of
that process in an effort to:

- Strengthen community member involvement and understanding
- Welcome feedback and helpful suggestions


## Overview

- [Issue Triage](#issue-triage)
- [Issue Curation ("backlog grooming")](#issue-curation-backlog-grooming)
- [Contributions (Pull Requests)](#contributions-pull-requests)
- [Releases](#releases)


_Include issue lifecycle diagram_

## Issue Triage

[GitHub issues][gh-issues] are the best way to provide feedback, ask questions, and suggest changes to the OHIF Viewer's core
team. Community issues generally fall into one of three categories, and are marked with a `triage` label when created.


|Issue Template Name     | Description                                                                             |
|------------------------|-----------------------------------------------------------------------------------------|
|Community: Report 🐛  | Describe a new issue; Provide steps to reproduce; Expected versus actual result?         |
|Community: Request ✋  | Describe a proposed new feature. Why should it be implemented? What is the impact/value? |
|Community: Question ❓ | Seek clarification or assistance relevant to the repository.                             | 

_table 1. issue template names and descriptions_

Issues that require `triage` are akin to support tickets. As this is often our first contact with would-be adopters and
contributors, it's important that we strive for timely responses and satisfactory resolutions. We attempt to accomplish this
by:

1. Responding to issues requiring `triage` at least once a week
2. Create new "official issues" from "community issues"
3. Provide clear guidance and next steps (when applicable)
4. Regularly clean up old (stale) issues

> :pencil: Less obviously, patterns in the issues being reported can highlight areas that need improvement. For example, users often have
difficulty navigating CORS issues when deploying the OHIF Viewer -- how do we best reduce our ticket volume for this issue?

### Backlogged Issues

Community issues serve as vehicles of discussion that lead us to "backlogged issues". Backlogged issues are the distilled and actionable information extracted from community issues. They contain the scope and requirements necessary for hand-off to a core-team (or community) contributor ^_^

|Category| Description| Labels|
|--------|-----| ---------|
| Bugs   | An issue with steps that produce a bug (an unexpected result). | [Bug: Verified 🐛][label-bug] |
| Stories| A feature/enhancement with a clear benefit, boundaries, and requirements. | [Story 🙌][label-story] |
| Tasks  | Changes that improve [UX], [DX], or test coverage; but don't impact application behavior | [Task: CI/Tooling 🤖][label-tooling], [Task: Docs 📖][label-docs], [Task: Refactor 🛠][label-refactor], [Task: Tests 🔬][label-tests] |

_table 2. backlogged issue types ([full list of labels][gh-labels])_


## Issue Curation (["backlog grooming"][groom-backlog])

...

## Contributions (Pull Requests)

..

## Releases

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[groom-backlog]: https://www.agilealliance.org/glossary/backlog-grooming
[retrospective]: https://www.atlassian.com/team-playbook/plays/retrospective
[gh-issues]: https://github.com/OHIF/Viewers/issues/new/choose
[gh-labels]: https://github.com/OHIF/Viewers/labels
[label-story]: https://github.com/OHIF/Viewers/labels/Story%20%3Araised_hands%3A
[label-tooling]: https://github.com/OHIF/Viewers/labels/Task%3A%20CI%2FTooling%20%3Arobot%3A
[label-docs]: https://github.com/OHIF/Viewers/labels/Task%3A%20Docs%20%3Abook%3A
[label-refactor]: https://github.com/OHIF/Viewers/labels/Task%3A%20Refactor%20%3Ahammer_and_wrench%3A
[label-tests]: https://github.com/OHIF/Viewers/labels/Task%3A%20Tests%20%3Amicroscope%3A
[label-bug]: https://github.com/OHIF/Viewers/labels/Bug%3A%20Verified%20%3Abug%3A
<!-- prettier-ignore-end -->
