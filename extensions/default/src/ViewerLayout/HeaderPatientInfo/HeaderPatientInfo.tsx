import React, { useState, useEffect } from 'react';
import usePatientInfo from '../../hooks/usePatientInfo';
import { Icons } from '@ohif/ui-next';

export enum PatientInfoVisibility {
  VISIBLE = 'visible',
  VISIBLE_COLLAPSED = 'visibleCollapsed',
  DISABLED = 'disabled',
  VISIBLE_READONLY = 'visibleReadOnly',
}

const formatWithEllipsis = (str, maxLength) => {
  if (str?.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
};

function HeaderPatientInfo({ servicesManager, appConfig }: withAppTypes) {
  const initialExpandedState =
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE ||
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE_READONLY;
  const [expanded, setExpanded] = useState(initialExpandedState);
  const { patientInfo, isMixedPatients } = usePatientInfo(servicesManager);

  useEffect(() => {
    if (isMixedPatients && expanded) {
      setExpanded(false);
    }
  }, [isMixedPatients, expanded]);

  const handleOnClick = () => {
    if (!isMixedPatients && appConfig.showPatientInfo !== PatientInfoVisibility.VISIBLE_READONLY) {
      setExpanded(!expanded);
    }
  };

  const formattedPatientName = formatWithEllipsis(patientInfo.PatientName, 27);
  const formattedPatientID = formatWithEllipsis(patientInfo.PatientID, 15);

  return (
    <div
      className="hover:bg-primary-dark flex cursor-pointer items-center justify-center gap-1 rounded-lg"
      onClick={handleOnClick}
    >
      {isMixedPatients ? (
        <Icons.MultiplePatients className="text-primary" />
      ) : (
        <Icons.Patient className="text-primary" />
      )}
      <div className="flex flex-col justify-center">
        {expanded ? (
          <>
            <div className="self-start text-[13px] font-bold text-white">
              {formattedPatientName}
            </div>
            <div className="text-aqua-pale flex gap-2 text-[11px]">
              <div>{formattedPatientID}</div>
              <div>{patientInfo.PatientSex}</div>
              <div>{patientInfo.PatientDOB}</div>
            </div>
          </>
        ) : (
          <div className="text-primary self-center text-[13px]">
            {isMixedPatients ? 'Multiple Patients' : 'Patient'}
          </div>
        )}
      </div>
      <Icons.ArrowLeft className={`text-primary ${expanded ? 'rotate-180' : ''}`} />
    </div>
  );
}

export default HeaderPatientInfo;
