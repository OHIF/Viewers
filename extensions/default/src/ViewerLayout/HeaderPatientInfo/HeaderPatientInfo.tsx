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
}): string => {
  const parts: string[] = [];
  if (patientInfo.PatientID) {
    parts.push(`ID: ${patientInfo.PatientID}`);
  }
  if (patientInfo.PatientSex) {
    parts.push(patientInfo.PatientSex);
  }
  if (patientInfo.PatientWeight) {
    parts.push(`${patientInfo.PatientWeight} kg`);
  }
  if (patientInfo.PatientSize) {
    parts.push(`${patientInfo.PatientSize} cm`);
  }
  if (patientInfo.PatientAge) {
    parts.push(`${patientInfo.PatientAge} ans`);
  }
  return parts.join(' | ');
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

  const demographicLine = buildDemographicItems(patientInfo);

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
                    <span className="cursor-default">{displayStudyDescription}</span>
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
      {demographicLine && (
        <div className="font-medium text-[16px] text-[#D1D5DB]">{demographicLine}</div>
      )}
    </div>
  );
}

export default HeaderPatientInfo;
