import { uploadDATA_Api } from '../api';

export default async function uploadDATAReport(measurementData) {
  await uploadDATA_Api({
    data:JSON.stringify(measurementData),
    uid:measurementData[0].referenceStudyUID
  })
}

