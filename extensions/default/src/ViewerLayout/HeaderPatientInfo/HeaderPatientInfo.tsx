import React from 'react';
import usePatientInfo from '../../hooks/usePatientInfo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ohif/ui-next';

export enum PatientInfoVisibility {
  VISIBLE = 'visible',
  VISIBLE_COLLAPSED = 'visibleCollapsed',
  DISABLED = 'disabled',
  VISIBLE_READONLY = 'visibleReadOnly',
}

const buildDemographicItems = (patientInfo: {
  PatientID?: string;
  PatientSex?: string;
  PatientWeight?: string;
  PatientSize?: string;
  PatientAge?: string;
  PatientDOB?: string;
}): React.ReactNode[] => {
  const items: React.ReactNode[] = [];

  if (patientInfo.PatientID) {
    items.push(<span key="id">ID: {patientInfo.PatientID}</span>);
  }
  if (patientInfo.PatientSex) {
    items.push(<span key="sex">{patientInfo.PatientSex}</span>);
  }
  if (patientInfo.PatientWeight) {
    items.push(<span key="weight">{patientInfo.PatientWeight} kg</span>);
  }
  if (patientInfo.PatientSize) {
    items.push(<span key="size">{patientInfo.PatientSize} cm</span>);
  }
  if (patientInfo.PatientAge) {
    const ageNode = patientInfo.PatientDOB ? (
      <Tooltip key="age">
        <TooltipTrigger asChild>
          <span className="cursor-pointer">{patientInfo.PatientAge} ans</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Date de naissance : {patientInfo.PatientDOB}
        </TooltipContent>
      </Tooltip>
    ) : (
      <span key="age">{patientInfo.PatientAge} ans</span>
    );
    items.push(ageNode);
  }

  return items;
};

function HeaderPatientInfo({ appConfig }: withAppTypes) {
  const { patientInfo, isMixedPatients } = usePatientInfo();

  if (isMixedPatients) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-primary text-[13px]">Patients multiples</span>
      </div>
    );
  }

  const studyDatePart = patientInfo.StudyDate ? `(${patientInfo.StudyDate})` : '';
  const fullStudyDescription = (patientInfo.StudyDescription || '').trim();
  const DESCRIPTION_MAX_LEN = 16;
  const isStudyDescriptionTruncated = fullStudyDescription.length > DESCRIPTION_MAX_LEN;
  const displayStudyDescription = isStudyDescriptionTruncated
    ? `${fullStudyDescription.slice(0, DESCRIPTION_MAX_LEN)}...`
    : fullStudyDescription;

  const hasStudySubtitle = Boolean(fullStudyDescription || studyDatePart);

  const demographicItems = buildDemographicItems(patientInfo);

  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex flex-wrap items-baseline gap-x-1.5 font-medium text-[18px] text-[#F9FAFB]">
        {patientInfo.PatientName && <span>{patientInfo.PatientName}</span>}
        {hasStudySubtitle && (
          <>
            {patientInfo.PatientName && <span className="text-[#F9FAFB]">-</span>}
            {fullStudyDescription &&
              (isStudyDescriptionTruncated ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer">{displayStudyDescription}</span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="max-w-md"
                  >
                    {fullStudyDescription}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span>{displayStudyDescription}</span>
              ))}
            {studyDatePart && (
              <span>{fullStudyDescription ? ` ${studyDatePart}` : studyDatePart}</span>
            )}
          </>
        )}
      </div>
      {demographicItems.length > 0 && (
        <div className="font-medium text-[16px] text-[#D1D5DB]">
          {demographicItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && '\u00A0'}
              {item}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default HeaderPatientInfo;
