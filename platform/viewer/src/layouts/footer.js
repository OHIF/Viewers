import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router';

const Footer = () => {
  const user = useSelector(state => state.oidc.user);
  const history = useHistory();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(1);

  const handleNext = () => {
    let pathname = '';
    if (activeStep === 1) pathname = location.pathname.replace('view', 'edit');
    else if (activeStep === 2)
      pathname = location.pathname.replace('view', 'nnunet');
    else if (activeStep === 3)
      pathname = location.pathname.replace('nnunet', 'edit');
    else if (activeStep === 4)
      pathname = location.pathname.replace('edit', 'selectmask');
    else if (activeStep === 5)
      pathname = location.pathname.replace('selectmask', 'radionics');

    history.push(pathname);
  };

  const handleBack = () => {
    let pathname = '';
    if (activeStep === 2 || activeStep == 3) pathname = '/studylist';
    else if (activeStep === 4)
      pathname = location.pathname.replace('edit', 'view');
    else if (activeStep === 5)
      pathname = location.pathname.replace('radionics', 'edit');
    history.push(pathname);
  };

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

  return (
    <footer className="master-footer">
      {/* <div>
        {activeStep > 1 && (
          <button
            className="btn btn-danger pull-left"
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            {activeStep === 2 || activeStep === 3
              ? 'Back to Study List'
              : 'Back '}
          </button>
        )}
      </div> */}

      {/* <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {activeStep > 1 && activeStep < 5 && (
          <button
            style={{
              marginLeft: '10px',
            }}
            className="btn btn-primary pull-left"
            disabled={activeStep === 0}
            onClick={handleNext}
          >
            next
          </button>
        )}
      </div> */}
    </footer>
  );
};

export default Footer;
