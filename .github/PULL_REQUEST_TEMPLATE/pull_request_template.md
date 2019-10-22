### Request Checklist

- [] Brief description of changes
- [] Links to any relevant issues
- [] Required status checks are passing
- [] `@mention` a maintainer to request a review

#### Special

> If this PR is not on a branch for this repo, it is "untrusted" and does not
> have access to env vars. Reviewers can kick off a trusted docker deploy by:
>
> 1. Verifying there are no malicious changes to CI build
> 2. Using the [git-push-fork-to-upstream-branch][script] script
> 3. Executing the manual approval step in the CI workflow

- [] Request docker publish of PR

_Want to improve this process? Consider PR'ing the ability for reviewers to add
a label to trigger this process._

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[blog]: https://circleci.com/blog/triggering-trusted-ci-jobs-on-untrusted-forks/
[script]: https://github.com/jklukas/git-push-fork-to-upstream-branch
<!-- prettier-ignore-end -->
