import { uploadDATA_Api } from '../api';

export default async function uploadDATAReport(measurementData) {
  await uploadDATA_Api(JSON.parse(JSON.stringify(measurementData)))
}

