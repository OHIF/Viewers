<table>
    <thead>
        <tr>
            <th>Extension</th>
            <th>Description</th>
            <th>Modules</th>
        </tr>
    </thead>
    <tbody>
        <!-- CORNERSTONE.js -->
        <tr>
            <td>
                <a href="https://www.npmjs.com/package/ohif-cornerstone-extension">
                    Cornerstone
                </a>
            </td>
            <td>
                A viewport powered by <code>cornerstone.js</code>. Adds support for 2D DICOM rendering and manipulation, as well as support for the tools features in <a href="https://tools.cornerstonejs.org/examples/"><code>cornerstone-tools</code></a>. Also adds "CINE Dialog" to the Toolbar.
            </td>
            <td>Viewport, Toolbar</td>
        </tr>
        <!-- VTK.js -->
        <tr>
            <td>
                <a href="https://www.npmjs.com/package/ohif-vtk-extension">
                    VTK.js
                </a>
            </td>
            <td>
                A viewport powered by <code>vtk.js</code>. Adds support for volume renderings and advanced features like MPR. Also adds "3D Rotate" to the Toolbar.
            </td>
            <td>Viewport, Toolbar</td>
        </tr>
        <tr>
            <td>
                <a href="">HTML</a>
            </td>
            <td>
                Renders text and HTML content for <a href="https://github.com/OHIF/Viewers/blob/react/extensions/ohif-dicom-html-extension/src/OHIFDicomHtmlSopClassHandler.js#L7-L15">specific SopClassUIDs</a>.
            </td>
            <td>Viewport, SopClassHandler</td>
        </tr>
        <tr>
            <td>
                <a href="https://www.npmjs.com/package/ohif-dicom-pdf-extension">PDF</a>
            </td>
            <td>
                Renders PDFs for a <a href="https://github.com/OHIF/Viewers/blob/react/extensions/ohif-dicom-pdf-extension/src/OHIFDicomPDFSopClassHandler.js#L8">specific SopClassUID</a>.
            </td>
            <td>Viewport, SopClassHandler</td>
        </tr>
        <tr>
            <td>
                <a href="https://www.npmjs.com/package/ohif-dicom-microscopy-extension">Microscopy</a>
            </td>
            <td>
                Renders Microscopy images for a <a href="https://github.com/OHIF/Viewers/blob/react/extensions/ohif-dicom-microscopy-extension/src/DicomMicroscopySopClassHandler.js#L6">specific SopClassUID</a>.
            </td>
            <td>Viewport, SopClassHandler</td>
        </tr>
    </tbody>
</table>