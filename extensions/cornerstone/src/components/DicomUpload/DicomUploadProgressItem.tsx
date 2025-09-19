import React, { ReactElement, memo, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import DicomFileUploader, {
  DicomFileUploaderProgressEvent,
  EVENTS,
  UploadRejection,
  UploadStatus,
} from '../../utils/DicomFileUploader';
import { Icons } from '@ohif/ui-next';

type DicomUploadProgressItemProps = {
  dicomFileUploader?: DicomFileUploader;
  file: File;
};

// eslint-disable-next-line react/display-name
const DicomUploadProgressItem = memo(
  ({ dicomFileUploader, file }: DicomUploadProgressItemProps): ReactElement => {
    const [percentComplete, setPercentComplete] = useState(dicomFileUploader?.getPercentComplete() || 0);
    const [failedReason, setFailedReason] = useState('');
    const [status, setStatus] = useState(dicomFileUploader?.getStatus() || UploadStatus.NotStarted);

    const isComplete = useCallback(() => {
      return (
        status === UploadStatus.Failed ||
        status === UploadStatus.Cancelled ||
        status === UploadStatus.Success
      );
    }, [status]);

    useEffect(() => {
      if (!dicomFileUploader) {
        return;
      }

      const progressSubscription = dicomFileUploader.subscribe(
        EVENTS.PROGRESS,
        (dicomFileUploaderProgressEvent: DicomFileUploaderProgressEvent) => {
          setPercentComplete(dicomFileUploaderProgressEvent.percentComplete);
        }
      );

      // Note: We don't call .load() here anymore as it's handled by the queue in DicomUploadProgress
      // Just set up progress tracking and status monitoring
      const checkStatus = () => {
        setStatus(dicomFileUploader.getStatus());
      };

      // Check status periodically
      const statusInterval = setInterval(checkStatus, 100);

      return () => {
        progressSubscription.unsubscribe();
        clearInterval(statusInterval);
      };
    }, [dicomFileUploader]);

    const cancelUpload = useCallback(() => {
      if (dicomFileUploader) {
        dicomFileUploader.cancel();
      }
    }, [dicomFileUploader]);

    const getStatusIcon = (): ReactElement => {
      const currentStatus = dicomFileUploader?.getStatus() || UploadStatus.NotStarted;
      switch (currentStatus) {
        case UploadStatus.Success:
          return (
            <Icons.ByName
              name="status-tracked"
              className="text-primary-light"
            />
          );
        case UploadStatus.InProgress:
          return <Icons.ByName name="icon-transferring" />;
        case UploadStatus.Failed:
          return <Icons.ByName name="icon-alert-small" />;
        case UploadStatus.Cancelled:
          return <Icons.ByName name="icon-alert-outline" />;
        case UploadStatus.NotStarted:
          return <Icons.ByName name="icon-status-untracked" />;
        default:
          return <Icons.ByName name="icon-status-untracked" />;
      }
    };

    return (
      <div className="min-h-14 border-secondary-light flex w-full items-center overflow-hidden border-b p-2.5 text-lg">
        <div className="self-top flex w-0 shrink grow flex-col gap-1">
          <div className="flex gap-4">
            <div className="flex w-6 shrink-0 items-center justify-center">{getStatusIcon()}</div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-white">
              {file.name}
            </div>
          </div>
          {failedReason && <div className="pl-10">{failedReason}</div>}
        </div>
        <div className="flex w-24 items-center">
          {!isComplete() && (
            <>
              {status === UploadStatus.InProgress && (
                <div className="w-10 text-right">{percentComplete}%</div>
              )}
              <div className="ml-auto flex cursor-pointer">
                <Icons.Close
                  className="text-primary self-center"
                  onClick={cancelUpload}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

DicomUploadProgressItem.propTypes = {
  dicomFileUploader: PropTypes.instanceOf(DicomFileUploader),
  file: PropTypes.instanceOf(File).isRequired,
};

export default DicomUploadProgressItem;
