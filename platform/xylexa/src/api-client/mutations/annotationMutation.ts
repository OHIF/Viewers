import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { API_URL } from '../../constants';
import { useAuthenticationContext } from '../../context';
import { useGetRequestOptions } from '../../hooks';

export type AnnotationDataReqBody = {
  study_instance_id: string;
  annotation_data: [];
  measurement_data: [];
};

export const useUpsertAnnotationData = () => {
  const { authToken } = useAuthenticationContext();
  const options = useGetRequestOptions(authToken);

  return useMutation({
    mutationFn: (body: AnnotationDataReqBody) =>
      axios.post(`${API_URL}v1/annotations/`, body, options),
  });
};
