---
id: Introduction
slug: /
sidebar_position: 1
---

The [Open Health Imaging Foundation][ohif-org] (OHIF) Viewer is an open source,
web-based, medical imaging platform. It aims to provide a core framework for
building complex imaging applications.

Key features:

- Designed to load large radiology studies as quickly as possible. Retrieves
  metadata ahead of time and streams in imaging pixel data as needed.
- Leverages [Cornerstone3D](https://github.com/cornerstonejs/cornerstone3D-beta) for decoding,
  rendering, and annotating medical images.
- Works out-of-the-box with Image Archives that support [DICOMWeb][dicom-web].
  Offers a Data Source API for communicating with archives over proprietary API
  formats.
- Provides a plugin framework for creating task-based workflow modes which can
  reuse core functionality.
- Beautiful user interface (UI) designed with extensibility in mind. UI
  components available in a reusable component library built with React.js and
  Tailwind CSS


<div style={{ textAlign: 'center' }}>
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <a style={{
            backgroundColor: '#4042af',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            textDecoration: 'none',
            ':hover': {
                backgroundColor: '#2a2b74'
            }
        }} href="https://ohif.org/news/">Subscribe to our newsletter</a>
        <a style={{
            backgroundColor: '#4042af',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            textDecoration: 'none',
            ':hover': {
                backgroundColor: '#2a2b74'
            }
        }} href="./release-notes">Release Notes</a>
    </div>
</div>

<br/>
<br/>



|     |  | |
| :-: | :---  | :--- |
| <img src="https://github.com/OHIF/Viewers/blob/master/platform/docs/docs/assets/img/demo-measurements.webp?raw=true" alt="Measurement tracking" width="350"/> | Measurement Tracking | [Demo](https://viewer.ohif.org/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5) |
| <img src="https://github.com/OHIF/Viewers/blob/master/platform/docs/docs/assets/img/demo-segmentation.webp?raw=true" alt="Segmentations" width="350"/> | Labelmap Segmentations  | [Demo](https://viewer.ohif.org/viewer?StudyInstanceUIDs=1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046) |
| <img src="https://github.com/OHIF/Viewers/blob/master/platform/docs/docs/assets/img/demo-ptct.webp?raw=true" alt="Hanging Protocols" width="350"/> | Fusion and Custom Hanging protocols  | [Demo](https://viewer.ohif.org/tmtv?StudyInstanceUIDs=1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463) |
| <img src="https://github.com/OHIF/Viewers/blob/master/platform/docs/docs/assets/img/demo-volume-rendering.webp?raw=true" alt="Volume Rendering" width="350"/> | Volume Rendering  | [Demo](https://viewer.ohif.org/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5&hangingprotocolId=mprAnd3DVolumeViewport) |
| <img src="https://github.com/OHIF/Viewers/blob/master/platform/docs/docs/assets/img/demo-pdf.webp?raw=true" alt="PDF" width="350"/> | PDF  | [Demo](https://viewer.ohif.org/viewer?StudyInstanceUIDs=2.25.317377619501274872606137091638706705333) |
| <img src="https://github.com/OHIF/Viewers/blob/master/platform/docs/docs/assets/img/demo-rtstruct.webp?raw=true" alt="RTSTRUCT" width="350"/> | RT STRUCT  | [Demo](https://viewer.ohif.org/viewer?StudyInstanceUIDs=1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0) |
| <img src="https://github.com/OHIF/Viewers/blob/master/platform/docs/docs/assets/img/demo-4d.webp?raw=true" alt="4D" width="350"/> | 4D  | [Demo](https://viewer.ohif.org/dynamic-volume?StudyInstanceUIDs=2.25.232704420736447710317909004159492840763) |
| <img src="https://github.com/OHIF/Viewers/blob/master/platform/docs/docs/assets/img/demo-video.webp?raw=true" alt="VIDEO" width="350"/> | Video  | [Demo](https://viewer.ohif.org/viewer?StudyInstanceUIDs=2.25.96975534054447904995905761963464388233) |
| <img src="https://github.com/OHIF/Viewers/blob/master/platform/docs/docs/assets/img/microscopy.webp?raw=true" alt="microscopy" width="350"/> | Slide Microscopy  | [Demo](https://viewer.ohif.org/microscopy?StudyInstanceUIDs=2.25.141277760791347900862109212450152067508) |



## Where to next?

The Open Health Imaging Foundation intends to provide an imaging viewer
framework which can be easily extended for specific uses. If you find yourself
unable to extend the viewer for your purposes, please reach out via our [GitHub
issues][gh-issues]. We are actively seeking feedback on ways to improve our
integration and extension points.

Check out these helpful links:

- Ready to dive into some code? Check out our
  [Getting Started Guide](./development/getting-started.md).
- We're an active, vibrant community.
  [Learn how you can be more involved.](./development/contributing.md)
- Feeling lost? Read our [help page](/help).

## Citing OHIF

To cite the OHIF Viewer in an academic publication, please cite

> _Open Health Imaging Foundation Viewer: An Extensible Open-Source Framework
> for Building Web-Based Imaging Applications to Support Cancer Research_
>
>  Erik Ziegler, Trinity Urban, Danny Brown, James Petts, Steve D. Pieper, Rob
> Lewis, Chris Hafey, and Gordon J. Harris _JCO Clinical Cancer Informatics_, no. 4 (2020), 336-345, DOI:
> [10.1200/CCI.19.00131](https://www.doi.org/10.1200/CCI.19.00131)

This article is freely available on Pubmed Central: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7259879/


or, for Lesion Tracker of OHIF v1, please cite:

> _LesionTracker: Extensible Open-Source Zero-Footprint Web Viewer for Cancer
> Imaging Research and Clinical Trials_
>
> Trinity Urban, Erik Ziegler, Rob Lewis, Chris Hafey, Cheryl Sadow, Annick D.
> Van den Abbeele and Gordon J. Harris _Cancer Research_, November 1 2017 (77) (21) e119-e122 DOI:
> [10.1158/0008-5472.CAN-17-0334](https://www.doi.org/10.1158/0008-5472.CAN-17-0334)

This article is freely available on Pubmed Central.
https://pubmed.ncbi.nlm.nih.gov/29092955/


**Note:** If you use or find this repository helpful, please take the time to
star this repository on Github. This is an easy way for us to assess adoption,
and it can help us obtain future funding for the project.

## License

MIT © [OHIF](https://github.com/OHIF)

&nbsp;

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[ohif-org]: https://www.ohif.org
[ohif-demo]: http://viewer.ohif.org/
[dicom-web]: https://en.wikipedia.org/wiki/DICOMweb
[gh-issues]: https://github.com/OHIF/Viewers/issues
<!-- prettier-ignore-end -->
