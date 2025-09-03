import axios from 'axios';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { API_URL } from './../../constants';
import {
  getMMGReportDynamicQueryKey,
  getPatientReportDynamicQueryKey,
  patientAiReportQueryKey,
  patientReportIdsQueryKey,
} from './queryKeys';

import { useGetRequestOptions } from '../../hooks';
import { useAuthenticationContext } from '../../context';
import { MMGReportData } from '../../Reporting/forms/mmg-report-form';
export type StudyId = string;
export type QueryKey = string;

/**
 *
 * @param {string} studyId
 * @param {string} queryKey
 * @returns {object} query funtion which gives us report data against the
 * provided study Id
 *
 * @example
 * const studyId = '1234.56789.654321'
 * const queryKey = 'your-key'
 * const { data: studyReportData } = useGetStudyReport(studyId, queryKey);
 *
 * console.log({studyReportData})
 */

export const useGetStudyReport = (studyId: StudyId, queryKey: QueryKey) => {
  const { authToken } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);
  return useQuery({
    queryKey: getPatientReportDynamicQueryKey(queryKey),
    queryFn: async () => await axios.get(`${API_URL}v1/report/?study_id=${studyId}`, options),
    retry: 0,
  });
};

/**
 *
 * @param {string} studyId
 * @returns {object} query funtion which gives us report data against the
 * provided study Id
 *
 * @example
 * const studyId = '4321.56789.654321'
 * const queryKey = 'your-key'
 * const { data: studyReportAiData } = useGetAiReport(studyId);
 *
 * console.log({studyReportAiData})
 */

export const useGetAiReport = (studyId: StudyId, isSelectedModalityCT: boolean) => {
  const { authToken } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);

  return useQuery({
    queryKey: patientAiReportQueryKey,
    queryFn: async () => await axios.get(`${API_URL}v1/aireport/?study_id=${studyId}`, options),
    enabled: isSelectedModalityCT,
    retry: 0,
  });
};

export const useGetReportIds = () => {
  const { authToken, clearStorage } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);
  return useQuery({
    queryKey: patientReportIdsQueryKey,
    queryFn: async () =>
      await axios.get(`${API_URL}v1/reportIds/`, options).catch(error => {
        if (error.response.status === 401) {
          clearStorage();
          window.location.reload();
        }
        return;
      }),
  });
};

export const useGetMMGReport = (
  studyInstanceId: string,
  isSelectedModalityMG: boolean
): UseQueryResult<MMGReportData> => {
  const { authToken } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);
  return useQuery({
    queryKey: getMMGReportDynamicQueryKey(studyInstanceId),
    queryFn: async () =>
      (await axios.get(`${API_URL}v1/mmgReport/?study_instance_id=${studyInstanceId}`, options))
        .data,
    enabled: isSelectedModalityMG,
  });
};
