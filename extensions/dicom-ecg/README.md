<h1>@ohif/extension-dicom-ecg</h1>
This extension implements the project(https://github.com/ArturRod/ecg-dicom-web-viewer) in the view for OHIF, thus being able to load ECG in OHIF Viewer (https://github.com/OHIF/Viewers).</br>
Tested in OHIF version 4.12.25 onwards.</br>
Currently it works:</br>
<ul>
  <li><strong>Sop12LeadECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.1', --> YES</strong></li>
  <li><strong>GeneralECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.2', --> YES</strong></li>
  <li><strong>AmbulatoryECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.3', --> NO SUPPORT</strong></li>
  <li><strong>HemodynamicWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.2.1', --> YES</strong></li>
</ul>

<a href="https://github.com/ArturRod/dicom-ecg/blob/main/INSTALLATION.md"><strong>Installation Guide</strong></a>

<h3>Results</h3>
<img src="https://user-images.githubusercontent.com/86238895/186395831-a460b9b7-89d9-4ba7-a4b6-c12867bd5a4d.png" />

<h3>Features</h3>
<ul>
  <li><strong>Create npm repository/library ✅ (https://www.npmjs.com/package/ecg-dicom-web-viewer) - Complete </strong></li>
</ul>
