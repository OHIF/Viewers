import React, { useCallback, useState } from 'react';
import { ReactElement } from 'react';
import Dropzone from 'react-dropzone';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DicomFileUploader from '../../utils/DicomFileUploader';
import DicomUploadProgress from './DicomUploadProgress';
import { Button, ButtonEnums } from '@ohif/ui';
import './DicomUpload.css';

// Extend window interface to include config
declare global {
  interface Window {
    config?: {
      maxNumRequests?: {
        upload?: number;
      };
    };
  }
}

type DicomUploadProps = {
  dataSource;
  onComplete: () => void;
  onStarted: () => void;
};

function DicomUpload({ dataSource, onComplete, onStarted }: DicomUploadProps): ReactElement {
  const baseClassNames = 'min-h-[480px] flex flex-col bg-black select-none';
  const [filesAndDataSource, setFilesAndDataSource] = useState<{files: File[], dataSource: any} | null>(null);

  // Get the maxNumRequests configuration from window.config
  const maxConcurrentUploads = window.config?.maxNumRequests?.upload || 3;

  const onDrop = useCallback(async acceptedFiles => {
    onStarted();
    setFilesAndDataSource({ files: acceptedFiles, dataSource });
  }, [dataSource]);

  const getDropZoneComponent = (): ReactElement => {
    return (
      <Dropzone
        onDrop={acceptedFiles => {
          onDrop(acceptedFiles);
        }}
        noClick
      >
        {({ getRootProps }) => (
          <div
            {...getRootProps()}
            className="dicom-upload-drop-area-border-dash m-5 flex h-full flex-col items-center justify-center"
          >
            <div className="flex gap-3">
              <Dropzone
                onDrop={onDrop}
                noDrag
              >
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()}>
                    <input {...getInputProps()} key="file-input" style={{ display: 'none' }} />
                    <Button
                      disabled={false}
                      onClick={() => {}}
                    >
                      Add files
                    </Button>
                  </div>
                )}
              </Dropzone>
              <Dropzone
                onDrop={onDrop}
                noDrag
              >
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()}>
                    <input
                      {...getInputProps()}
                      {...({ webkitdirectory: 'true', mozdirectory: 'true' } as any)}
                      key="folder-input"
                      style={{ display: 'none' }}
                    />
                    <Button
                      type={ButtonEnums.type.secondary}
                      disabled={false}
                      onClick={() => {}}
                    >
                      Add folder
                    </Button>
                  </div>
                )}
              </Dropzone>
            </div>
            <div className="pt-5">or drag images or folders here</div>
            <div className="text-aqua-pale pt-3 text-lg">(DICOM files supported)</div>
          </div>
        )}
      </Dropzone>
    );
  };

  return (
    <>
      {filesAndDataSource ? (
        <div className={classNames('h-[calc(100vh-300px)]', baseClassNames)}>
          <DicomUploadProgress
            files={filesAndDataSource.files}
            dataSource={filesAndDataSource.dataSource}
            onComplete={onComplete}
            maxConcurrentUploads={maxConcurrentUploads}
          />
        </div>
      ) : (
        <div className={classNames('h-[480px]', baseClassNames)}>{getDropZoneComponent()}</div>
      )}
    </>
  );
}

DicomUpload.propTypes = {
  dataSource: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onStarted: PropTypes.func.isRequired,
};

export default DicomUpload;
