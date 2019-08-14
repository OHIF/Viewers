import OHIFLogo from './components/OHIFLogo/OHIFLogo.js';
import React from 'react';

const defaultContextValues = {
  logoComponent: OHIFLogo(),
};

const WhiteLabellingContext = React.createContext(defaultContextValues);

export default WhiteLabellingContext;
