# DICOM Video
This extension adds support for displaying DICOM video objects in a script tag.
The video data must currently be available as video/mp4 on the BulkDataURI that
is provided in the DICOMweb metadata response, and the video must have one of the
specified SOP Class UID's in order to be recognized by the SOP class handler.

Those are:
* Video Microscop Image Storage
* Video Photographic Image Storage
* Video Endoscopic Image Storage
* Secondary Capture Image Storage
* Multiframe True Color Secondary Capture Image Storage

The extension is a "standard" extension in that it is installed and available
by default.
