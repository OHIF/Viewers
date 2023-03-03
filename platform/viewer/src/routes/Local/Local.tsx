import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { MODULE_TYPES } from '@ohif/core';

import Dropzone from 'react-dropzone';
import filesToStudies from './filesToStudies';

import { extensionManager } from '../../App.tsx';

import { Icon, Button, LoadingIndicatorProgress } from '@ohif/ui';

const getLoadButton = (onDrop, text, isDir) => {
  return (
    <Dropzone onDrop={onDrop} noDrag>
      {({ getRootProps, getInputProps }) => (
        <div {...getRootProps()}>
          <Button
            rounded="full"
            variant="contained" // outlined
            disabled={false}
            endIcon={<Icon name="launch-arrow" />} // launch-arrow | launch-info
            className={classnames('font-medium', 'ml-2')}
            onClick={() => {}}
          >
            {text}
            {isDir ? (
              <input
                {...getInputProps()}
                webkitdirectory="true"
                mozdirectory="true"
              />
            ) : (
              <input {...getInputProps()} />
            )}
          </Button>
        </div>
      )}
    </Dropzone>
  );
};

function Local() {
  const navigate = useNavigate();
  const dropzoneRef = useRef();
  const [dropInitiated, setDropInitiated] = React.useState(false);

  // Initializing the dicom local dataSource
  const dataSourceModules = extensionManager.modules[MODULE_TYPES.DATA_SOURCE];
  const localDataSources = dataSourceModules.reduce((acc, curr) => {
    const mods = [];
    curr.module.forEach(mod => {
      if (mod.type === 'localApi') {
        mods.push(mod);
      }
    });
    return acc.concat(mods);
  }, []);

  const firstLocalDataSource = localDataSources[0];
  const dataSource = firstLocalDataSource.createDataSource({});

  const onDrop = async acceptedFiles => {
    const studies = await filesToStudies(acceptedFiles, dataSource);
    // Todo: navigate to work list and let user select a mode
    const query = new URLSearchParams();
    studies.forEach(id => query.append('StudyInstanceUIDs', id));
    navigate(`/viewer/dicomlocal?${decodeURIComponent(query.toString())}`);
  };

  // Set body style
  useEffect(() => {
    document.body.classList.add('bg-black');
    return () => {
      document.body.classList.remove('bg-black');
    };
  }, []);

  return (
    <Dropzone
      ref={dropzoneRef}
      onDrop={acceptedFiles => {
        setDropInitiated(true);
        onDrop(acceptedFiles);
      }}
      noClick
    >
      {({ getRootProps }) => (
        <div {...getRootProps()} style={{ width: '100%', height: '100%' }}>
          <div className="h-screen w-screen flex justify-center items-center ">
            <div className="py-8 px-8 mx-auto bg-secondary-dark drop-shadow-md space-y-2 rounded-lg">
              <img
                className="block mx-auto h-14"
                src="./ohif-logo.svg"
                alt="OHIF"
              />
              <div className="text-center space-y-2 pt-4">
                {dropInitiated ? (
                  <div className="flex flex-col items-center justify-center pt-48">
                    <LoadingIndicatorProgress
                      className={'w-full h-full bg-black'}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-blue-300 text-base">
                      Note: You data is not uploaded to any server, it will stay
                      in your local browser application
                    </p>
                    <p className="text-xg text-primary-active font-semibold pt-6">
                      Drag and Drop DICOM files here to load them in the Viewer
                    </p>
                    <p className="text-blue-300 text-lg">Or click to </p>
                  </div>
                )}
              </div>
              <div className="flex justify-around pt-4 ">
                {getLoadButton(onDrop, 'Load files', false)}
                {getLoadButton(onDrop, 'Load folders', true)}
              </div>
            </div>
          </div>
        </div>
      )}
    </Dropzone>
  );
}

export default Local;
