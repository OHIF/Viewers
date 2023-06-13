import React, {
  ReactElement,
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react';
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
    const [percentComplete, setPercentComplete] = useState(
      dicomFileUploader.getPercentComplete()
    );
    const [failedReason, setFailedReason] = useState('');
    const [status, setStatus] = useState(dicomFileUploader.getStatus());

    console.info(`${dicomFileUploader.getFileId()}`);
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
            <Icon name="status-tracked" className="text-primary-light"></Icon>
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
      <div className="flex w-full p-2.5 text-lg min-h-14 items-center border-b border-secondary-light overflow-hidden">
        <div className="flex flex-col gap-1 self-top w-0 grow shrink">
          <div className="flex gap-4">
            <div className="flex w-6 justify-center items-center shrink-0">
              {getStatusIcon()}
            </div>
            <div className="text-ellipsis whitespace-nowrap overflow-hidden">
              {dicomFileUploader.getFileName()}
            </div>
          </div>
          {failedReason && <div className="pl-10">{failedReason}</div>}
        </div>
        <div className="w-24 flex items-center">
          {!isComplete() && (
            <>
              {dicomFileUploader.getStatus() === UploadStatus.InProgress && (
                <div className="w-10 text-right">{percentComplete}%</div>
              )}
              <div className="flex cursor-pointer ml-auto">
                <Icon
                  className="self-center text-primary-active"
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
