const name = 'onboardingService';

const serviceImplementation = {
  _showHints: () => console.warn('showHints() NOT IMPLEMENTED'),
  _hideHints: () => console.warn('hideHints() NOT IMPLEMENTED'),
  _startSteps: () => console.warn('startSteps() NOT IMPLEMENTED'),
  _exitSteps: () => console.warn('exitSteps() NOT IMPLEMENTED'),
  _nextStep: () => console.warn('nextStep() NOT IMPLEMENTED'),
  _previousStep: () => console.warn('previousStep() NOT IMPLEMENTED'),
  _setHints: hints => console.warn('setHints() NOT IMPLEMENTED'),
  _setSteps: steps => console.warn('setSteps() NOT IMPLEMENTED'),
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
   * Show hints dynamically
   */
  showHints() {
    return serviceImplementation._showHints();
  }

  /**
   * Hide hints
   */
  hideHints() {
    return serviceImplementation._hideHints();
  }

  /**
   * Start the step tour dynamically
   */
  startSteps() {
    return serviceImplementation._startSteps();
  }

  /**
   * Exit the step tour
   */
  exitSteps() {
    return serviceImplementation._exitSteps();
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

  /**
   * Dynamically set the hints
   */
  setHints(hints) {
    return serviceImplementation._setHints(hints);
  }

  /**
   * Dynamically set the steps
   */
  setSteps(steps) {
    return serviceImplementation._setSteps(steps);
  }

  /**
   * Sets the service implementation for hints and steps
   */
  setServiceImplementation({
    showHints: showHintsImplementation,
    hideHints: hideHintsImplementation,
    startSteps: startStepsImplementation,
    exitSteps: exitStepsImplementation,
    nextStep: nextStepImplementation,
    previousStep: previousStepImplementation,
    setHints: setHintsImplementation,
    setSteps: setStepsImplementation,
  }) {
    if (showHintsImplementation) {
      serviceImplementation._showHints = showHintsImplementation;
    }
    if (hideHintsImplementation) {
      serviceImplementation._hideHints = hideHintsImplementation;
    }
    if (startStepsImplementation) {
      serviceImplementation._startSteps = startStepsImplementation;
    }
    if (exitStepsImplementation) {
      serviceImplementation._exitSteps = exitStepsImplementation;
    }
    if (nextStepImplementation) {
      serviceImplementation._nextStep = nextStepImplementation;
    }
    if (previousStepImplementation) {
      serviceImplementation._previousStep = previousStepImplementation;
    }
    if (setHintsImplementation) {
      serviceImplementation._setHints = setHintsImplementation;
    }
    if (setStepsImplementation) {
      serviceImplementation._setSteps = setStepsImplementation;
    }
  }
}

export default OnboardingService;
