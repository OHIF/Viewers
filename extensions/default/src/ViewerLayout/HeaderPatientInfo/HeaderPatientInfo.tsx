import React, { useState, useEffect } from 'react';
import { useSystem } from '@ohif/core';
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

function PatientInfo({ showPatientInfo }) {
  const initialExpandedState =
    showPatientInfo === PatientInfoVisibility.VISIBLE ||
    showPatientInfo === PatientInfoVisibility.VISIBLE_READONLY;
  const [expanded, setExpanded] = useState(initialExpandedState);
  const { patientInfo, isMixedPatients } = usePatientInfo();

  useEffect(() => {
    if (isMixedPatients && expanded) {
      setExpanded(false);
    }
  }, [isMixedPatients, expanded]);

  const handleOnClick = () => {
    if (!isMixedPatients && showPatientInfo !== PatientInfoVisibility.VISIBLE_READONLY) {
      setExpanded(!expanded);
    }
  };

  const formattedPatientName = formatWithEllipsis(patientInfo.PatientName, 27);
  const formattedPatientID = formatWithEllipsis(patientInfo.PatientID, 15);

  return (
    <div
      className="hover:bg-muted flex cursor-pointer items-center justify-center gap-1 rounded-lg"
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
            <div className="text-foreground self-start text-[13px] font-bold">
              {formattedPatientName}
            </div>
            <div className="text-muted-foreground flex gap-2 text-[11px]">
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

/**
 * Patient name/ID/sex/DOB, shipped as one of the `ohif.headerRightSide` items.
 * Like every item in that list it takes no props, and it renders nothing when
 * `showPatientInfo` is `disabled` — the header slot collapses with it.
 *
 * The visibility check lives out here rather than inside `PatientInfo` so that
 * `disabled` never mounts the body: `usePatientInfo` subscribes to display set
 * events and recomputes on every batch, which is wasted work when the result is
 * always `null`.
 */
function HeaderPatientInfo() {
  const { extensionManager } = useSystem();
  const { showPatientInfo } = extensionManager.appConfig;

  if (showPatientInfo === PatientInfoVisibility.DISABLED) {
    return null;
  }

  return <PatientInfo showPatientInfo={showPatientInfo} />;
}

export default HeaderPatientInfo;
