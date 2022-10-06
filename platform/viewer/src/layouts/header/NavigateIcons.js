import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router';
import classNames from 'classnames';
import cornerstone from 'cornerstone-core';
import { Icon } from '../../../../ui/src/elements/Icon';

const NavigateIcons = () => {
  const history = useHistory();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const handleNext = () => {
    let pathname = null;
    if (activeStep === 1) pathname = location.pathname.replace('view', 'edit');
    else if (activeStep === 2)
      pathname = location.pathname.replace('view', 'nnunet');
    else if (activeStep === 3)
      pathname = location.pathname.replace('nnunet', 'edit');
    else if (activeStep === 4)
      pathname = location.pathname.replace('edit', 'selectmask');
    else if (activeStep === 5) {
      let tool_data = localStorage.getItem('mask');
      tool_data =
        tool_data && tool_data !== 'undefined' ? JSON.parse(tool_data) : {};
      if (tool_data)
        pathname = location.pathname.replace('selectmask', 'radionics');
      else {
        // notify user here
      }
    }
    if (pathname) history.push(pathname);
  };

  const handleBack = () => {
    let pathname = '';
    if (activeStep === 2) pathname = '/studylist';
    else if (activeStep === 3)
      pathname = location.pathname.replace('nnunet', 'view');
    else if (activeStep === 4)
      pathname = location.pathname.replace('edit', 'nnunet');
    else if (activeStep === 5)
      pathname = location.pathname.replace('selectmask', 'edit');
    else if (activeStep === 6) {
      pathname = location.pathname.replace('radionics', 'selectmask');
    }
    if (pathname) history.push(pathname);
  };

  const onCornerstageLoaded = ev => {
    setLoading(false);
  };

  useEffect(() => {
    cornerstone.events.addEventListener(
      cornerstone.EVENTS.ELEMENT_ENABLED,
      onCornerstageLoaded
    );
    return () =>
      cornerstone.events.removeEventListener(
        cornerstone.EVENTS.ELEMENT_ENABLED,
        onCornerstageLoaded
      );
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/studylist')) {
      setActiveStep(1);
    } else if (location.pathname.includes('/view')) {
      setActiveStep(2);
      localStorage.setItem('direction', 'forward');
    } else if (location.pathname.includes('/nnunet')) {
      setActiveStep(3);
      setLoading(false);
    } else if (location.pathname.includes('/edit')) {
      localStorage.setItem('direction', 'back');
      setActiveStep(4);
    } else if (location.pathname.includes('/selectmask')) {
      setActiveStep(5);
    } else if (location.pathname.includes('/radionics')) {
      setActiveStep(6);
    }
  }, [location.pathname]);

  return (
    <footer className="">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            marginRight: '10px',
          }}
          className={classNames('stepper-head-icon2', {
            'nav-opacity': activeStep === 1 || loading,
          })}
        >
          <button
            className="btn"
            style={{
              backgroundColor: 'transparent',
            }}
            disabled={activeStep === 1 || loading}
            onClick={handleBack}
          >
            <Icon name="chevron-back" style={{ fontSize: '16px' }} />
          </button>
        </div>

        <div
          className={classNames('stepper-head-icon2', {
            'nav-opacity': activeStep === 1 || activeStep == 6 || loading,
          })}
        >
          <button
            className="btn"
            style={{
              backgroundColor: 'transparent',
            }}
            disabled={activeStep === 1 || activeStep == 6 || loading}
            onClick={handleNext}
          >
            <Icon name="chevron-forward" style={{ fontSize: '16px' }} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default NavigateIcons;
