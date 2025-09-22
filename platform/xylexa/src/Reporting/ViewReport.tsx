import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingIndicatorProgress } from '@ohif/ui';
import { useReactToPrint } from 'react-to-print';
import { useAuthenticationContext, useXylexaAppContext } from './../context';
import { useGetAiReport, useGetMMGReport, useGetStudyReport } from '../api-client';
import { Appbar, CreateReportModal } from './components';
import { getAiReportBody, getFooter, getHeader } from './helpers';
import { createPortal } from 'react-dom';
import mixpanel from 'mixpanel-browser';
import useGetQueryParams from '../hooks/useGetQueryParams';
import MrmcTemplate from './templates/MrmcTemplate';

export const ViewReport = () => {
  const pdfRef = useRef();
  const navigate = useNavigate();

  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const [isAIReportPreview, setIsAIReportPreview] = useState<boolean>(false);

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
  });

  const {
    setSelectedModality,
    setSelectedTemplate,
    selectedStudy,
    setIsNewReport,
    getStudyReportKey,
    isInsideViewer,
  } = useXylexaAppContext();

  const { userInfo } = useAuthenticationContext();

  const [modalityParams, studyInstanceIdParams] = useGetQueryParams(window.location.search, [
    'modality',
    'studyInstanceId',
  ]);

  const {
    data: studyReportData,
    isFetching: isStudyReportFetching,
    status: getStudyReportStatus,
  } = useGetStudyReport(studyInstanceIdParams, getStudyReportKey);

  const {
    data: aiReportData,
    isFetching: isAiReportFetching,
    status: getAiReportStatus,
  } = useGetAiReport(selectedStudy?.studyInstanceUid, ['CT', 'CT\\SEG'].includes(modalityParams));

  const {
    data: mmgReportData,
    isFetching: isMMGReportFetching,
    status: getMMGReportStatus,
  } = useGetMMGReport(studyInstanceIdParams, modalityParams === 'MG');

  useEffect(() => {
    performance.mark('view-report-mounted');
    return () => {
      performance.mark('view-report-unmounted');
      performance.measure('view-report-timespend', 'view-report-mounted', 'view-report-unmounted');
      const timeTaken = (
        performance.getEntriesByName('view-report-timespend')[0].duration / 1000
      ).toFixed(2);

      mixpanel.track('View Report (Time)', {
        pageUrl: window.location.href,
        page_name: 'View Report',
        userId: userInfo?.sub,
        studyId: selectedStudy?.studyInstanceUid,
        pageViewDuration: timeTaken,
        username: userInfo?.name,
      });
    };
  }, [selectedStudy?.studyInstanceUid, userInfo?.sub, userInfo?.name]);

  //splitting report to extract the header

  const splittedReport = studyReportData?.data.description.split('<hr>');

  const handleBack = useCallback(
    e => {
      e.preventDefault();
      setSelectedTemplate(null);
      setSelectedModality('Default');
      setIsNewReport(false);

      if (isInsideViewer) {
        navigate(`/viewer?StudyInstanceUIDs=${selectedStudy?.studyInstanceUid}`);
      } else {
        navigate('/');
      }
    },
    [
      isInsideViewer,
      navigate,
      selectedStudy?.studyInstanceUid,
      setIsNewReport,
      setSelectedModality,
      setSelectedTemplate,
    ]
  );

  /**
   * This will remain true until the component is mounted. Just to conditionally render some options on navBar.
   */

  const ViewReportPreviewMode = true;

  useEffect(() => {
    if (getAiReportStatus === 'success') {
      setIsAIReportPreview(true);
    }
    if (getStudyReportStatus === 'success' || getMMGReportStatus === 'success') {
      setIsEditable(true);
    }

    if (selectedStudy?.modalities !== 'CT') {
      setIsAIReportPreview(false);
    }
  }, [
    studyReportData,
    aiReportData,
    selectedStudy,
    getAiReportStatus,
    getStudyReportStatus,
    getMMGReportStatus,
  ]);

  return (
    <div>
      {isStudyReportFetching || isAiReportFetching || isMMGReportFetching ? (
        <LoadingIndicatorProgress className={'bg-secondary-light h-full w-full'} />
      ) : (
        <div className="min-h-screen bg-white">
          <Appbar
            handleBack={handleBack}
            ViewReportPreviewMode={ViewReportPreviewMode}
            isAIReportPreview={isAIReportPreview}
            setIsAIReportPreview={setIsAIReportPreview}
            isEditable={isEditable}
            handlePrint={handlePrint}
          />

          {showModal &&
            createPortal(
              <CreateReportModal setShowModal={setShowModal} />,
              document.body,
              'createReportModal'
            )}

          {['CT', 'CT\\SEG'].includes(modalityParams) ? (
            <div className="w-3/2 mx-auto flex h-screen justify-center overflow-auto !text-[black]">
              <div
                style={{
                  marginTop: '65px',
                  width: '60%',
                }}
              >
                {getStudyReportStatus === 'success' && !isAIReportPreview ? (
                  <div
                    ref={pdfRef}
                    style={{
                      padding: '50px',
                    }}
                  >
                    {!isAIReportPreview && (
                      <div
                        dangerouslySetInnerHTML={{ __html: studyReportData?.data?.description }}
                      />
                    )}
                  </div>
                ) : (
                  !isAIReportPreview && (
                    <div className="text-lgs text-center">
                      No report Found! <br />
                      <span
                        className="cursor-pointer"
                        style={{ color: 'blue' }}
                        onClick={() => setShowModal(true)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setShowModal(true);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        Click here
                      </span>{' '}
                      to Create Report.
                    </div>
                  )
                )}

                {getAiReportStatus === 'success' && isAIReportPreview ? (
                  <div
                    ref={pdfRef}
                    style={{
                      padding: '50px',
                    }}
                  >
                    {isAIReportPreview && getStudyReportStatus === 'success' && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `${splittedReport[0]}${splittedReport[1]}<br/>${getAiReportBody(aiReportData?.data)}${getFooter(userInfo)}`,
                        }}
                      />
                    )}
                    {isAIReportPreview && getStudyReportStatus === 'error' && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `${getHeader(selectedStudy, '')}<br/>${getAiReportBody(aiReportData?.data)}${getFooter(userInfo)}`,
                        }}
                      />
                    )}
                  </div>
                ) : (
                  isAIReportPreview && (
                    <div className="text-lgs text-center">No AI report Found!</div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="w-3/2 flex h-screen justify-center overflow-auto !text-[black]">
              {modalityParams === 'MG' ? (
                <div
                  style={{
                    width: '80%',
                    marginTop: '100px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                  ref={pdfRef}
                >
                  {getMMGReportStatus === 'success' ? (
                    <MrmcTemplate reportData={mmgReportData} />
                  ) : (
                    <div className="text-lgs text-center">
                      No report Found! <br />
                      <span
                        className="cursor-pointer"
                        style={{ color: 'blue' }}
                        onClick={() => setShowModal(true)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setShowModal(true);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        Click here
                      </span>{' '}
                      to Create Report.
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: '100px',
                    width: '60%',
                  }}
                >
                  {getStudyReportStatus === 'success' ? (
                    <div
                      ref={pdfRef}
                      style={{
                        padding: '50px',
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: studyReportData?.data?.description }}
                      />
                    </div>
                  ) : (
                    <div className="text-lgs text-center">
                      No report Found! <br />
                      <span
                        className="cursor-pointer"
                        style={{ color: 'blue' }}
                        onClick={() => setShowModal(true)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setShowModal(true);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        Click here
                      </span>{' '}
                      to Create Report.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewReport;
