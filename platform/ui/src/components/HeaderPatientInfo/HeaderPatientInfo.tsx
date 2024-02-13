import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import { utils } from '@ohif/core';
import { useAppConfig } from '@state';

const { formatDate, formatPN } = utils;

function usePatientInfo(servicesManager) {
  const [patientInfo, setPatientInfo] = useState({
    PatientName: '',
    PatientID: '',
    PatientSex: '',
    PatientAge: '',
    PatientDOB: '',
  });
  const [isMixedPatients, setIsMixedPatients] = useState(false);

  const { displaySetService, viewportGridService, cornerstoneViewportService } =
    servicesManager.services;

  const { activeViewportId, viewports } = viewportGridService.getState();

  const checkMixedPatients = activeViewportPatientID => {
    const { viewports } = viewportGridService.getState();
    let isMixedPatients = false;
    viewports.forEach(viewport => {
      const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
      if (!displaySetInstanceUID) {
        return;
      }
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
      const instance = displaySet?.instances?.[0] || displaySet?.instance;
      if (!instance) {
        return;
      }

      if (instance && instance.PatientID !== activeViewportPatientID) {
        isMixedPatients = true;
      }
    });
    setIsMixedPatients(isMixedPatients);
  };

  const updatePatientInfo = (viewportId = null) => {
    const state = viewportGridService.getState();
    const activeViewportId = viewportId || state.activeViewportId;
    const activeViewport = state.viewports.get(activeViewportId);
    const displaySetInstanceUID = activeViewport?.displaySetInstanceUIDs[0];

    if (!displaySetInstanceUID) {
      return;
    }
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
    const instance = displaySet?.instances?.[0] || displaySet?.instance;

    if (!instance) {
      return;
    }

    setPatientInfo({
      PatientID: instance.PatientID || '',
      PatientName: instance.PatientName ? formatPN(instance.PatientName.Alphabetic) : '',
      PatientSex: instance.PatientSex || '',
      PatientAge: instance.PatientAge || '',
      PatientDOB: formatDate(instance.PatientBirthDate) || '',
    });

    checkMixedPatients(instance.PatientID || '');
  };

  useEffect(() => {
    const subscriptions = [
      viewportGridService.subscribe(
        viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
        event => updatePatientInfo(event.viewportId) // Update the toolbar when the active viewport changes
      ).unsubscribe,
      cornerstoneViewportService.subscribe(
        cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
        () => updatePatientInfo() // Update the toolbar when the viewport data changes
      ).unsubscribe,
    ];

    return () => subscriptions.forEach(unsubscribe => unsubscribe());
  }, []);

  // Initial update
  useEffect(() => {
    updatePatientInfo();
  }, [activeViewportId, viewports]);

  return { patientInfo, isMixedPatients };
}

function HeaderPatientInfo({ servicesManager }) {
  const [appConfig] = useAppConfig();
  const initialExpandedState = appConfig.showPatientInfo === 'visible';
  const [expanded, setExpanded] = useState(initialExpandedState);
  const { patientInfo, isMixedPatients } = usePatientInfo(servicesManager);

  return (
    <div
      className="align-items-center hover:bg-primary-dark flex cursor-pointer justify-center gap-1 rounded-lg"
      onClick={() => setExpanded(!expanded)}
    >
      <Icon
        name="icon-patient"
        className="text-primary-active"
      />
      <div className="flex flex-col justify-center">
        {expanded ? (
          <>
            {isMixedPatients ? (
              <div className="align-center flex gap-2">
                <Icon
                  name="status-alert-warning"
                  width="10px"
                  height="20px"
                ></Icon>
                <div className="self-start text-[13px] font-bold text-white">Multiple Patients</div>
              </div>
            ) : (
              <>
                <div className="self-start text-[13px] font-bold text-white">
                  {patientInfo.PatientName}
                </div>
                <div className="text-aqua-pale flex gap-2 text-[11px]">
                  <div>{patientInfo.PatientID}</div>
                  <div>{patientInfo.PatientSex}</div>
                  <div>{patientInfo.PatientDOB}</div>
                  <div>{patientInfo.PatientAge}</div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-primary-active self-center text-[13px]">Patient</div>
        )}
      </div>
      <Icon
        name="icon-chevron-patient"
        className={`text-primary-active ${expanded ? 'rotate-180' : ''}`}
      />
    </div>
  );
}

HeaderPatientInfo.propTypes = {
  servicesManager: PropTypes.object.isRequired,
};

export default HeaderPatientInfo;
