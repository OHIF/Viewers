import React, { useEffect, useRef, useState } from 'react';

import DOMPurify from 'dompurify';
import mixpanel from 'mixpanel-browser';

import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { config } from './config/config';
import JoditEditor from 'jodit-react';

import { LoadingIndicatorProgress } from '@ohif/ui';
import { Appbar, ExitConfirmationModal } from './components';
import { templates, templateModalities } from './templates/templates';
import { useAuthenticationContext, useXylexaAppContext } from './../context';
import { useToast } from '../hooks';
import { useGetStudyReport, useUpdateStudyReport } from '../api-client';
import useGetQueryParams from '../hooks/useGetQueryParams';
import { MrmcMmgReportForm } from './forms/MrmcMmgReportForm';

export const EditReport = () => {
  const editor = useRef(null);

  const { userInfo } = useAuthenticationContext();
  const {
    selectedTemplate,
    setSelectedTemplate,
    setSelectedModality,
    setIsNewReport,
    getStudyReportKey,
    isInsideViewer,
  } = useXylexaAppContext();

  const [changeInReportDetected, setChangeInReportDetected] = useState(false);

  const [studyInstanceIdParams, modalityParams] = useGetQueryParams(window.location.search, [
    'studyInstanceId',
    'modality',
  ]);

  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    performance.mark('edit-report-mounted');
    return () => {
      performance.mark('edit-report-unmounted');
      performance.measure('edit-report-timespend', 'edit-report-mounted', 'edit-report-unmounted');
      const timeTaken = (
        performance.getEntriesByName('edit-report-timespend')[0].duration / 1000
      ).toFixed(2);

      mixpanel.track('Update Report (Time)', {
        pageUrl: window.location.href,
        page_name: 'Edit Report',
        userId: userInfo?.sub,
        studyId: studyInstanceIdParams,
        pageViewDuration: timeTaken,
        username: userInfo?.name,
      });
    };
  }, [studyInstanceIdParams, userInfo?.sub, userInfo?.name]);

  const [isNew, setIsNew] = useState<boolean>(true);
  const { showToast } = useToast();

  const [isAIReportPreview, setIsAIReportPreview] = useState<boolean>(false);
  const [flag, setFlag] = useState<boolean>(false);

  const [editedReportContent, setEditedReportContent] = useState<string>('');

  const navigate = useNavigate();

  const { data: studyReportData, isFetching: isStudyReportFetching } = useGetStudyReport(
    studyInstanceIdParams,
    getStudyReportKey
  );

  const { mutate: handleUpdateStudyReport } = useUpdateStudyReport();

  useEffect(() => {
    setEditedReportContent(studyReportData?.data.description);
  }, [studyReportData?.data.description]);

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

  // handle report updates
  const handleUpdate = () => {
    const sanitizedDescription = DOMPurify.sanitize(editedReportContent);
    const reportBody = {
      description: sanitizedDescription,
    };

    const studyId = studyInstanceIdParams;

    handleUpdateStudyReport(
      { studyId, reportBody },
      {
        onSuccess: () => {
          setChangeInReportDetected(false);
          setIsNewReport(false);
          showToast({
            content: 'Report Updated.',
            type: 'success',
          });
          navigate(
            `/report/view-report/?modality=${modalityParams}&studyInstanceId=${studyInstanceIdParams}`
          );
        },
        onError() {
          showToast({
            content: 'Report Update Failed.',
            type: 'error',
          });
        },
      }
    );
  };

  const discardChanges = () => {
    setSelectedTemplate(null);
    setSelectedModality('Default');
    setChangeInReportDetected(false);
    setIsNewReport(false);
    if (isInsideViewer) {
      navigate(`/viewer?StudyInstanceUIDs=${studyInstanceIdParams}`);
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
    <>
      {isStudyReportFetching ? (
        <div className="flex flex-col items-center justify-center pt-48">
          <LoadingIndicatorProgress className={'bg-secondary-light h-full w-full'} />
        </div>
      ) : (
        <div className={`min-h-screen ${modalityParams !== 'MG' ? 'bg-white' : 'bg-black'}`}>
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
            handleUpdate={handleUpdate}
            isAIReportPreview={isAIReportPreview}
            setIsAIReportPreview={setIsAIReportPreview}
            changeInReportDetected={setChangeInReportDetected}
          />

          <div style={{ marginTop: '65px', marginLeft: 'auto', marginRight: 'auto' }}>
            {modalityParams === 'MG' ? (
              <MrmcMmgReportForm setChangeInReportDetected={setChangeInReportDetected} />
            ) : (
              <div
                style={{ marginTop: '80px', width: '60%', marginLeft: 'auto', marginRight: 'auto' }}
              >
                <JoditEditor
                  ref={editor}
                  value={editedReportContent}
                  config={config}
                  onChange={newContent => {
                    setChangeInReportDetected(true);
                    setEditedReportContent(newContent);
                  }}
                />
              </div>
            )}
          </div>
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
    </>
  );
};
export default EditReport;
