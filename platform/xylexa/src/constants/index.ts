export const API_URL =
  process.env.REACT_APP_API_URL || 'https://backend.xylexa.ai/api/';

export const AUTH_API_URL =
  process.env.REACT_APP_AUTH_API_URL || 'https://keycloakpacs.xylexa.ai/keycloak/realms/orthanc/protocol/openid-connect/';

export * from './localStorageKeys';
