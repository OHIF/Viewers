import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

import OHIF, { utils } from '@ohif/core';

const { formatDate } = utils;

function HeaderPatientInfo({ servicesManager }) {
  const [expanded, setExpanded] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    PatientName: '',
    PatientID: '',
    PatientSex: '',
    PatientAge: '',
    PatientDOB: '',
  });

  const { viewportGridService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;

  const updatePatientInfo = () => {
    const { activeViewportId, viewports } = viewportGridService.getState();
    const activeViewport = viewports.get(activeViewportId);
    const displaySetInstanceUID = activeViewport?.displaySetInstanceUIDs[0];
    if (!displaySetInstanceUID) {
      return;
    }
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
    const image0 = displaySet.images[0];
    const newPatientInfo = {
      PatientID: image0?.PatientID || '',
      PatientName: image0?.PatientName ? OHIF.utils.formatPN(image0.PatientName.Alphabetic) : '',
      PatientSex: image0?.PatientSex || '',
      PatientAge: image0?.PatientAge || '',
      PatientDOB: formatDate(image0?.PatientBirthDate) || '',
    };
    setPatientInfo(newPatientInfo);
  };

  useEffect(() => {
    const { unsubscribe } = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      updatePatientInfo
    );

    updatePatientInfo();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div
      className="align-items-center hover:bg-primary-dark flex cursor-pointer justify-center gap-1 rounded-lg"
      onClick={() => {
        setExpanded(!expanded);
      }}
    >
      <div className="flex items-center justify-center">
        <Icon
          name="icon-patient"
          className="text-primary-active"
        />
      </div>
      <div className="flex flex-col justify-center">
        {expanded ? (
          <div className=" self-start text-[13px] font-bold text-white	">
            {patientInfo.PatientName}
          </div>
        ) : (
          <div className="text-primary-active self-center text-[13px]">Patient</div>
        )}
        {expanded && (
          <div className="text-aqua-pale flex gap-2 text-[11px]">
            <div>{patientInfo.PatientID}</div>
            <div>{patientInfo.PatientSex} </div>
            <div> {patientInfo.PatientDOB}</div>
            <div> {`(${patientInfo.PatientAge})`}</div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center">
        <Icon
          name="icon-chevron-patient"
          className={`text-primary-active ${expanded ? 'rotate-180' : ''}`}
        />
      </div>
    </div>
  );
}

export default HeaderPatientInfo;

HeaderPatientInfo.propTypes = {
  servicesManager: PropTypes.object,
};
