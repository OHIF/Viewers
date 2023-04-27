import React, { useCallback, useState } from 'react';
import { ReactElement } from 'react';
import Dropzone from 'react-dropzone';
import PropTypes from 'prop-types';
import DicomFileUploader from '../../utils/DicomFileUploader';
import DicomUploadProgress from './DicomUploadProgress';
import { Button } from '@ohif/ui';

type DicomUploadProps = {
  dataSource;
  onComplete: () => void;
  onStarted: () => void;
};

function DicomUpload({
  dataSource,
  onComplete,
  onStarted,
}: DicomUploadProps): ReactElement {
  const [dicomFileUploaderArr, setDicomFileUploaderArr] = useState([]);

  const onDrop = useCallback(async acceptedFiles => {
    onStarted();
    setDicomFileUploaderArr(
      acceptedFiles.map(file => new DicomFileUploader(file, dataSource))
    );
  }, []);

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
            className="m-10 border border-dashed border-aqua-pale rounded flex flex-col items-center justify-center h-full"
          >
            <div className="flex gap-3">
              <Dropzone onDrop={onDrop} noDrag>
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()}>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={false}
                      onClick={() => {}}
                    >
                      {'Add files'}
                      <input {...getInputProps()} />
                    </Button>
                  </div>
                )}
              </Dropzone>
              <Dropzone onDrop={onDrop} noDrag>
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()}>
                    <Button
                      variant="contained"
                      color="primaryDark"
                      border="primaryActive"
                      disabled={false}
                      onClick={() => {}}
                    >
                      {'Add folder'}
                      <input
                        {...getInputProps()}
                        webkitdirectory="true"
                        mozdirectory="true"
                      />
                    </Button>
                  </div>
                )}
              </Dropzone>
            </div>
            <div className="pt-8">or drag images or folders here</div>
            <div className="pt-3 text-aqua-pale text-lg">
              (DICOM files supported)
            </div>
          </div>
        )}
      </Dropzone>
    );
  };

  return (
    <div className="h-[calc(100vh-300px)] min-h-[250px] flex flex-col bg-black select-none">
      {dicomFileUploaderArr.length ? (
        <DicomUploadProgress
          dicomFileUploaderArr={Array.from(dicomFileUploaderArr)}
          onComplete={onComplete}
        />
      ) : (
        getDropZoneComponent()
      )}
    </div>
  );
}

DicomUpload.propTypes = {
  dataSource: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onStarted: PropTypes.func.isRequired,
};

export default DicomUpload;
