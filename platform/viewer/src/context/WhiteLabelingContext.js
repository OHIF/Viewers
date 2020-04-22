import OHIFLogo from '../components/OHIFLogo/OHIFLogo.js';
import React from 'react';

const defaultContextValues = {
  createLogoComponentFn: React => OHIFLogo(),
};

const WhiteLabelingContext = React.createContext(defaultContextValues);

export default WhiteLabelingContext;
