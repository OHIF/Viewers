import React, { createContext, useContext } from 'react';
import { ShepherdJourneyProvider, useShepherd } from 'react-shepherd';
import { StepOptions, TourOptions } from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

const OnboardingProviderContext = createContext(null);
const { Provider } = OnboardingProviderContext;

export const useOnboardingProvider = () => useContext(OnboardingProviderContext);

const ShepherdController = ({
  tours,
}: {
  tours: Array<{
    tourOptions: TourOptions;
    steps: StepOptions[];
    route: string;
    id: string;
  }>;
}) => {
  const Shepherd = useShepherd();

  return null;
};

const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const tours = window?.config?.tours;
  if (!tours) {
    return <>{children}</>;
  }
  return (
    <ShepherdJourneyProvider>
      <Provider value={{}}>
        <ShepherdController tours={tours} />
        {children}
      </Provider>
    </ShepherdJourneyProvider>
  );
};

export default OnboardingProvider;
