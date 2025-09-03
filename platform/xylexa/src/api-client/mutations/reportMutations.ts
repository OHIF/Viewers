import axios from 'axios';
import { useMutation } from '@tanstack/react-query';

import { StudyId } from '../queries';
import { useGetRequestOptions } from '../../hooks';
import { API_URL } from './../../constants';
import { useAuthenticationContext } from '../../context';
import { MMGReportData } from '../../Reporting/forms/mmg-report-form';
export type ReportBody = {
  study_id: string;
  patient_id: string;
  patient_name: string;
  description: string | undefined;
};

export type ReportBodyForPatch = {
  description: string | undefined;
};

export const useSubmitStudyReport = () => {
  const { authToken } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);
  return useMutation({
    mutationFn: (reportBody: ReportBody) => axios.post(`${API_URL}v1/report/`, reportBody, options),
  });
};

export const useUpdateStudyReport = () => {
  const { authToken } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);
  return useMutation({
    mutationFn: ({ studyId, reportBody }: { studyId: StudyId; reportBody: ReportBodyForPatch }) =>
      axios.patch(`${API_URL}v1/report/?study_id=${studyId}`, reportBody, options),
  });
};

export const useUpsertMMGReport = () => {
  const { authToken } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);
  return useMutation({
    mutationFn: (mmgReportData: MMGReportData) =>
      axios.post(`${API_URL}v1/mmgReport/`, mmgReportData, options),
  });
};
