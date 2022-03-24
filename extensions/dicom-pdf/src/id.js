const Name = 'dicom-pdf';
const id = `org.ohif.${Name}`;

export default id;

const SOPClassHandlerId = `${id}.sopClassHandlerModule.${Name}`;
const ViewportModuleId = `${id}.viewportModule.${Name}`;

export { Name, SOPClassHandlerId, ViewportModuleId };
