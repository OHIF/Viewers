import React, { useContext, ReactNode, useState } from 'react';
import useSecureLocalStorage from 'secure-local-storage-hook';
import { FILTERED_LIST_KEY } from '../constants';

export type SelectedTemplate = {
  id: number | string;
  label: string;
  value: string;
  tech: string;
  body: string;
};
export type SelectedModality = string;
export type ChangeInReportDetected = true | false;
export type IsInsideViewer = boolean;
export type SelectedStudy = {
  studyInstanceUid: string;
  date: string;
  time: string;
  accession: string;
  mrn: string;
  patientName: string;
  instances: number;
  description: string;
  modalities: string;
};

export type Study = {
  studyInstanceUid: string;
  date: string;
  time: string;
  accession: string;
  mrn: string;
  patientName: string;
  referringPhysicianName: string[] | string;
  instances: number;
  description: string;
  modalities: string;
};

export type IsNewReport = true | false;
export type annotationDataArray = [];
export type GetStudyReportKey = string;
export type IsChangeInAnnotationViewPort = boolean;
export type Studies = Study[];

export type XylexaAppContextType = {
  selectedTemplate: SelectedTemplate;
  setSelectedTemplate?: (selectedTemplate: SelectedTemplate) => void;
  selectedModality: SelectedModality;
  setSelectedModality?: (selectedModality: SelectedModality) => void;
  selectedStudy: SelectedStudy;
  setSelectedStudy?: (selectedStudy: SelectedStudy) => void;
  isNewReport: IsNewReport;
  setIsNewReport?: (isNewReport: IsNewReport) => void;
  annotationDataArray: annotationDataArray;
  setAnnotationDataArray?: (annotationDataArray: annotationDataArray) => void;
  isInsideViewer: IsInsideViewer;
  setIsInsideViewer?: (isInsideViewer: IsInsideViewer) => void;
  getStudyReportKey: GetStudyReportKey;
  setGetStudyReportKey?: (getStudyReportKey: GetStudyReportKey) => void;
  isChangeInAnnotationViewPort: IsChangeInAnnotationViewPort;
  setIsChangeInAnnotationViewPort?: (
    isChangeInAnnotationViewPort: IsChangeInAnnotationViewPort
  ) => void;

  filteredList: Studies;
  setFilteredList?: (filteredList: Studies) => void;
};

const XylexaAppContext = React.createContext<XylexaAppContextType>({
  selectedTemplate: null,
  selectedModality: 'Default',
  selectedStudy: null,
  isNewReport: false,
  annotationDataArray: [],
  isInsideViewer: false,
  getStudyReportKey: '',
  isChangeInAnnotationViewPort: false,
  filteredList: [],
});

export const XylexaAppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate>(null);
  const [selectedModality, setSelectedModality] = useState<SelectedModality>('Default');
  const [selectedStudy, setSelectedStudy] = useState<SelectedStudy>(null);
  const [isNewReport, setIsNewReport] = useState<IsNewReport>(false);
  const [annotationDataArray, setAnnotationDataArray] = useState<annotationDataArray>([]);
  const [isInsideViewer, setIsInsideViewer] = useState<boolean>(false);
  const [getStudyReportKey, setGetStudyReportKey] = useState<string>('');
  const [isChangeInAnnotationViewPort, setIsChangeInAnnotationViewPort] = useState(false);
  const [filteredList, setFilteredList] = useSecureLocalStorage<Studies>(FILTERED_LIST_KEY, []);

  return (
    <XylexaAppContext.Provider
      value={{
        selectedTemplate,
        setSelectedTemplate,
        selectedModality,
        setSelectedModality,
        selectedStudy,
        setSelectedStudy,
        isNewReport,
        setIsNewReport,
        annotationDataArray,
        setAnnotationDataArray,
        isInsideViewer,
        setIsInsideViewer,
        getStudyReportKey,
        setGetStudyReportKey,
        isChangeInAnnotationViewPort,
        setIsChangeInAnnotationViewPort,
        filteredList,
        setFilteredList,
      }}
    >
      {children}
    </XylexaAppContext.Provider>
  );
};

export function useXylexaAppContext() {
  const context = useContext(XylexaAppContext);
  if (!context) {
    throw new Error('useXylexaAppContext must be used within a XylexaAppContextProvider');
  }
  return context;
}
