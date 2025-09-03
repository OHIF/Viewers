export const authTokenQueryKey = ['user', 'auth'];

export const userDataQueryKey = ['user', 'data'];

export const patientAiReportQueryKey = ['patient', 'ai', 'report'];
export const patientReportIdsQueryKey = ['patient', 'report', 'ids'];

export const annotationDataQueryKey = ['annotation', 'data', 'query'];

export const CloudServerConfigKey = [['user', 'server', 'configs', 'cloud']];
export const LocalServerConfigKey = [['user', 'server', 'configs', 'local']];

export const getTotalStudiesKey = (totalStudiesDynamicQueryKey: string) => {
  return [['user', 'server', 'configs', 'local', totalStudiesDynamicQueryKey]];
};

export const getAnnotationDataDynamicQueryKey = (annotationDataDynamicQueryKey: string) => {
  return [['annotation', 'data', 'query', annotationDataDynamicQueryKey]];
};

export const getPatientReportDynamicQueryKey = (patientReportDynamickey: string) => {
  return [['patient', 'report', patientReportDynamickey]];
};

export const getMMGReportDynamicQueryKey = (mmgReportDynamickey: string) => {
  return [['mmg', 'report', mmgReportDynamickey]];
};
