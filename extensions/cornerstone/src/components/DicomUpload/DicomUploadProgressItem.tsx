import React, { ReactElement, memo, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import DicomFileUploader, {
  DicomFileUploaderProgressEvent,
  EVENTS,
  UploadRejection,
  UploadStatus,
} from '../../utils/DicomFileUploader';
import { Icon } from '@ohif/ui';

type DicomUploadProgressItemProps = {
  dicomFileUploader: DicomFileUploader;
};

// eslint-disable-next-line react/display-name
const DicomUploadProgressItem = memo(
  ({ dicomFileUploader }: DicomUploadProgressItemProps): ReactElement => {
    const [percentComplete, setPercentComplete] = useState(dicomFileUploader.getPercentComplete());
    const [failedReason, setFailedReason] = useState('');
    const [status, setStatus] = useState(dicomFileUploader.getStatus());

    const isComplete = useCallback(() => {
      return (
        status === UploadStatus.Failed ||
        status === UploadStatus.Cancelled ||
        status === UploadStatus.Success
      );
    }, [status]);

    useEffect(() => {
      const progressSubscription = dicomFileUploader.subscribe(
        EVENTS.PROGRESS,
        (dicomFileUploaderProgressEvent: DicomFileUploaderProgressEvent) => {
          setPercentComplete(dicomFileUploaderProgressEvent.percentComplete);
        }
      );

      dicomFileUploader
        .load()
        .catch((reason: UploadRejection) => {
          setStatus(reason.status);
          setFailedReason(reason.message ?? '');
        })
        .finally(() => setStatus(dicomFileUploader.getStatus()));

      return () => progressSubscription.unsubscribe();
    }, []);

    const cancelUpload = useCallback(() => {
      dicomFileUploader.cancel();
    }, []);

    const getStatusIcon = (): ReactElement => {
      switch (dicomFileUploader.getStatus()) {
        case UploadStatus.Success:
          return (
            <Icon
              name="status-tracked"
              className="text-primary-light"
            ></Icon>
          );
        case UploadStatus.InProgress:
          return <Icon name="icon-transferring"></Icon>;
        case UploadStatus.Failed:
          return <Icon name="icon-alert-small"></Icon>;
        case UploadStatus.Cancelled:
          return <Icon name="icon-alert-outline"></Icon>;
        default:
          return <></>;
      }
    };

    return (
      <div className="min-h-14 border-secondary-light flex w-full items-center overflow-hidden border-b p-2.5 text-lg">
        <div className="self-top flex w-0 shrink grow flex-col gap-1">
          <div className="flex gap-4">
            <div className="flex w-6 shrink-0 items-center justify-center">{getStatusIcon()}</div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
              {dicomFileUploader.getFileName()}
            </div>
          </div>
          {failedReason && <div className="pl-10">{failedReason}</div>}
        </div>
        <div className="flex w-24 items-center">
          {!isComplete() && (
            <>
              {dicomFileUploader.getStatus() === UploadStatus.InProgress && (
                <div className="w-10 text-right">{percentComplete}%</div>
              )}
              <div className="ml-auto flex cursor-pointer">
                <Icon
                  className="text-primary-active self-center"
                  name="close"
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
  dicomFileUploader: PropTypes.instanceOf(DicomFileUploader).isRequired,
};

export default DicomUploadProgressItem;
