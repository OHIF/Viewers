import React, { useContext, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import classNames from 'classnames';
import cornerstone from 'cornerstone-core';
import { Icon } from '../../../../ui/src/elements/Icon';
import { servicesManager } from '../../App';
import ReactTooltip from 'react-tooltip';
import { JobsContext } from '../../context/JobsContext';
import { BrainMode, lungMode } from '../../utils/constants';
import { useSelector } from 'react-redux';

const NavigateIcons = () => {
  const { UINotificationService } = servicesManager.services;
  const { active: currentMode } = useSelector(state => state && state.mode);
  const { isloading } = useContext(JobsContext);
  const history = useHistory();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const isBrainMode = currentMode == BrainMode;

  const selectMaskStep = isBrainMode ? 5 : 3;
  const handleNext = () => {
    const paths =
      currentMode == BrainMode
        ? {
            1: 'edit',
            2: 'nnunet',
            3: 'edit',
            4: 'selectmask',
          }
        : {
            1: 'viewer',
            2: 'selectmask', // if active is viewer goto select mask 
          };

    if (activeStep === selectMaskStep) {
      const toolData = JSON.parse(localStorage.getItem('mask') || '{}');

      if (toolData) {
        history.push(location.pathname.replace('selectmask', 'radionics'));
      } else {
        UINotificationService.show({
          title: 'Draw mask region to proceed to Radiomics',
          type: 'error',
          autoClose: true,
        });
      }
    } else {
      const newPathname = location.pathname.replace(
        /(view|edit|nnunet|selectmask)/,
        paths[activeStep]
      );
      history.push(newPathname);
    }
  };

  const handleBack = () => {
    const paths =
      currentMode == BrainMode
        ? {
            2: 'studylist',
            3: 'view',
            4: 'nnunet',
            5: 'edit',
            6: 'selectmask',
          }
        : {
            2: 'studylist',
            3: 'view',
            4: 'selectmask',
          };

    const newPathname = location.pathname.replace(
      /(view|edit|nnunet|selectmask|radionics)/,
      paths[activeStep]
    );
    history.push(newPathname);
  };

  const onCornerstoneLoaded = () => setLoading(false);

  useEffect(() => {
    cornerstone.events.addEventListener(
      cornerstone.EVENTS.ELEMENT_ENABLED,
      onCornerstoneLoaded
    );
    return () =>
      cornerstone.events.removeEventListener(
        cornerstone.EVENTS.ELEMENT_ENABLED,
        onCornerstoneLoaded
      );
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/studylist')) {
      setActiveStep(1);
    } else if (location.pathname.includes('/view')) {
      setActiveStep(2);
      localStorage.setItem('direction', 'forward');
    } else if (location.pathname.includes('/nnunet') && isBrainMode) {
      setActiveStep(3);
      setLoading(false);
    } else if (location.pathname.includes('/edit') && isBrainMode) {
      localStorage.setItem('direction', 'back');
      setActiveStep(4);
    } else if (location.pathname.includes('/selectmask')) {
      if (isBrainMode) setActiveStep(5);
      else setActiveStep(3);
    } else if (location.pathname.includes('/radionics')) {
      if (isBrainMode) setActiveStep(6);
      else setActiveStep(4);
    }
  }, [location.pathname]);

  const isForNavigationDisabled =
    [1].includes(activeStep) || loading || isloading;

  const isBackNavigationDisabled =
    [isBrainMode ? 6 : 4].includes(activeStep) || loading || isloading;

  return (
    <footer className="">
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div
          style={{ marginRight: '10px' }}
          className={classNames('stepper-head-icon2', {
            'nav-opacity': isForNavigationDisabled,
          })}
        >
          <button
            data-tip
            data-for="back"
            className="btn"
            style={{ backgroundColor: 'transparent' }}
            disabled={isForNavigationDisabled}
            onClick={handleBack}
          >
            <ReactTooltip id={`back`} delayShow={250} border={true}>
              <span>Back</span>
            </ReactTooltip>
            <Icon name="chevron-back" style={{ fontSize: '16px' }} />
          </button>
        </div>

        <div
          className={classNames('stepper-head-icon2', {
            'nav-opacity': isBackNavigationDisabled,
          })}
        >
          <button
            data-tip
            data-for={`forward`}
            className="btn"
            style={{
              backgroundColor: 'transparent',
            }}
            disabled={isBackNavigationDisabled}
            onClick={handleNext}
          >
            <ReactTooltip id={`forward`} delayShow={250} border={true}>
              <span>Forward</span>
            </ReactTooltip>
            <Icon name="chevron-forward" style={{ fontSize: '16px' }} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default NavigateIcons;
