const name = 'onboardingService';

const serviceImplementation = {
  _startTour: () => console.warn('startTour() NOT IMPLEMENTED'),
  _exitTour: () => console.warn('exitTour() NOT IMPLEMENTED'),
  _nextStep: () => console.warn('nextStep() NOT IMPLEMENTED'),
  _previousStep: () => console.warn('previousStep() NOT IMPLEMENTED'),
  _initializeTour: (steps, tourOptions) => console.warn('initializeTour() NOT IMPLEMENTED'),
};

class OnboardingService {
  static REGISTRATION = {
    name,
    altName: 'OnboardingService',
    create: (): OnboardingService => {
      return new OnboardingService();
    },
  };

  readonly name = name;

  /**
   * Initialize the step tour
   */
  initializeTour(steps, tourOptions = {}) {
    return serviceImplementation._initializeTour(steps, tourOptions);
  }

  /**
   * Start the step tour
   */
  startTour() {
    return serviceImplementation._startTour();
  }

  /**
   * Exit the step tour
   */
  exitTour() {
    return serviceImplementation._exitTour();
  }

  /**
   * Move to the next step in the tour
   */
  nextStep() {
    return serviceImplementation._nextStep();
  }

  /**
   * Move to the previous step in the tour
   */
  previousStep() {
    return serviceImplementation._previousStep();
  }

  setServiceImplementation({
    initializeTour: initializeTourImplementation,
    startTour: startStepsImplementation,
    exitTour: exitStepsImplementation,
    nextStep: nextStepImplementation,
    previousStep: previousStepImplementation,
  }) {
    if (initializeTourImplementation) {
      serviceImplementation._initializeTour = initializeTourImplementation;
    }
    if (startStepsImplementation) {
      serviceImplementation._startTour = startStepsImplementation;
    }
    if (exitStepsImplementation) {
      serviceImplementation._exitTour = exitStepsImplementation;
    }
    if (nextStepImplementation) {
      serviceImplementation._nextStep = nextStepImplementation;
    }
    if (previousStepImplementation) {
      serviceImplementation._previousStep = previousStepImplementation;
    }
  }
}

export default OnboardingService;
