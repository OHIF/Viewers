import { ReactElement, useEffect, useState } from 'react';
import DicomFileUploader, {
  DicomFileUploaderProgressEvent,
  EVENTS,
  UploadRejection,
  UploadStatus,
} from '../../utils/DicomFileUploader';
import { Icons } from '@ohif/ui-next';

type DicomUploadProgressItemProps = {
  dicomFileUploader: DicomFileUploader;
};

function DicomUploadProgressItem({
  dicomFileUploader,
}: DicomUploadProgressItemProps): ReactElement<any> {
  const [percentComplete, setPercentComplete] = useState(dicomFileUploader.getPercentComplete());
  const [failedReason, setFailedReason] = useState('');
  const [status, setStatus] = useState(dicomFileUploader.getStatus());

  const isComplete = () =>
    status === UploadStatus.Failed ||
    status === UploadStatus.Cancelled ||
    status === UploadStatus.Success;

  useEffect(() => {
    const progressSubscription = dicomFileUploader.subscribe(
      EVENTS.PROGRESS,
      (dicomFileUploaderProgressEvent: DicomFileUploaderProgressEvent) => {
        setPercentComplete(dicomFileUploaderProgressEvent.percentComplete);
        // The uploader flips to InProgress as it starts sending. Mirror that
        // into state: reading getStatus() during render instead would be a read
        // of mutable data on an object whose identity never changes, which the
        // compiler caches for the life of the component.
        setStatus(dicomFileUploader.getStatus());
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

  const cancelUpload = () => {
    dicomFileUploader.cancel();
  };

  const getStatusIcon = (): ReactElement<any> => {
    switch (status) {
      case UploadStatus.Success:
        return (
          <Icons.ByName
            name="status-tracked"
            className="text-highlight"
          />
        );
      case UploadStatus.InProgress:
        return (
          <Icons.ByName
            name="icon-transferring"
            className="text-highlight"
          />
        );
      case UploadStatus.Failed:
        return (
          <Icons.ByName
            name="icon-alert-small"
            className="text-destructive"
          />
        );
      case UploadStatus.Cancelled:
        return (
          <Icons.ByName
            name="icon-alert-outline"
            className="text-highlight"
          />
        );
      default:
        return <></>;
    }
  };

  return (
    <div className="min-h-14 border-input flex w-full items-center overflow-hidden border-b p-2.5 text-lg">
      <div className="self-top flex w-0 shrink grow flex-col gap-1">
        <div className="flex gap-4">
          <div className="flex w-6 shrink-0 items-center justify-center">{getStatusIcon()}</div>
          <div className="text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {dicomFileUploader.getFileName()}
          </div>
        </div>
        {failedReason && <div className="text-foreground pl-10">{failedReason}</div>}
      </div>
      <div className="flex w-24 items-center">
        {!isComplete() && (
          <>
            {status === UploadStatus.InProgress && (
              <div className="text-foreground w-10 text-right">{percentComplete}%</div>
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

export default DicomUploadProgressItem;
