import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const lanternAppConfigContext = createContext(null);
const { Provider } = lanternAppConfigContext;

export const useLanternAppConfig = () => useContext(lanternAppConfigContext);

export function LanternAppConfigProvider({
  children,
  accessTokenValue,
  studyUIDValue,
  userValue,
}) {
  const [accessToken] = useState(accessTokenValue);
  const [studyInstanceUIDs] = useState([studyUIDValue]);
  const [user] = useState(userValue);

  return (
    <Provider value={{ accessToken, studyInstanceUIDs, user }}>
      {children}
    </Provider>
  );
}

LanternAppConfigProvider.propTypes = {
  children: PropTypes.any,
  accessTokenValue: PropTypes.string,
  studyUIDValue: PropTypes.string,
  userValue: PropTypes.object,
};

export default LanternAppConfigProvider;
