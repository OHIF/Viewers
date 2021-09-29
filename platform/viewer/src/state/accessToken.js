import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const accessTokenContext = createContext(null);
const { Provider } = accessTokenContext;

export const useAccessToken = () => useContext(accessTokenContext);

export function AccessTokenProvider({ children, value: token }) {
  const [accessToken, setAccessToken] = useState(token);

  return <Provider value={[accessToken]}>{children}</Provider>;
}

AccessTokenProvider.propTypes = {
  children: PropTypes.any,
  value: PropTypes.any,
};

export default AccessTokenProvider;
