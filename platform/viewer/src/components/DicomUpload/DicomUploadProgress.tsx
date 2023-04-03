import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, ProgressLoadingBar } from '@ohif/ui';
import DicomFileUploader, {
  EVENTS,
  UploadStatus,
} from '../../utils/DicomFileUploader';
import { DicomFileUploaderProgressEvent } from '../../utils/DicomFileUploader';
import DicomUploadProgressItem from './DicomUploadProgressItem';
import classNames from 'classnames';

export type DicomUploadProgressProps = {
  dicomFileUploaderArr: DicomFileUploader[];
  onComplete: () => void;
};

// The base/initial interval time length used to calculate the
// rate of the upload and in turn estimate the
// the amount of time remaining for the upload. This is the length
// of the very first interval to get a reasonable estimate on screen in
// a reasonable amount of time. The length of each interval after the first
// is based on the upload rate calculated. Faster rates use this base interval
// length. Slower rates below UPLOAD_RATE_THRESHOLD get longer interval times
// to obtain more accurate upload rates.
const BASE_INTERVAL_TIME = 15000;

// The upload rate threshold to determine the length of the interval to
// calculate the upload rate.
const UPLOAD_RATE_THRESHOLD = 75;

const NO_WRAP_ELLIPSIS_CLASS_NAMES =
  'text-ellipsis whitespace-nowrap overflow-hidden';

function DicomUploadProgress({
  dicomFileUploaderArr,
  onComplete,
}: DicomUploadProgressProps): ReactElement {
  const [totalUploadSize] = useState(
    dicomFileUploaderArr.reduce(
      (acc, fileUploader) => acc + fileUploader.getFileSize(),
      0
    )
  );

  const currentUploadSizeRef = useRef<number>(0);

  const uploadRateRef = useRef(0);

  const [timeRemaining, setTimeRemaining] = useState<number>(null);

  const [percentComplete, setPercentComplete] = useState(0);

  const [numFilesCompleted, setNumFilesCompleted] = useState(0);

  const [failureOccurred, setFailureOccurred] = useState(false);

  const [showFailedOnly, setShowFailedOnly] = useState(false);

  const progressBarContainerRef = useRef<HTMLElement>();

  /**
   * The effect for measuring and setting the current upload rate. This is
   * done by measuring the amount of data uploaded in a set interval time.
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // The amount of data already uploaded at the start of the interval.
    let intervalStartUploadSize = 0;

    // The starting time of the interval.
    let intervalStartTime = Date.now();

    const setUploadRateRef = () => {
      const uploadSizeFromStartOfInterval =
        currentUploadSizeRef.current - intervalStartUploadSize;

      const now = Date.now();
      const timeSinceStartOfInterval = now - intervalStartTime;

      // Calculate and set the upload rate (ref)
      uploadRateRef.current =
        uploadSizeFromStartOfInterval / timeSinceStartOfInterval;

      console.info(uploadRateRef.current);
      // Reset the interval starting values.
      intervalStartUploadSize = currentUploadSizeRef.current;
      intervalStartTime = now;

      // Only start a new interval if there is more to upload.
      if (totalUploadSize - currentUploadSizeRef.current > 0) {
        if (uploadRateRef.current >= UPLOAD_RATE_THRESHOLD) {
          timeoutId = setTimeout(setUploadRateRef, BASE_INTERVAL_TIME);
        } else {
          // The current upload rate is relatively slow, so use a larger
          // time interval to get a better upload rate estimate.
          timeoutId = setTimeout(setUploadRateRef, BASE_INTERVAL_TIME * 2);
        }
      }
    };

    // The very first interval is just the base time interval length.
    timeoutId = setTimeout(setUploadRateRef, BASE_INTERVAL_TIME);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const getFormattedTimeRemaining = (): string => {
    if (timeRemaining == null) {
      return '';
    } else if (timeRemaining < 60000) {
      const secondsRemaining = Math.ceil(timeRemaining / 1000);
      return `${secondsRemaining} ${
        secondsRemaining === 1 ? 'second' : 'seconds'
      }`;
    } else if (timeRemaining < 3600000) {
      const minutesRemaining = Math.ceil(timeRemaining / 60000);
      return `${minutesRemaining} ${
        minutesRemaining === 1 ? 'minute' : 'minutes'
      }`;
    } else {
      const hoursRemaining = Math.ceil(timeRemaining / 3600000);
      return `${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'}`;
    }
  };

  /**
   * The effect for: updating the overall percentage complete; setting the
   * estimated time remaining; updating the number of files uploaded; and
   * detecting if any error has occurred.
   */
  useEffect(() => {
    let currentTimeRemaining = null;

    // For each uploader, listen for the progress percentage complete and
    // add promise catch/finally callbacks to detect errors and count number
    // of uploads complete.
    const subscriptions = dicomFileUploaderArr.map(fileUploader => {
      let currentFileUploadSize = 0;

      const updateProgress = (percentComplete: number) => {
        const previousFileUploadSize = currentFileUploadSize;

        currentFileUploadSize = Math.round(
          (percentComplete / 100) * fileUploader.getFileSize()
        );

        currentUploadSizeRef.current = Math.min(
          totalUploadSize,
          currentUploadSizeRef.current -
            previousFileUploadSize +
            currentFileUploadSize
        );

        if (uploadRateRef.current !== 0) {
          const uploadSizeRemaining =
            totalUploadSize - currentUploadSizeRef.current;

          const timeRemaining = Math.round(
            uploadSizeRemaining / uploadRateRef.current
          );

          if (currentTimeRemaining === null) {
            currentTimeRemaining = timeRemaining;
            setTimeRemaining(currentTimeRemaining);
          } else {
            // Do not show an increase in the time remaining by two seconds or minutes
            // so as to prevent jumping the time remaining up and down constantly
            // due to rounding, inaccuracies in the estimate and slight variations
            // in upload rates over time.
            if (timeRemaining < 60000) {
              const currentSecondsRemaining = Math.ceil(
                currentTimeRemaining / 1000
              );
              const secondsRemaining = Math.ceil(timeRemaining / 1000);
              const delta = secondsRemaining - currentSecondsRemaining;
              if (delta < 0 || delta > 2) {
                currentTimeRemaining = timeRemaining;
                setTimeRemaining(currentTimeRemaining);
              }
            } else if (timeRemaining < 3600000) {
              const currentMinutesRemaining = Math.ceil(
                currentTimeRemaining / 60000
              );
              const minutesRemaining = Math.ceil(timeRemaining / 60000);
              const delta = minutesRemaining - currentMinutesRemaining;
              if (delta < 0 || delta > 2) {
                currentTimeRemaining = timeRemaining;
                setTimeRemaining(currentTimeRemaining);
              }
            } else {
              currentTimeRemaining = timeRemaining;
              setTimeRemaining(currentTimeRemaining);
            }
          }
        }

        setPercentComplete(
          (currentUploadSizeRef.current / totalUploadSize) * 100
        );
      };

      const progressCallback = (
        progressEvent: DicomFileUploaderProgressEvent
      ) => {
        updateProgress(progressEvent.percentComplete);
      };

      // Use the uploader promise to flag any error and count the number of
      // uploads completed.
      fileUploader
        .load()
        .catch(() => {
          setFailureOccurred(true);
        })
        .finally(() => {
          // If any error occurred, the percent complete progress stops firing
          // but this call to updateProgress nicely puts all finished uploads at 100%.
          updateProgress(100);
          setNumFilesCompleted(numCompleted => numCompleted + 1);
        });

      return fileUploader.subscribe(EVENTS.PROGRESS, progressCallback);
    });
    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, []);

  const cancelAllUploads = async () => {
    for (const dicomFileUploader of dicomFileUploaderArr) {
      // Important: we need a non-blocking way to cancel every upload,
      // otherwise the UI will freeze and the user will not be able
      // to interact with the app and progress will not be updated.
      const promise = new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          dicomFileUploader.cancel();
          resolve();
        }, 0);
      });

      await promise;
    }
  };

  const getPercentCompleteRounded = () =>
    Math.min(100, Math.round(percentComplete));

  /**
   * Determines if the progress bar should show the infinite animation or not.
   * Show the infinite animation for progress less than 1% AND if less than
   * one pixel of the progress bar would be displayed.
   */
  const showInfiniteProgressBar = (): boolean => {
    return (
      getPercentCompleteRounded() < 1 &&
      (progressBarContainerRef?.current?.offsetWidth ?? 0) *
        (percentComplete / 100) <
        1
    );
  };

  const getNumCompletedAndTimeRemainingComponent = (): ReactElement => {
    return (
      <div className="text-lg px-1 pb-4 h-14 flex bg-primary-dark items-center">
        {numFilesCompleted === dicomFileUploaderArr.length ? (
          <>
            <span
              className={NO_WRAP_ELLIPSIS_CLASS_NAMES}
            >{`Upload of ${dicomFileUploaderArr.length} files complete`}</span>
            <Button
              variant="contained"
              color="primary"
              disabled={false}
              className="ml-auto"
              onClick={onComplete}
            >
              {'Open Viewer'}
            </Button>
          </>
        ) : (
          <>
            <span
              style={getNofMFilesStyle()}
              className={classNames(NO_WRAP_ELLIPSIS_CLASS_NAMES, 'text-end')}
            >
              {`${numFilesCompleted} of ${dicomFileUploaderArr.length}`}&nbsp;
            </span>
            <span className={NO_WRAP_ELLIPSIS_CLASS_NAMES}>
              {' files completed.'}&nbsp;
            </span>
            <span className={NO_WRAP_ELLIPSIS_CLASS_NAMES}>
              {timeRemaining
                ? `Less than ${getFormattedTimeRemaining()} remaining. `
                : ''}
            </span>
            <span
              className={classNames(
                NO_WRAP_ELLIPSIS_CLASS_NAMES,
                'cursor-pointer text-primary-active ml-auto'
              )}
              onClick={cancelAllUploads}
            >
              Cancel All Uploads
            </span>
          </>
        )}
      </div>
    );
  };

  const getShowFailedOnlyIconComponent = (): ReactElement => {
    return (
      <div className="ml-auto flex justify-center w-6">
        {failureOccurred && (
          <div
            onClick={() =>
              setShowFailedOnly(currentShowFailedOnly => !currentShowFailedOnly)
            }
          >
            <Icon className="cursor-pointer" name="icon-status-alert"></Icon>
          </div>
        )}
      </div>
    );
  };

  const getPercentCompleteComponent = (): ReactElement => {
    return (
      <div className="overflow-y-scroll ohif-scrollbar px-2 border-b border-secondary-light">
        <div className="flex w-full p-2.5 items-center min-h-14">
          {numFilesCompleted === dicomFileUploaderArr.length ? (
            <>
              <div className="text-xl text-primary-light">
                {failureOccurred ? 'Completed with error(s)!' : 'Completed!'}
              </div>
              {getShowFailedOnlyIconComponent()}
            </>
          ) : (
            <>
              <div ref={progressBarContainerRef} className="flex-grow">
                <ProgressLoadingBar
                  progress={
                    showInfiniteProgressBar()
                      ? undefined
                      : Math.min(100, percentComplete)
                  }
                ></ProgressLoadingBar>
              </div>
              <div className="ml-5 flex items-center gap-6">
                <div className="w-10 text-right">{`${getPercentCompleteRounded()}%`}</div>
                {getShowFailedOnlyIconComponent()}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  /**
   * Gets the css style for the 'n of m' (files completed) text. The only css attribute
   * of the style is width such that the 'n of m' is always a fixed width and thus
   * as each file completes uploading the text on screen does not constantly shift
   * left and right.
   */
  const getNofMFilesStyle = () => {
    const numDigits = 2 * dicomFileUploaderArr.length.toString().length;
    const numChars = numDigits + 4; // the number of digits + 2 spaces and 2 characters for 'of'
    return { width: `${numChars}ch` };
  };

  return (
    <div className="flex flex-col grow">
      {getNumCompletedAndTimeRemainingComponent()}
      <div className="flex flex-col bg-black text-lg overflow-hidden grow">
        {getPercentCompleteComponent()}
        <div className="overflow-y-scroll ohif-scrollbar px-2 grow h-1">
          {dicomFileUploaderArr
            .filter(
              dicomFileUploader =>
                !showFailedOnly ||
                dicomFileUploader.getStatus() === UploadStatus.Failed
            )
            .map(dicomFileUploader => (
              <DicomUploadProgressItem
                key={dicomFileUploader.getFileId()}
                dicomFileUploader={dicomFileUploader}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

DicomUploadProgress.propTypes = {
  dicomFileUploaderArr: PropTypes.arrayOf(
    PropTypes.instanceOf(DicomFileUploader)
  ).isRequired,
  onComplete: PropTypes.func.isRequired,
};

export default DicomUploadProgress;
