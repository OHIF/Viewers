import { useEffect } from 'react';
import { useShepherd } from 'react-shepherd';
import { StepOptions, TourOptions } from 'shepherd.js';
import { useLocation } from 'react-router';
import 'shepherd.js/dist/css/shepherd.css';
import './Onboarding.css';

const hasTourBeenShown = (tourId: string) => {
  const shownTours = JSON.parse(localStorage.getItem('shownTours')) || [];
  return shownTours.includes(tourId);
};
const markTourAsShown = (tourId: string) => {
  const shownTours = JSON.parse(localStorage.getItem('shownTours')) || [];
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
      return null;
    }

    const pathname = location.pathname;
    const matchingTour = tours.find(tour => tour.route === pathname);

    if (matchingTour) {
      const startTour = () => {
        const tourInstance = new Shepherd.Tour(matchingTour.tourOptions);
        matchingTour.steps.forEach(step => tourInstance.addStep(step));

        const observer = new MutationObserver(() => {
          const firstStepElement = document.querySelector(
            matchingTour.steps[0].attachTo.element as string
          );
          if (firstStepElement) {
            observer.disconnect();
            tourInstance.start();
            markTourAsShown(matchingTour.id);
          }
        });

        if (true) {
          observer.observe(document.body, { childList: true, subtree: true });
          setTimeout(() => observer.disconnect(), 5000);
        }
      };

      startTour();
    }
  }, [Shepherd, tours, location.pathname]);
  return null;
};

export { Onboarding };
