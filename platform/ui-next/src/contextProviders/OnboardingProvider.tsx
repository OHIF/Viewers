import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { ShepherdJourneyProvider, useShepherd } from 'react-shepherd';
import 'shepherd.js/dist/css/shepherd.css';

const OnboardingProviderContext = createContext(null);
const { Provider } = OnboardingProviderContext;

export const useOnboardingProvider = () => useContext(OnboardingProviderContext);

const ShepherdController = () => {
  const Shepherd = useShepherd();
  const [tour, setTour] = useState(null);

  const initializeTour = useCallback(
    (steps, tourOptions = {}) => {
      const newTour = new Shepherd.Tour({
        steps,
        ...tourOptions,
      });
      setTour(newTour);
    },
    [Shepherd]
  );

  const startTour = useCallback(() => {
    if (tour) {
      tour.start();
    }
  }, [tour]);

  const exitTour = useCallback(() => {
    if (tour) {
      tour.cancel();
    }
  }, [tour]);

  const nextStep = useCallback(() => {
    if (tour) {
      tour.next();
    }
  }, [tour]);

  const previousStep = useCallback(() => {
    if (tour) {
      tour.back();
    }
  }, [tour]);

  return null;
};

const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ShepherdJourneyProvider>
      <Provider value={{}}>
        <ShepherdController />
        {children}
      </Provider>
    </ShepherdJourneyProvider>
  );
};

export default OnboardingProvider;
