import React, { useEffect, useRef, useState } from 'react';

import mixpanel from 'mixpanel-browser';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import JoditEditor from 'jodit-react';
import DOMPurify from 'dompurify';

import { useToast } from '@xylexa/xylexa-app';
import { config } from './config/config';
import { Appbar, ExitConfirmationModal } from './components';
import { getHeader, getFooter, getBody } from './helpers';
import { templates, templateModalities } from './templates/templates';
import { useXylexaAppContext, useAuthenticationContext } from './../context';
import { useSubmitStudyReport } from '../api-client';
import { MrmcMmgReportForm } from './forms/MrmcMmgReportForm';
import useGetQueryParams from '../hooks/useGetQueryParams';

export const AddReport = () => {
  const editor = useRef(null);
  const [isNew, setIsNew] = useState<boolean>(true);
  const [isAIReportPreview, setIsAIReportPreview] = useState<boolean>(false);
  const [flag, setFlag] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newReportContent, setNewReportContent] = useState<string>('');
  const { userInfo } = useAuthenticationContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    selectedTemplate,
    setSelectedTemplate,
    setSelectedModality,
    selectedStudy,
    setIsNewReport,
    isInsideViewer,
  } = useXylexaAppContext();

  const [changeInReportDetected, setChangeInReportDetected] = useState<boolean>(false);

  const [modalityParams, studyInstanceIdParams] = useGetQueryParams(window.location.search, [
    'modality',
    'studyInstanceId',
  ]);

  useEffect(() => {
    performance.mark('add-report-mounted');
    return () => {
      performance.mark('add-report-unmounted');
      performance.measure('add-report-timespend', 'add-report-mounted', 'add-report-unmounted');
      const timeTaken = (
        performance.getEntriesByName('add-report-timespend')[0].duration / 1000
      ).toFixed(2);
      mixpanel.track('Create Report (Time)', {
        pageUrl: window.location.href,
        page_name: 'Add Report',
        userId: userInfo?.sub,
        studyId: studyInstanceIdParams,
        pageViewDuration: timeTaken,
        username: userInfo?.name,
      });
    };
  }, [studyInstanceIdParams, userInfo?.sub, userInfo?.name]);

  const { mutate: handleSubmitReport } = useSubmitStudyReport();

  useEffect(() => {
    setNewReportContent(
      `${getHeader(selectedStudy, '')}<br/>${getBody(modalityParams, selectedTemplate?.id)}${getFooter(userInfo)}`
    );
  }, [modalityParams, selectedStudy, selectedTemplate?.id, userInfo]);

  useEffect(() => {
    const handleUnload = e => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave this page?';
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);
  // Report Submission
  const handleSubmit = () => {
    const sanitizedDescription = DOMPurify.sanitize(newReportContent);
    const body = {
      study_id: studyInstanceIdParams,
      patient_id: selectedStudy.mrn,
      patient_name: selectedStudy.patientName,
      description: sanitizedDescription,
    };

    handleSubmitReport(body, {
      onSuccess: () => {
        setChangeInReportDetected(false);
        setIsNewReport(false);
        setSelectedTemplate('');
        setSelectedModality('Default');
        showToast({
          content: 'Report Submitted',
          type: 'success',
        });
        navigate(
          `/report/view-report/?modality=${modalityParams}&studyInstanceId=${studyInstanceIdParams}`
        );
      },
      onError() {
        showToast({
          content: 'Report Submission Failed',
          type: 'error',
        });
      },
    });
  };
  // Handle report submisison on clicking Yes, in confirmation dialogue
  const discardChanges = () => {
    setSelectedTemplate('');
    setSelectedModality('Default');
    setChangeInReportDetected(false);
    setIsNewReport(false);
    if (isInsideViewer) {
      navigate(`/viewer?StudyInstanceUIDs=${selectedStudy?.studyInstanceUid}`);
      return;
    } else {
      navigate('/');
      return;
    }
  };
  // Confirmation Dialogue

  function handleBack() {
    if (changeInReportDetected) {
      setShowModal(true);
      return;
    }
    discardChanges();
  }

  return (
    <div className="min-h-screen bg-white">
      <Appbar
        flag={flag}
        setFlag={setFlag}
        isNew={isNew}
        setIsNew={setIsNew}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        templateOptions={templates[modalityParams]}
        templateModalities={templateModalities}
        signatures={[]}
        selectedModality={modalityParams}
        setSelectedModality={setSelectedModality}
        handleBack={handleBack}
        handleSubmit={handleSubmit}
        isAIReportPreview={isAIReportPreview}
        setIsAIReportPreview={setIsAIReportPreview}
        changeInReportDetected={changeInReportDetected}
      />

      {modalityParams === 'MG' ? (
        <div
          style={{
            marginTop: '100px',
            marginLeft: 'auto',
            marginRight: 'auto',
            backgroundColor: 'black',
          }}
        >
          <MrmcMmgReportForm setChangeInReportDetected={setChangeInReportDetected} />
        </div>
      ) : (
        <div style={{ marginTop: '80px', width: '60%', marginLeft: 'auto', marginRight: 'auto' }}>
          <JoditEditor
            ref={editor}
            value={newReportContent}
            config={config}
            onChange={newContent => {
              setChangeInReportDetected(true);
              setNewReportContent(newContent);
            }}
          />
        </div>
      )}
      {showModal &&
        createPortal(
          <ExitConfirmationModal
            setShowModal={setShowModal}
            discardChanges={discardChanges}
            header={'You have unsaved changes!'}
            body={'If you choose No, the content will be deleted permanently.'}
          />,
          document.body,
          'ExitConfirmationModal'
        )}
    </div>
  );
};
export default AddReport;
