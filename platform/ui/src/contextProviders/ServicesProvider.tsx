import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const servicesManagerContext = createContext(null);
const { Provider } = servicesManagerContext;

export const useServices = () => useContext(servicesManagerContext);

export function ServicesProvider({ children, services }) {
  return <Provider value={{ services }}>{children}</Provider>;
}

ServicesProvider.propTypes = {
  children: PropTypes.any,
  services: PropTypes.any,
};

export default ServicesProvider;
