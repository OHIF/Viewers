# Troubleshooting

## Common Problems

Problem | Most Common Reasons
--------|--------------------
** Can't retrieve Study List over DICOMWeb** | 1. QIDO root URL is incorrect<br> 2. DICOM Web is not enabled on PACS
** Can't retrieve Study List over DIMSE** | 1. PACS is not configured to allow connections from OHIF Meteor Server
** Can't retrieve images** | 1. WADO Root URL is incorrect<br> 2. DICOM Web is not enabled on PACS<br> 3. HTTP Basic Authentication username and password are incorrect or not provided.

## Debugging Steps
### Can't retrieve Study List over DICOMWeb

1. Check that you can query your PACS using an alternative DICOM Web client (e.g. cURL, or a Web Browser). If you cannot, then your PACS is configured incorrectly. Refer to the documentation of the image archive.
2.


### Can't retrieve Study List over DIMSE

### Can't retrieve images
