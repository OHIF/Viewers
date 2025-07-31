import { useEffect } from 'react';
import { useLocation } from 'react-router';
import './Onboarding.css';
import { useTour } from '@reactour/tour';

import { hasTourBeenShown, markTourAsShown } from './utilities';

const Onboarding = ({
  tours = [],
}: {
  tours?: Array<{
    id: string;
    route: string;
    tourOptions?: any;
    steps: any;
  }>;
}) => {
  const { setSteps, setIsOpen } = useTour();
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
    if (!matchingTour || hasTourBeenShown(matchingTour.id)) {
      return;
    }

    // Set the steps for the tour
    setSteps(matchingTour.steps);
    
    // Open the tour
    setIsOpen(true);
    
    // Mark the tour as shown
    markTourAsShown(matchingTour.id);
  }, [tours, location.pathname, setSteps, setIsOpen]);

  return null;
};

export { Onboarding };
