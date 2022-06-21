import './ImportIdc.styl';

import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { servicesManager } from '../App.js';
import Patients from './Patients';
import Collections from './Collections';

const steps = [
  {
    index: 0,
  },
  {
    index: 1,
  },
];

function ImportIdc(props) {
  const { handleOnSuccess } = props;
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});
  const [selectedCollection, setSelectedCollection] = useState(null);

  const totalSteps = () => {
    return steps.length;
  };

  const completedSteps = () => {
    return Object.keys(completed).length;
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const handleNext = () => {
    if (isLastStep()) {
      return;
    } else {
      const newActiveStep = activeStep + 1;
      setActiveStep(newActiveStep);
    }
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleSetCollection = CollectionID => {
    setSelectedCollection(CollectionID);
    handleNext();
  };

  let Breadcrumbs = (
    <div className="steps-breakdown">
      <span>Select a Collection </span>
    </div>
  );

  if (activeStep > 0) {
    Breadcrumbs = (
      <div className="steps-breakdown">
        <span onClick={handleBack}>Select a Collection </span>
        {selectedCollection && (
          <span> -> Collection ( {selectedCollection})</span>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          padding: '2px',
        }}
      >
        {Breadcrumbs}
      </div>
      <div className="page">
        {activeStep === 0 && <Collections onSelected={handleSetCollection} />}
        {activeStep === 1 && (
          <Patients
            collection_api_id={selectedCollection}
            handleOnSuccess={handleOnSuccess}
          />
        )}
      </div>

      {activeStep > 0 && (
        <div className="footer">
          <button
            className="btn btn-danger pull-left"
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            back
          </button>
        </div>
      )}
    </div>
  );
}

function ImportIdcModal({ isOpen = false, onClose, onSuccess, t }) {
  const { UIModalService, UINotificationService } = servicesManager.services;

  const ShowModal = () => {
    if (!UIModalService) {
      return;
    }

    const handleOnSuccess = () => {
      UINotificationService.show({
        title: 'Import IDC successfully ',
        message: '',
        type: 'info',
      });

      // Force auto close
      onSuccess(UIModalService);
    };

    UIModalService.show({
      title: t('Import-Idc'),
      content: ImportIdc,
      contentProps: {
        handleOnSuccess,
      },
      onClose,
    });
  };

  return <React.Fragment>{isOpen && ShowModal()}</React.Fragment>;
}

ImportIdcModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};

export default withTranslation('Common')(ImportIdcModal);
