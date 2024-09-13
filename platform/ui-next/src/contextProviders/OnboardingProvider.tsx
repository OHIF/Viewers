import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { Hints, Steps } from 'intro.js-react';
import 'intro.js/introjs.css';

const OnboardingProviderContext = createContext(null);
const { Provider } = OnboardingProviderContext;

export const useOnboardingProvider = () => useContext(OnboardingProviderContext);

const OnboardingProvider = ({
  children,
  service = null,
}: {
  children: React.ReactNode;
  service: any;
}) => {
  const [hintsEnabled, setHintsEnabled] = useState(false);
  const [stepsEnabled, setStepsEnabled] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [hints, setHints] = useState([]);

  const showHints = useCallback(() => setHintsEnabled(true), []);
  const hideHints = useCallback(() => setHintsEnabled(false), []);
  const startSteps = useCallback(() => setStepsEnabled(true), []);
  const exitSteps = useCallback(() => setStepsEnabled(false), []);
  const nextStep = useCallback(() => setCurrentStep(prev => prev + 1), []);
  const previousStep = useCallback(() => setCurrentStep(prev => prev - 1), []);

  // Set the service implementation
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        showHints,
        hideHints,
        startSteps,
        exitSteps,
        nextStep,
        previousStep,
        setHints,
        setSteps,
      });
    }
  }, [
    service,
    showHints,
    hideHints,
    startSteps,
    exitSteps,
    nextStep,
    previousStep,
    setHints,
    setSteps,
  ]);

  return (
    <Provider
      value={{
        showHints,
        hideHints,
        startSteps,
        exitSteps,
        nextStep,
        previousStep,
        setHints,
        setSteps,
      }}
    >
      <Hints
        enabled={hintsEnabled}
        hints={hints}
      />
      <Steps
        enabled={stepsEnabled}
        steps={steps}
        initialStep={currentStep}
        onExit={exitSteps}
      />
      {children}
    </Provider>
  );
};

export default OnboardingProvider;
