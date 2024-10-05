const apiEndpoints = {
  updateAccess: studyUid => `/dicom-web/update-access/${studyUid}`,
  getAccessList: studyUid => `dicom-web/update-access/${studyUid}`,

  manage: studyUid => `dicom-web/manage/studies/${studyUid}`,
  groundTruth: studyUid => `dicom-web/manage/studies/${studyUid}/attachments/groundTruth`,
  mammoModel: studyUid => `/dicom-web/models/mammo/${studyUid}`,
  model: studyUid => `/dicom-web/run-model//${studyUid}`,
  taskStatus: taskId => `dicom-web/tasks/${taskId}`,
};

export default apiEndpoints;
