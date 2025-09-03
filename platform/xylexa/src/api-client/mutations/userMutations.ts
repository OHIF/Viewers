import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { AUTH_API_URL } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { useAuthenticationContext } from '../../context';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: AxiosError;
  }
}

export type Credentials = {
  username: string;
  password: string;
  grant_type: 'password';
  client_id: 'orthanc';
  scope: 'openid email profile';
};

export type Auth = {
  data: {
    access: string;
  };
  response: {
    data: {
      detail: string;
    };
  };
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (creds: Credentials) =>
      axios.post(`${AUTH_API_URL}token`, creds, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
  });
};

export const useLogout = () => {
  const { clearStorage } = useAuthenticationContext();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => axios.post(`${AUTH_API_URL}logout`),
    onSuccess() {
      clearStorage();
      navigate('/login');
    },
  });
};
