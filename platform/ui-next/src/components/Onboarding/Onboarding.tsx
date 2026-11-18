import { useEffect } from 'react';
import Shepherd, { StepOptions, TourOptions } from 'shepherd.js';
import { useLocation } from 'react-router';
import 'shepherd.js/dist/css/shepherd.css';
import './Onboarding.css';

import {
  defaultShowHandler,
  localStorageTourPersistence,
  middleware,
  type TourPersistence,
} from './utilities';

const Onboarding = ({
  tours = [],
  persistence,
}: {
  tours?: Array<{
    id: string;
    route: string;
    tourOptions: TourOptions;
    steps: StepOptions[];
  }>;
  /**
   * Where "this tour was shown" is read and written. Defaults to the
   * browser's localStorage; pass e.g. a server-backed store to show a tour
   * once per user across browsers and devices (`ohif.tourPersistence`).
   */
  persistence?: TourPersistence;
}) => {
  const location = useLocation();

  /**
   * Show the tour if it hasn't been shown yet based on the current route.
   * Constructs a tour instance and adds steps to it based on the matching tour.
   */
  useEffect(() => {
    if (!tours.length) {
      return;
    }

    const matchingTour = tours.find(tour => tour.route === location.pathname);
    if (!matchingTour) {
      return;
    }

    const store = persistence ?? localStorageTourPersistence;
    let cancelled = false;

    const startTour = () => {
      const tourInstance = new Shepherd.Tour({
        ...matchingTour.tourOptions,
        defaultStepOptions: {
          ...matchingTour.tourOptions?.defaultStepOptions,
          floatingUIOptions: matchingTour.tourOptions?.defaultStepOptions?.floatingUIOptions || {
            middleware,
          },
          when: {
            ...matchingTour.tourOptions?.defaultStepOptions?.when,
            show:
              matchingTour.tourOptions?.defaultStepOptions?.when?.show ||
              (() => defaultShowHandler(Shepherd)),
          },
        },
      });
      matchingTour.steps.forEach(step => tourInstance.addStep(step));
      // Recorded when the user actually sees the first step, not when the
      // tour is created (a step can wait for its element or be cancelled).
      tourInstance.once('show', () => {
        Promise.resolve()
          .then(() => store.markShown(matchingTour.id))
          .catch(error => console.warn('Onboarding: could not record the tour as shown', error));
      });
      tourInstance.start();
    };

    Promise.resolve()
      .then(() => store.hasBeenShown(matchingTour.id))
      .then(
        shown => {
          if (!shown && !cancelled) {
            startTour();
          }
        },
        error => console.warn('Onboarding: could not read whether the tour was shown', error)
      );

    return () => {
      cancelled = true;
    };
  }, [tours, persistence, location.pathname]);

  return null;
};

export { Onboarding };
