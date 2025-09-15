import React, { ReactNode, useCallback, useState } from 'react';
import { useSystem } from '@ohif/core';
import classNames from 'classnames';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Icons,
  Button,
  ToolButton,
} from '../';
import { Link, useNavigate } from 'react-router-dom';
import { IconPresentationProvider } from '@ohif/ui-next';
import secureLocalStorage from 'react-secure-storage';

import { createPortal } from 'react-dom';

import NavBar from '../NavBar';
import {
  annotationService,
  CreateReportModal,
  ExitConfirmationModal,
  REPORT_IDS_KEY,
  useAuthenticationContext,
  UserInfo,
  useToast,
  useUpsertAnnotationData,
  useXylexaAppContext,
} from '@xylexa/xylexa-app';

import { useSearchParams } from '@ohif/app/src/hooks';
import { Icon, Select, Svg } from '@ohif/ui';

import { Tooltip } from '@ohif/ui-next';

// Todo: we should move this component to composition and remove props base

interface HeaderProps {
  children?: ReactNode;
  menuOptions: Array<{
    title: string;
    icon?: string;
    onClick: () => void;
  }>;
  isReturnEnabled?: boolean;
  onClickReturnButton?: () => void;
  isSticky?: boolean;
  WhiteLabeling?: {
    createLogoComponentFn?: (React: any, props: any) => ReactNode;
  };
  PatientInfo?: ReactNode;
  Secondary?: ReactNode;
  UndoRedo?: ReactNode;
}

export type ServerOption = { id: 0 | 1; value: 'local' | 'cloud'; label: 'Local' | 'Cloud' };

function Header({
  children,
  menuOptions,
  isReturnEnabled = true,
  onClickReturnButton,
  isSticky = false,
  WhiteLabeling,
  PatientInfo,
  UndoRedo,
  Secondary,
  ...props
}: HeaderProps): ReactNode {
  const { showToast } = useToast();
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [showReportCreationModal, setShowReportCreationModal] = useState(false);
  const { servicesManager } = useSystem();

  const {
    selectedStudy,
    setIsInsideViewer,
    isChangeInAnnotationViewPort,
    setIsChangeInAnnotationViewPort,
  } = useXylexaAppContext();

  const {
    selectedServer,
    serverOptions,
    userInfo,
    setCurrentServerConfigs,
    authToken,
    setSelectedServer,
  } = useAuthenticationContext();

  const searchParams = useSearchParams();
  const studyInstanceUidFromUrl = searchParams.get('StudyInstanceUIDs');
  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      setIsInsideViewer(false);
      onClickReturnButton();
    }
  };

  const { getAnnotationDataArray } = annotationService();

  const { mutate: handleUpsertAnnotationData, isPending: isAnnotationSavePending } =
    useUpsertAnnotationData();

  async function handleSaveAnnotationClick() {
    const { measurementService } = servicesManager?.services;

    const annotationData = await getAnnotationDataArray(measurementService?.annotationsDataArr);

    const body = {
      study_instance_id: studyInstanceUidFromUrl,
      annotation_data: annotationData,
      measurement_data: measurementService?.annotationsMeasurementDataArr,
    };

    handleUpsertAnnotationData(body, {
      onSuccess: res => {
        showToast({
          content: 'Annotations Saved!',
          type: 'success',
        });

        setIsChangeInAnnotationViewPort(false);

        if (showAnnotationModal) {
          navigate('/');
        }
      },
      onError() {
        showToast({
          content: 'Annotations Submission Failed!',
          type: 'error',
        });
      },
    });
  }

  const navigate = useNavigate();
  const reportIds = secureLocalStorage.getItem(REPORT_IDS_KEY);

  const isReported = studyId => {
    const response = reportIds?.data.study_ids.find(id => {
      return id === studyId;
    });

    return response;
  };

  const onSelectServer = (selectedServer: ServerOption) => {
    setSelectedServer(selectedServer);

    const serverConfigs = userInfo?.groupConfig?.find(
      config => config?.PACS_type === selectedServer.value
    );

    if (serverConfigs) {
      setCurrentServerConfigs({
        ...serverConfigs,
        requestOptions: {
          auth: authToken,
          requestFromBrowser: true,
        },
      });
      showToast({
        content: `Connected to ${selectedServer.value}`,
        type: 'success',
      });
    } else {
      showToast({
        content: `Unable to Connect with ${selectedServer.value}`,
        type: 'error',
      });
    }
  };

  function discardChanges() {
    onClickReturn();
  }
  const handleOpenAnnotationModal = () => {
    setShowAnnotationModal(true);
  };

  const handleReportClick = useCallback(() => {
    /**
     * MG Modality modality has no template thats why directly redirecting to MMG Forms
     * if the modality is MG
     */
    isReported(studyInstanceUidFromUrl)
      ? navigate(
          `/report/view-report/?modality=${selectedStudy?.modalities}&studyInstanceId=${studyInstanceUidFromUrl}`
        )
      : selectedStudy?.modalities === 'MG'
        ? navigate(
            `/report/write-report/?modality=${selectedStudy?.modalities}&studyInstanceId=${studyInstanceUidFromUrl}`
          )
        : setShowReportCreationModal(true);
  }, [
    isReported,
    studyInstanceUidFromUrl,
    selectedStudy?.modalities,
    navigate,
    setShowReportCreationModal,
  ]);

  return (
    <IconPresentationProvider
      size="large"
      IconContainer={ToolButton}
    >
      <NavBar
        isSticky={isSticky}
        {...props}
      >
        <div className="relative h-[48px] items-center">
          <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center">
            <div
              className={classNames(
                'mr-3 inline-flex items-center',
                isReturnEnabled && 'cursor-pointer'
              )}
              onClick={isChangeInAnnotationViewPort ? handleOpenAnnotationModal : onClickReturn}
              data-cy="return-to-work-list"
            >
              {isReturnEnabled && <Icons.ArrowLeft className="text-primary ml-1 h-7 w-7" />}
              <div className="ml-1">
                {WhiteLabeling?.createLogoComponentFn?.(React, props) || (
                  <Link to={'/'}>
                    <Svg
                      name="logo-xylexa"
                      className="w-40 sm:w-24 md:w-32 lg:w-36"
                    />
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-[250px] h-8 -translate-y-1/2">{Secondary}</div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <div className="flex items-center justify-center space-x-2">
              {children}
              {isReturnEnabled && (
                <div>
                  <div className="flex flex-row gap-5">
                    <button onClick={handleReportClick}>
                      <Tooltip content={'Patient Report'}>
                        <Icon
                          name="write-report"
                          className="h-[1.5rem] w-[1.5rem]"
                        />
                      </Tooltip>
                    </button>
                    {isAnnotationSavePending ? (
                      <svg
                        aria-hidden="true"
                        className="mx-auto h-6 w-6 animate-spin text-gray-200 dark:text-gray-600"
                        viewBox="0 0 100 101"
                        fill="white"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"
                        />
                      </svg>
                    ) : (
                      <Tooltip content={'Save Annotations'}>
                        <button
                          id="save-annotation-button"
                          onClick={handleSaveAnnotationClick}
                        >
                          {' '}
                          <Icon
                            name="save-icon"
                            className="fill-wh h-[1.5rem] w-[1.5rem]"
                          />
                        </button>
                      </Tooltip>
                    )}
                  </div>

                  {showAnnotationModal &&
                    createPortal(
                      <ExitConfirmationModal
                        setShowModal={setShowAnnotationModal}
                        discardChanges={discardChanges}
                        header={'You have unsaved annotation changes!'}
                        body={
                          'If you choose No, the annotations will not be saved and deleted permanently.'
                        }
                      />,
                      document.body,
                      'ExitConfirmationModal'
                    )}

                  {showReportCreationModal &&
                    createPortal(
                      <CreateReportModal setShowModal={setShowReportCreationModal} />,
                      document.body,
                      'createReportModal'
                    )}
                </div>
              )}
            </div>
          </div>
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 select-none items-center">
            {UndoRedo}
            <div className="border-primary-dark mx-1.5 h-[25px] border-r"></div>
            {PatientInfo}
            <div className="border-primary-dark mx-1.5 h-[25px] border-r"></div>
            {!isReturnEnabled && (
              <div className="d-flex">
                {userInfo?.groupConfig?.length > 1 ? (
                  <Select
                    id="select-server"
                    className="border-primary-main min-w-28 relative mr-3 w-28 bg-transparent text-white"
                    value={selectedServer}
                    isMulti={false}
                    isClearable={false}
                    isSearchable={false}
                    closeMenuOnSelect={true}
                    hideSelectedOptions={true}
                    options={serverOptions}
                    onChange={onSelectServer}
                  />
                ) : (
                  <div className="text-primary-active mr-4 self-center bg-black pt-1 pb-1 pl-3 pr-3 text-lg">
                    {userInfo?.groupConfig[0]?.PACS_type}
                  </div>
                )}
              </div>
            )}

            {!isReturnEnabled && <UserInfo />}

            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:bg-primary-dark mt-2 h-full w-full"
                  >
                    <Icons.GearSettings />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menuOptions.map((option, index) => {
                    const IconComponent = option.icon
                      ? Icons[option.icon as keyof typeof Icons]
                      : null;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onSelect={option.onClick}
                        className="flex items-center gap-2 py-2"
                      >
                        {IconComponent && (
                          <span className="flex h-4 w-4 items-center justify-center">
                            <Icons.ByName name={option.icon} />
                          </span>
                        )}
                        <span className="flex-1">{option.title}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </NavBar>
    </IconPresentationProvider>
  );
}

export default Header;
