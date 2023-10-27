---
sidebar_position: 8
sidebar_label: FAQ
---

# Frequently Asked Questions

- [Frequently Asked Questions](#frequently-asked-questions)
  - [General FAQ](#general-faq)
    - [How do I report a bug?](#how-do-i-report-a-bug)
    - [How can I request a new feature?](#how-can-i-request-a-new-feature)
    - [Who should I contact about Academic Collaborations?](#who-should-i-contact-about-academic-collaborations)
    - [Does OHIF offer support?](#does-ohif-offer-support)
    - [Does The OHIF Viewer have 510(k) Clearance from the U.S. F.D.A or CE Marking from the European Commission?](#does-the-ohif-viewer-have-510k-clearance-from-the-us-fda-or-ce-marking-from-the-european-commission)
    - [Is The OHIF Viewer HIPAA Compliant?](#is-the-ohif-viewer-hipaa-compliant)
  - [Technical FAQ](#technical-faq)
    - [Why do I keep seeing a Cross Origin Isolation warning](#why-do-i-keep-seeing-a-cross-origin-isolation-warning)
    - [Viewer opens but does not show any thumbnails](#viewer-opens-but-does-not-show-any-thumbnails)
    - [What are the list of required metadata for the OHIF Viewer to work?](#what-are-the-list-of-required-metadata-for-the-ohif-viewer-to-work)
    - [How do I handle large volumes for MPR and Volume Rendering](#how-do-i-handle-large-volumes-for-mpr-and-volume-rendering)


## General FAQ


### How do I report a bug?

Navigate to our [GitHub Repository][new-issue], and submit a new bug report.
Follow the steps outlined in the [Bug Report Template][bug-report-template].

### How can I request a new feature?

At the moment we are in the process of defining our roadmap and will do our best
to communicate this to the community. If your requested feature is on the
roadmap, then it will most likely be built at some point. If it is not, you are
welcome to build it yourself and [contribute it](development/contributing.md).
If you have resources and would like to fund the development of a feature,
please [contact us](https://ohif.org/get-support).


### Who should I contact about Academic Collaborations?

[Gordon J. Harris](https://www.dfhcc.harvard.edu/insider/member-detail/member/gordon-j-harris-phd/)
at Massachusetts General Hospital is the primary contact for any academic
collaborators. We are always happy to hear about new groups interested in using
the OHIF framework, and may be able to provide development support if the
proposed collaboration has an impact on cancer research.

### Does OHIF offer support?

yes, you can contact us for more information [here](https://ohif.org/get-support)


### Does The OHIF Viewer have [510(k) Clearance][501k-clearance] from the U.S. F.D.A or [CE Marking][ce-marking] from the European Commission?

**NO.** The OHIF Viewer is **NOT** F.D.A. cleared or CE Marked. It is the users'
responsibility to ensure compliance with applicable rules and regulations. The
[License](https://github.com/OHIF/Viewers/blob/master/LICENSE) for the OHIF
Platform does not prevent your company or group from seeking F.D.A. clearance
for a product built using the platform.

If you have gone this route (or are going there), please let us know because we
would be interested to hear about your experience.

### Is The OHIF Viewer [HIPAA][hipaa-def] Compliant?

**NO.** The OHIF Viewer **DOES NOT** fulfill all of the criteria to become HIPAA
Compliant. It is the users' responsibility to ensure compliance with applicable
rules and regulations.

## Technical FAQ

### Why do I keep seeing a Cross Origin Isolation warning
If you encounter a warning while running OHIF indicating that your application is not cross-origin isolated, it implies that volume rendering, such as MPR, will not function properly since they depend on Shared Array Buffers. To resolve this issue, we recommend referring to our comprehensive guide on Cross Origin Isolation available at [our dedicated cors page](./deployment/cors.md).

### Viewer opens but does not show any thumbnails

Thumbnails may not appear in your DICOMWeb application for various reasons. This guide focuses on one primary scenario, which is you are using
the `supportsWildcard: true` in your configuration file while your sever does not support it.
One

For instance for the following filtering in the worklist tab we send this request

![](assets/img/filtering-worklist.png)

`https://d33do7qe4w26qo.cloudfront.net/dicomweb/studies?PatientName=*Head*&limit=101&offset=0&fuzzymatching=false&includefield=00081030%2C00080060`

Which our server can respond properly. If your server does not support this type of filtering, you can disable it by setting `supportsWildcard: false` in your configuration file,
or edit your server code to support it for instance something like

```js
Pseudocode:
For each filter in filters:
    if filter.value contains "*":
        Convert "*" to SQL LIKE wildcard ("%")
        Add "metadataField LIKE ?" to query
    else:
        Add "metadataField = ?" to query
```




### What are the list of required metadata for the OHIF Viewer to work?
this

### How do I handle large volumes for MPR and Volume Rendering
This


<!--
  Links
  -->
[general]: #general
[technical]: #technical
[report-bug]: #how-do-i-report-a-bug
[new-feature]: #how-can-i-request-a-new-feature
[commercial-support]: #does-ohif-offer-commercial-support
[academic]: #who-should-i-contact-about-academic-collaborations
[fda-clearance]: #does-the-ohif-viewer-have-510k-clearance-from-the-us-fda-or-ce-marking-from-the-european-commission
[hipaa]: #is-the-ohif-viewer-hipaa-compliant
[501k-clearance]: https://www.fda.gov/MedicalDevices/DeviceRegulationandGuidance/HowtoMarketYourDevice/PremarketSubmissions/PremarketNotification510k/
[ce-marking]: https://ec.europa.eu/growth/single-market/ce-marking_en
[hipaa-def]: https://en.wikipedia.org/wiki/Health_Insurance_Portability_and_Accountability_Act
[new-issue]: https://github.com/OHIF/Viewers/issues/new/choose
[bug-report-template]: https://github.com/OHIF/Viewers/issues/new?assignees=&labels=Bug+Report+%3Abug%3A&template=---bug-report.md&title=
