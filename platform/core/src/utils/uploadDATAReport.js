import { uploadDATA_Api } from '../api';

export default async function uploadDATAReport(uiNotificationService, measurementData) {
  await uploadDATA_Api({
    data: JSON.stringify(measurementData),
    uid: measurementData[0].referenceStudyUID,
  });
  uiNotificationService.show({
    title: '上传DATA报告成功',
    message: `已成功上传${measurementData.length}条测量数据`,
    type: 'info',
  });
}
