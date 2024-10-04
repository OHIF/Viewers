import { useEffect } from 'react';
import { useShepherd } from 'react-shepherd';
import { StepOptions, TourOptions } from 'shepherd.js';
import { useLocation } from 'react-router';
import 'shepherd.js/dist/css/shepherd.css';
import './Onboarding.css';

const getShownTours = () => JSON.parse(localStorage.getItem('shownTours')) || [];
const hasTourBeenShown = (tourId: string) => getShownTours().includes(tourId);
const markTourAsShown = (tourId: string) => {
  const shownTours = getShownTours();
  if (!shownTours.includes(tourId)) {
    shownTours.push(tourId);
    localStorage.setItem('shownTours', JSON.stringify(shownTours));
  }
};

const Onboarding = () => {
  const Shepherd = useShepherd();
  const location = useLocation();
  const tours = window.config.tours as Array<{
    id: string;
    route: string;
    tourOptions: TourOptions;
    steps: StepOptions[];
  }>;

  useEffect(() => {
    if (!tours) {
      return;
    }

    const matchingTour = tours.find(tour => tour.route === location.pathname);
    if (!matchingTour || hasTourBeenShown(matchingTour.id)) {
      return;
    }

    const defaultShowHandler = () => {
      const currentStep = Shepherd.activeTour?.getCurrentStep();
      if (currentStep) {
        const progress = document.createElement('span');
        progress.className = 'shepherd-progress text-base text-muted-foreground';
        progress.innerText = `${Shepherd.activeTour?.steps.indexOf(currentStep) + 1}/${Shepherd.activeTour?.steps.length}`;
        progress.style.position = 'absolute';
        progress.style.left = '13px';
        progress.style.bottom = '20px';
        progress.style.zIndex = '1';

        const footer = currentStep?.getElement()?.querySelector('.shepherd-footer');
        footer?.appendChild(progress);
      }
    };

    const tourInstance = new Shepherd.Tour({
      ...matchingTour.tourOptions,
      defaultStepOptions: {
        ...matchingTour.tourOptions.defaultStepOptions,
        when: {
          ...matchingTour.tourOptions?.defaultStepOptions?.when,
          show: matchingTour.tourOptions?.defaultStepOptions?.when?.show || defaultShowHandler,
        },
      },
    });
    matchingTour.steps.forEach(step => tourInstance.addStep(step));
    tourInstance.start();
    markTourAsShown(matchingTour.id);
  }, [Shepherd, tours, location.pathname]);

  return null;
};

export { Onboarding };
