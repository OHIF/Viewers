const id = '@ohif/extension-dicom-pdf';
const SOPClassHandlerId = `${id}.sopClassHandlerModule.dicom-pdf`;

// TODO -> Inject these from package.json at build time.
const version = '3.0.1';

export { id, SOPClassHandlerId, version };
