import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';

const Footer = () => {
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (location.pathname.includes('/studylist')) {
      setActiveStep(1);
    } else if (location.pathname.includes('/view')) {
      setActiveStep(2);
    } else if (location.pathname.includes('/nnunet')) {
      setActiveStep(3);
    } else if (location.pathname.includes('/edit')) {
      setActiveStep(4);
    } else if (location.pathname.includes('/selectmask')) {
      setActiveStep(5);
    } else if (location.pathname.includes('/radionics')) {
      setActiveStep(6);
    }
  }, [location.pathname]);

  if (activeStep === 1) return <></>;

  return <footer className="master-footer"></footer>;
};

export default Footer;
