// import MipButton from './MIPButton';
import MipButton from './MIPButton';

const toolbarModule = ({ commandsManager, servicesManager }) => {
  return {
    name: 'ohif.mipButton',
    defaultComponent: props => MipButton({ ...props, commandsManager, servicesManager }),
  };
};

export default toolbarModule;
