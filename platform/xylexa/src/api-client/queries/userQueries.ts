import axios, { AxiosResponse } from 'axios';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { AUTH_API_URL } from '../../constants';
import { getTotalStudiesKey, userDataQueryKey } from './queryKeys';
import { UserInfo } from '../../types';
import { useGetRequestOptions } from '../../hooks';
import { Studies, useAuthenticationContext } from '../../context';

export type GetCloudServerConfigsProps = {
  groupId: string | null;
  enabled?: boolean;
};

export type GetLocalServerConfigsProps = {
  groupId: string | null;
  enabled?: boolean;
};

export type GetTotalStudiesProps = {
  loggedInUser: string;
  enabled?: boolean;
};

export const useGetUserInfo = (): UseQueryResult<UserInfo> => {
  const { authToken } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);

  return useQuery({
    queryKey: userDataQueryKey,
    queryFn: () => axios.get(`${AUTH_API_URL}userinfo`, options).then(res => res.data),
    enabled: Boolean(authToken),
  });
};

export const useGetAllStudies = ({
  loggedInUser,
  enabled = false,
}: GetTotalStudiesProps): UseQueryResult<AxiosResponse<Studies>, Error> => {
  const { currentServerConfigs, authToken } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);
  return useQuery({
    queryKey: getTotalStudiesKey(loggedInUser),
    queryFn: () => axios.get(`${currentServerConfigs?.qidoRoot}/studies`, options),
    enabled,
  });
};
