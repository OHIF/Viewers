export const API_URL =
  process.env.REACT_APP_API_URL || 'http://192.168.18.74:8888/api/';

export const AUTH_API_URL =
  process.env.REACT_APP_AUTH_API_URL || 'http://192.168.18.74/keycloak/realms/orthanc/protocol/openid-connect/';

export * from './localStorageKeys';
