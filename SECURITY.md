# Security Policy

The OHIF team takes security seriously. If you believe you have found a security vulnerability in the OHIF Viewer, we would like to hear from you. This page explains which versions we support, how to report a vulnerability privately, and what to expect from us.

## Supported versions

Security fixes are provided for the following versions of the OHIF Viewer and the `@ohif/*` npm packages built from this repository.

| Version | Security fixes | Notes |
| --- | --- | --- |
| Latest stable release line (e.g. 3.13.x) | Yes | Fixes are released as a new patch version (3.13.N). |
| Current beta on `master` (e.g. 3.14.0-beta) | Yes | Fixes land in the next beta build. |
| Previous stable release line (e.g. 3.12.x) | Best effort | We may provide a fix when it is practical to do so, but we make no commitment. Please plan to upgrade. |
| Older versions | No | Please upgrade to a supported version. |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, pull requests, discussions, the community forum, or Slack.**

Instead, use GitHub's private vulnerability reporting for this repository:

1. Go to the Security tab of the OHIF/Viewers repository.
2. Click **Report a vulnerability**.
3. Fill in the form. GitHub notifies the OHIF security team privately. You will need a GitHub account.

Direct link: https://github.com/OHIF/Viewers/security/advisories/new

If you cannot use GitHub (for example you have no GitHub account), email **contact@ohif.org** instead, with "Security" in the subject line. Please don't send exploit code to any other address, and don't post it publicly.

To help us act quickly, please include:

- The OHIF version(s) you tested and how OHIF was deployed: for example the public demo, a Docker image, or a build from source; whether authentication was enabled and of which kind (for example OpenID Connect); whether it was served over HTTPS; and which configuration you tested. Note that the public demo runs an intentionally open configuration with every feature enabled; a default build does not.
- Step-by-step instructions to reproduce the issue, ideally with a proof of concept (for example a crafted DICOM file or URL).
- What an attacker could achieve (the impact).
- Your view of the severity and why, if you have one (a CVSS score is one way to give this).
- A suggested fix, if you have one.
- How you would like to be credited, or whether you prefer not to be named.

## What to expect

- **Acknowledgement within 5 business days.** A member of the security team will reply to confirm we have received your report, inside the private advisory or by email if that is how you reported.
- **Assessment.** We will tell you whether we consider the report a security vulnerability in OHIF, and we may ask questions. All discussion stays private, in the advisory or over email.
- **Coordinated disclosure.** Once a fix has been released, we publish a GitHub security advisory with a CVE identifier. We ask that you do not disclose the vulnerability publicly before then. We do not commit to a fixed disclosure deadline, but we will keep you informed of progress.
- **Credit.** We credit reporters in the published advisory and the CVE record, unless you tell us you prefer not to be named.
- **No bug bounty.** OHIF is an open-source project and does not offer payment for vulnerability reports.

## Scope

**In scope:** the OHIF Viewer source code in this repository and the `@ohif/*` npm packages built from it. A problem you first noticed in your own deployment is in scope if it points to something that can be hardened in OHIF's code; if so, please describe both the symptoms you saw and the general improvement you have in mind. Problems in the cornerstone3D or dcmjs libraries that you can trigger through the OHIF Viewer are also in scope; report them here and we will route them. A problem in those libraries that OHIF does not expose is outside this policy.

**Out of scope** (please report these elsewhere, or expect them to be closed):

- **Third-party dependencies.** Vulnerabilities in packages that OHIF uses should be reported to that package's maintainers. OHIF updates dependencies as fixes become available.
- **Deployments and infrastructure.** How a particular organisation configures, hosts, or secures its own OHIF instance (TLS, authentication, CORS, the PACS behind it) is that organisation's responsibility, and we cannot help with issues that exist only in one deployment. The public demo at viewer.ohif.org exists for demonstration only and is not a production deployment.
- **Unsupported versions.** Reports that only affect versions outside the supported-versions table above.
- **Scanner output without demonstrated impact.** Raw output from automated tools (for example `npm audit` or code scanners) without a proof of concept showing a real effect on OHIF.
