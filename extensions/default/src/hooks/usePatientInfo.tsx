import { useState, useEffect } from 'react';
import moment from 'moment';
import { utils, useSystem } from '@ohif/core';

const { formatPN, formatDate } = utils;

const SEX_MAP: Record<string, string> = { M: 'Homme', F: 'Femme', O: 'Autre' };

const calculateAge = (birthDate: string, studyDate: string): string | null => {
  if (!birthDate) {
    return null;
  }
  const birth = moment(birthDate, 'YYYYMMDD', true);
  if (!birth.isValid()) {
    return null;
  }
  const ref = studyDate ? moment(studyDate, 'YYYYMMDD', true) : moment();
  const age = (ref.isValid() ? ref : moment()).diff(birth, 'years');
  return String(age);
};

function usePatientInfo() {
  const { servicesManager } = useSystem();
  const { displaySetService } = servicesManager.services;

  const [patientInfo, setPatientInfo] = useState({
    PatientName: '',
    PatientID: '',
    PatientSex: '',
    PatientDOB: '',
    PatientAge: '',
    PatientWeight: '',
    PatientSize: '',
    StudyDate: '',
    StudyDescription: '',
  });
  const [isMixedPatients, setIsMixedPatients] = useState(false);

  const checkMixedPatients = (PatientID: string) => {
    const displaySets = displaySetService.getActiveDisplaySets();
    let isMixedPatients = false;
    displaySets.forEach(displaySet => {
      const instance = displaySet?.instances?.[0] || displaySet?.instance;
      if (!instance) {
        return;
      }
      if (instance.PatientID !== PatientID) {
        isMixedPatients = true;
      }
    });
    setIsMixedPatients(isMixedPatients);
  };

  const updatePatientInfo = ({ displaySetsAdded }) => {
    if (!displaySetsAdded.length) {
      return;
    }
    const displaySet = displaySetsAdded[0];
    const instance = displaySet?.instances?.[0] || displaySet?.instance;
    if (!instance) {
      return;
    }

    const weightRaw = instance.PatientWeight;
    const sizeRaw = instance.PatientSize;

    setPatientInfo({
      PatientID: instance.PatientID || null,
      PatientName: instance.PatientName ? formatPN(instance.PatientName) : null,
      PatientSex: SEX_MAP[instance.PatientSex] ?? instance.PatientSex ?? null,
      PatientDOB: formatDate(instance.PatientBirthDate, 'DD/MM/YYYY') || null,
      PatientAge: calculateAge(instance.PatientBirthDate, instance.StudyDate),
      PatientWeight: weightRaw ? `${Math.round(parseFloat(weightRaw))}` : null,
      PatientSize: sizeRaw ? `${Math.round(parseFloat(sizeRaw) * 100)}` : null,
      StudyDate: instance.StudyDate ? formatDate(instance.StudyDate, 'DD/MM/YYYY') : null,
      StudyDescription: instance.StudyDescription || null,
    });
    checkMixedPatients(instance.PatientID || null);
  };

  useEffect(() => {
    const subscription = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      props => updatePatientInfo(props)
    );
    return () => subscription.unsubscribe();
  }, []);

  return { patientInfo, isMixedPatients };
}

export default usePatientInfo;
