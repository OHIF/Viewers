import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@ohif/ui-next';
import Dropzone from 'react-dropzone';

// Route Components
import Local from './Local';
import Debug from './Debug';
import NotFound from './NotFound';
import buildModeRoutes from './buildModeRoutes';
import PrivateRoute from './PrivateRoute';
import PropTypes from 'prop-types';
import { routerBasename } from '../utils/publicUrl';
import { useAppConfig } from '@state';
import { history } from '../utils/history';
import { DicomMetadataStore } from '@ohif/core';
import filesToStudies from './Local/filesToStudies';
import { extensionManager } from '../App';

const NotFoundServer = ({
  message = 'Unable to query for studies at this time. Check your data source configuration or network connection',
}) => {
  return (
    <div className="absolute flex h-full w-full items-center justify-center text-white">
      <div>
        <h4>{message}</h4>
      </div>
    </div>
  );
};

NotFoundServer.propTypes = {
  message: PropTypes.string,
};

const NotFoundStudy = () => {
  const [appConfig] = useAppConfig();
  const { showStudyList } = appConfig;

  return (
    <div className="absolute flex h-full w-full items-center justify-center text-white">
      <div>
        <h4>One or more of the requested studies are not available at this time.</h4>
        {showStudyList && (
          <p className="mt-2">
            Return to the{' '}
            <Link
              className="text-primary-light"
              to="/"
            >
              study list
            </Link>{' '}
            to select a different study to view.
          </p>
        )}
      </div>
    </div>
  );
};

NotFoundStudy.propTypes = {
  message: PropTypes.string,
};

const Home = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [queuedStudyInstanceUIDs, setQueuedStudyInstanceUIDs] = useState([]);
  const [queuedFilesCount, setQueuedFilesCount] = useState(0);
  const [queuedFiles, setQueuedFiles] = useState([]);
  const folderInputRef = useRef(null);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', 'true');
      folderInputRef.current.setAttribute('mozdirectory', 'true');
      folderInputRef.current.setAttribute('directory', 'true');
    }
  }, []);

  const microscopyExtensionLoaded = useMemo(() => {
    return (
      extensionManager?.registeredExtensionIds?.includes('@ohif/extension-dicom-microscopy') ??
      false
    );
  }, []);

  const handleDrop = useCallback(
    async acceptedFiles => {
      if (!acceptedFiles.length || isProcessing) {
        return;
      }

      setErrorMessage('');
      setIsProcessing(true);

      try {
        const studies = await filesToStudies(acceptedFiles);

        if (!studies?.length) {
          setErrorMessage('Nie udało się wczytać plików DICOM.');
          setIsProcessing(false);
          return;
        }

        const uniqueStudies = Array.from(new Set(studies));
        setQueuedStudyInstanceUIDs(uniqueStudies);
        setQueuedFilesCount(prev => prev + acceptedFiles.length);
        setQueuedFiles(prev => [...prev, ...acceptedFiles]);
        setIsProcessing(false);
      } catch (error) {
        console.error('Failed to process dropped DICOM files', error);
        setErrorMessage('Wystąpił problem podczas przetwarzania plików.');
        setIsProcessing(false);
      }
    },
    [isProcessing]
  );

  const handleFolderSelect = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();
      const files = Array.from(event.target.files || []);
      if (files.length) {
        handleDrop(files);
      }
      event.target.value = '';
    },
    [handleDrop]
  );

  const handleGoToViewer = useCallback(
    async target => {
      if (isProcessing) {
        return;
      }

      const studyInstanceUIDs = queuedStudyInstanceUIDs.length
        ? [...queuedStudyInstanceUIDs]
        : DicomMetadataStore.getStudyInstanceUIDs();

      if (!studyInstanceUIDs.length) {
        setErrorMessage('No files loaded.');
        return;
      }

      const query = new URLSearchParams();
      studyInstanceUIDs.forEach(id => query.append('StudyInstanceUIDs', id));
      query.append('datasources', 'dicomlocal');

      setErrorMessage('');
      setQueuedFiles([]);
      setQueuedFilesCount(0);
      setQueuedStudyInstanceUIDs([]);

      const path = target === 'segmentation' ? '/segmentation' : '/viewer/dicomlocal';

      navigate(`${path}?${query.toString()}`);
    },
    [queuedStudyInstanceUIDs, navigate]
  );

  const handleClearQueue = useCallback(() => {
    setQueuedFiles([]);
    setQueuedFilesCount(0);
    setQueuedStudyInstanceUIDs([]);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-6">
        <Dropzone
          onDrop={handleDrop}
          multiple
        >
          {({ getRootProps, getInputProps, isDragActive, open }) => (
            <div
              {...getRootProps()}
              className={`flex h-48 w-[500px] cursor-pointer items-center justify-center rounded border-2 border-dashed transition-colors duration-200 ${
                isDragActive
                  ? 'border-primary bg-secondary-dark/70'
                  : 'border-secondary-light bg-secondary-dark/50'
              }`}
            >
              <input
                {...getInputProps()}
                multiple
              />
              {isProcessing ? (
                <p className="px-8 text-center text-lg">Loading files...</p>
              ) : (
                <div className="px-8 text-center">
                  <p className="text-lg">Drop a DICOM file or folder of DICOM files here</p>
                  <p className="text-secondary-light mt-2 text-sm">
                    or choose files from your computer
                  </p>
                  <div className="mt-4 flex justify-center gap-3 text-base">
                    <button
                      type="button"
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        open();
                      }}
                      className="border-secondary-light text-secondary-light hover:border-primary hover:text-primary rounded border px-3 py-1 transition"
                      disabled={isProcessing}
                    >
                      Choose files
                    </button>
                    <button
                      type="button"
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (folderInputRef.current) {
                          folderInputRef.current.click();
                        }
                      }}
                      className="border-secondary-light text-secondary-light hover:border-primary hover:text-primary rounded border px-3 py-1 transition"
                      disabled={isProcessing}
                    >
                      Choose folder
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Dropzone>
        <input
          ref={folderInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFolderSelect}
        />
        {queuedFilesCount > 0 && (
          <div className="text-secondary-light flex items-center gap-3 text-sm">
            <p>
              Ready to load {queuedStudyInstanceUIDs.length} study(ies) from {queuedFilesCount}{' '}
              file(s)
            </p>
            <button
              type="button"
              onClick={handleClearQueue}
              className="text-secondary-light hover:text-primary transition"
              disabled={isProcessing}
            >
              ×
            </button>
          </div>
        )}
        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
        <div className="flex gap-4">
          <button
            className="bg-primary flex items-center gap-2 rounded px-6 py-3 text-lg font-semibold text-white transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => handleGoToViewer()}
            disabled={isProcessing}
            title={isProcessing ? 'Processing...' : ''}
          >
            <span
              aria-hidden="true"
              className="flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                className="!h-[20px] !w-[20px] fill-current text-white"
              >
                <g fillRule="evenodd">
                  <circle
                    cx="12"
                    cy="12"
                    r="12"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                  <path
                    fill="#348cfd"
                    fillRule="nonzero"
                    d="M17.207 10.793c.36.36.388.928.083 1.32l-.083.094-5 5c-.39.39-1.024.39-1.414 0-.36-.36-.388-.928-.083-1.32l.083-.094 4.292-4.293-4.292-4.293c-.36-.36-.388-.928-.083-1.32l.083-.094c.36-.36.928-.388 1.32-.083l.094.083 5 5z"
                  />
                  <path
                    fill="#348cfd"
                    fillRule="nonzero"
                    d="M17.5 11.5c0 .513-.386.936-.883.993l-.117.007H6c-.552 0-1-.448-1-1 0-.513.386-.936.883-.993L6 10.5h10.5c.552 0 1 .448 1 1z"
                  />
                </g>
              </svg>
            </span>
            Go to Viewer
          </button>
          <button
            className="bg-primary flex items-center gap-2 rounded px-6 py-3 text-lg font-semibold text-white transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => handleGoToViewer('segmentation')}
            disabled={isProcessing}
            title={isProcessing ? 'Processing...' : ''}
          >
            <span
              aria-hidden="true"
              className="flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                className="!h-[20px] !w-[20px] fill-current text-white"
              >
                <g fillRule="evenodd">
                  <circle
                    cx="12"
                    cy="12"
                    r="12"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                  <path
                    fill="#348cfd"
                    fillRule="nonzero"
                    d="M17.207 10.793c.36.36.388.928.083 1.32l-.083.094-5 5c-.39.39-1.024.39-1.414 0-.36-.36-.388-.928-.083-1.32l.083-.094 4.292-4.293-4.292-4.293c-.36-.36-.388-.928-.083-1.32l.083-.094c.36-.36.928-.388 1.32-.083l.094.083 5 5z"
                  />
                  <path
                    fill="#348cfd"
                    fillRule="nonzero"
                    d="M17.5 11.5c0 .513-.386.936-.883.993l-.117.007H6c-.552 0-1-.448-1-1 0-.513.386-.936.883-.993L6 10.5h10.5c.552 0 1 .448 1 1z"
                  />
                </g>
              </svg>
            </span>
            Segmentation
          </button>
        </div>
      </div>
    </div>
  );
};

// TODO: Include "routes" debug route if dev build
const bakedInRoutes = [
  {
    path: `/notfoundserver`,
    children: NotFoundServer,
  },
  {
    path: `/notfoundstudy`,
    children: NotFoundStudy,
  },
  {
    path: `/debug`,
    children: Debug,
  },
  {
    path: `/local`,
    children: Local.bind(null, { modePath: '' }), // navigate to the worklist
  },
  {
    path: `/localbasic`,
    children: Local.bind(null, { modePath: 'viewer/dicomlocal' }),
  },
];

// NOT FOUND (404)
const notFoundRoute = { component: NotFound };

const createRoutes = ({
  modes,
  dataSources,
  extensionManager,
  servicesManager,
  commandsManager,
  hotkeysManager,
}: withAppTypes) => {
  const routes =
    buildModeRoutes({
      modes,
      dataSources,
      extensionManager,
      servicesManager,
      commandsManager,
      hotkeysManager,
    }) || [];

  const { customizationService } = servicesManager.services;

  const path =
    routerBasename.length > 1 && routerBasename.endsWith('/')
      ? routerBasename.substring(0, routerBasename.length - 1)
      : routerBasename;

  console.log('Registering worklist route', routerBasename, path);

  const HomeRoute = {
    path: '/',
    children: Home,
    private: false,
  };

  const customRoutes = customizationService.getCustomization('routes.customRoutes');

  const allRoutes = [
    HomeRoute,
    ...routes,
    ...(customRoutes?.routes || []),
    ...bakedInRoutes,
    customRoutes?.notFoundRoute || notFoundRoute,
  ];

  function RouteWithErrorBoundary({ route, ...rest }) {
    history.navigate = useNavigate();

    // eslint-disable-next-line react/jsx-props-no-spreading
    return (
      <ErrorBoundary context={`Route ${route.path}`}>
        <route.children
          {...rest}
          {...route.props}
          route={route}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          hotkeysManager={hotkeysManager}
        />
      </ErrorBoundary>
    );
  }

  const { userAuthenticationService } = servicesManager.services;

  // All routes are private by default and then we let the user auth service
  // to check if it is enabled or not
  // Todo: I think we can remove the second public return below
  return (
    <Routes>
      {allRoutes.map((route, i) => {
        return route.private === true ? (
          <Route
            key={i}
            path={route.path}
            element={
              <PrivateRoute
                handleUnauthenticated={() => userAuthenticationService.handleUnauthenticated()}
              >
                <RouteWithErrorBoundary route={route} />
              </PrivateRoute>
            }
          ></Route>
        ) : (
          <Route
            key={i}
            path={route.path}
            element={<RouteWithErrorBoundary route={route} />}
          />
        );
      })}
    </Routes>
  );
};

export default createRoutes;
