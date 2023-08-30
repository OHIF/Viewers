---
sidebar_position: 2
sidebar_label: Release Notes
---

# Release Notes


## Current Release (master branch)

### OHIF Viewer v3.6 - Official Version 3 Release (June 2023)

Check out the complete press announcement [here](https://ohif.org/newsletters/2023-06-08-ohif%20viewer%20v3%20official%20release%20&%20new%20nci%20funding--release).

- Official OHIF v3 release: An important milestone achieved with OHIF v3 now at feature parity with v2 but with a more extensible and powerful framework.

New Features:

- DICOM Radiotherapy Structure Sets: Enhancement of DICOM RTSTRUCT rendering pipeline to better integrate with other segmentation types.
- Slide Microscopy: Slide microscopy code updated with the latest technologies from the DICOM Microscopy Library and SLIM Viewer.
- DICOM Uploader: New feature to easily upload DICOM files directly from the viewer to their PACS systems over DICOMWeb.
- Cornerstone DICOM Image Loader Migrated to TypeScript: Transition to the new TypeScript-based DICOM Image Loader library.
- Cornerstone3D 1.0 Release: Announcement of Cornerstone3D reaching version 1.0, indicating its readiness for production use.

## Previous V3 Releases (on `v3-stable` branch, before merge to `master`)

### OHIF Viewer v3.5 - Docker Build

This update represents a minor release that is primarily focused on enhancing the development environment of the OHIF Viewer. It achieves this by integrating Docker build support, which is essential for streamlining the deployment process and ensuring consistent environments. Additionally, in an effort to optimize the development workflow, this release takes care of pushing changes to the master branch. Furthermore, it strategically splits the master branch from the release branch. This separation is crucial as it allows the developers to work more efficiently on the ongoing developments in the master branch, while simultaneously ensuring that the release branch remains stable and well-maintained. Such an approach underlines the commitment to both innovation and reliability.


### OHIF Viewer v3.4 - Segmentation Support (April 2023)
Check out the complete press announcement [here](https://ohif.org/newsletters/2023-04-03-new%20product%20features,%20grant%20updates%20and%20collaborations).

- New Viewport State Preservation: Enhancements in state synchronization in OHIF Viewer for a seamless experience when switching between Multiplanar Reformatting (MPR) and other views.

- Enhanced Hanging Protocol Matching: Improved hanging protocols for a faster, more user-friendly experience.

- Customizable Context Menu: Expansion of context menu options allowing for greater customization and addition of sub-menus.

- UI/UX Improvements: Revamped viewport header design and the addition of double-click functionality to maximize viewport.

### OHIF Viewer v3.3 - Segmentation Support (November 2022)

Check out the complete press announcement [here](https://ohif.org/newsletters/2022-11-21-ohif%20viewer:%20dicom%20segmentation%20support).

- 3D Segmentation: Segmentations are natively loaded and rendered in 3D. The UI includes various interaction tools and rendering display preferences. Segmentation creation and editing tools are in development.

- Fast and Optimized Multiplanar Reconstruction (MPR): The viewer now supports MPR visualization of volumes and segmentations, leading to significantly reduced memory footprint and improved performance.

- New Collapsible Side Panels: The OHIF Viewer has redesigned side panels to be more compact and user friendly.

- Context-aware Drag and Drop via Hanging Protocols: The viewer now allows a more seamless experience when dragging and dropping thumbnails.

- New Tools: Two new tools have been added: Reference Lines and Stack Synchronizations.



### OHIF Viewer v3.2 - Mode Gallery & TMTV Mode (August 2022)

Check out the complete press announcement [here](https://ohif.org/newsletters/2022-08-18-mode%20gallery%20and%20tmtv%20mode).

- New Total Metabolic Tumor Volume (TMTV) Workflow: This new mode includes high-performance rendering of volumetric data in ten distinct viewports, fusion of two series with adjustable colormaps, synchronization of the viewports for both camera and VOI settings, jump-to-click capability to synchronize navigation in all viewports, and support for exporting results.

- OHIF Workflow Mode Gallery: This new feature is a one-stop shop for users to find, install, and use OHIF modes and share functionality with the community. The gallery is continuously updated with community-submitted modes.


### OHIF Viewer v3.1 - Cornerstone3D Integration (July 2022)

Check out the complete press announcement [here](https://ohif.org/newsletters/2022-07-28-ohif%20&%20cornerstone3d%20integratione).

- Cornerstone3D Integration: OHIF v3.1 has deprecated the legacy Cornerstone.js extension and replaced all functionality with Cornerstone3D. This includes updating the Measurement Tracking workflow mode.

- GPU Accelerated 2D Rendering: The Cornerstone3D rendering engine now supports WebGL 2D textures for large images, increasing the interaction speed significantly compared to the legacy Cornerstone.js engine.

- Upgraded Hanging Protocol Engine: The OHIF Hanging Protocol Engine has been updated for increased flexibility and ease of writing protocols. This includes the ability to position viewports in any non-grid layout and specify viewport configurations such as colormap, initial VOI, initial image to render, orientation, and more.


### OHIF Viewer v3.0 Public Beta Launch (September 2021)

Check out the complete press announcement [here](https://ohif.org/newsletters/2021-09-14-ohif%20update:%20v3%20public%20beta%20launch--release).

- UI has been completely redesigned with modularity and workflow modes in mind.
- New UI components have been built with Tailwind CSS
- Addition of workflow modes
  - Often, medical imaging use cases involves lots of specific workflows that
    re-use functionalities. We have added the capability of workflow modes, that
    enable people to customize user interface and configure application for
    specific workflow.
  - The idea is to re-use the functionalities that extensions provide and create
    a workflow. Brain segmentation workflow is different from prostate
    segmentation in UI for sure; however, they share the segmentation tools that
    can be re-used.
  - Our vision is that technical people focus of developing extensions which
    provides core functionalities, and experts to build modes by picking the
    appropriate functionalities from each extension.




<!-- Below, you can find the gap analysis between the `OHIF-v2` and `OHIF-v3`:

<table>
    <thead>
        <tr>
            <th align="left" width="50%">OHIF-v2 functionalities</th>
            <th align="center">OHIF-v3</th>
            <th align="center">Comment</th>
        </tr>
    </thead>
<tbody>
    <tr>
        <td align="left">Rendering of 2D images via Cornerstone</td>
        <td align="center">✅</td>
        <td align="center"></td>
    </tr>
    <tr>
        <td align="left">Study List</td>
        <td align="center">✅</td>
        <td align="center"></td>
    </tr>
    <tr>
        <td align="left">Series Browser</td>
        <td align="center">✅</td>
        <td align="center"></td>
    </tr>
    <tr>
        <td align="left">DICOM JSON</td>
        <td align="center">✅</td>
        <td align="center"></td>
    </tr>
    <tr>
        <td align="left">2D Tools via CornerstoneTools</td>
        <td align="center">✅</td>
        <td align="center"></td>
    </tr>
    <tr>
        <td align="left">OpenID Connect standard authentication flow for connecting to identity providers</td>
        <td align="center">✅</td>
        <td align="center"></td>
    </tr>
    <tr>
        <td align="left">Internationalization</td>
        <td align="center">✅</td>
        <td align="center"></td>
    </tr>
    <tr>
        <td align="left">Drag/drop DICOM data into the viewer (see https://viewer.ohif.org/local)</td>
        <td align="center">✅</td>
        <td align="center"></td>
    </tr>
    <tr>
        <td align="left">White-labelling: Easily replace the OHIF Logo with your logo</td>
        <td align="center">✅</td>
        <td align="center"></td>
    </tr>
     <tr>
        <td align="left">DICOM PDF support</td>
        <td align="center">✅</td>
    </tr>
    <tr>
        <td align="left">DICOM Whole-slide imaging viewport</td>
        <td align="center">🔜</td>
        <td align="center">In Progress</td>
    </tr>
    <tr>
        <td align="left">IHE Invoke Image Display - Standard-compliant launching of the viewer (e.g. from PACS or RIS)</td>
        <td align="center">🔜</td>
        <td align="center">Not Started</td>
    </tr>
    <tr>
        <td align="left">Displaying non-renderable DICOM as HTML</td>
        <td align="center">🔜</td>
        <td align="center">Not Started</td>
    </tr>
    <tr>
        <td align="left">Segmentation support</td>
        <td align="center">✅</td>
        <td align="center">Not Started</td>
    </tr>
    <tr>
        <td align="left">RT STRUCT support</td>
        <td align="center">🔜</td>
        <td align="center">Not Started</td>
    </tr>
    <tr>
        <td align="left">DICOM upload to PACS</td>
        <td align="center">🔜</td>
        <td align="center">Not Started</td>
    </tr>
    <tr>
        <td align="left">Google Cloud adapter</td>
        <td align="center">🔜</td>
        <td align="center">Not Started</td>
    </tr>
    <tr>
        <td align="left">VTK Extension + MIP / MPR layout</td>
        <td align="center">✅</td>
        <td align="center">3D rendering and 3D annotation tools via Cornerstone3D</td>
    </tr>
    <tr>
        <td align="left">UMD Build (Embedded Viewer). </td>
        <td align="center">❌</td>
        <td align="center">The problem is that this breaks a bunch of extensions that rely on third party scripts (e.g. VTK) which have their own web worker loaders.</td>
    </tr>
</tbody>
</table> -->
