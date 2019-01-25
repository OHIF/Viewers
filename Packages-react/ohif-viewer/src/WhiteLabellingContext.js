import OHIFLogo from './components/OHIFLogo/OHIFLogo.js';

const defaultContextValues = {
  logoComponent: OHIFLogo()
};

const WhiteLabellingContext = React.createContext(defaultContextValues);

export default WhiteLabellingContext;
