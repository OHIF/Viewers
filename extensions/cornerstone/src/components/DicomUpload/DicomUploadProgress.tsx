import React, { useCallback, useEffect, useRef, useState, ReactElement } from 'react';
import PropTypes from 'prop-types';
import { useSystem } from '@ohif/core';
import { Button } from '@ohif/ui';
import { Icons } from '@ohif/ui-next';
import DicomFileUploader, {
  EVENTS,
  UploadStatus,
  DicomFileUploaderProgressEvent,
  UploadRejection,
} from '../../utils/DicomFileUploader';
import DicomUploadProgressItem from './DicomUploadProgressItem';
import classNames from 'classnames';

type DicomUploadProgressProps = {
  dicomFileUploaderArr: DicomFileUploader[];
  onComplete: () => void;
};

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;

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

const NO_WRAP_ELLIPSIS_CLASS_NAMES = 'text-ellipsis whitespace-nowrap overflow-hidden';

function DicomUploadProgress({
  dicomFileUploaderArr,
  onComplete,
}: DicomUploadProgressProps): ReactElement {
  const { servicesManager } = useSystem();

  const ProgressLoadingBar =
    servicesManager.services.customizationService.getCustomization('ui.progressLoadingBar');

  const [totalUploadSize] = useState(
    dicomFileUploaderArr.reduce((acc, fileUploader) => acc + fileUploader.getFileSize(), 0)
  );

  const currentUploadSizeRef = useRef<number>(0);

  const uploadRateRef = useRef(0);

  const [timeRemaining, setTimeRemaining] = useState<number>(null);

  const [percentComplete, setPercentComplete] = useState(0);

  const [numFilesCompleted, setNumFilesCompleted] = useState(0);

  const [numFails, setNumFails] = useState(0);

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
      const uploadSizeFromStartOfInterval = currentUploadSizeRef.current - intervalStartUploadSize;

      const now = Date.now();
      const timeSinceStartOfInterval = now - intervalStartTime;

      // Calculate and set the upload rate (ref)
      uploadRateRef.current = uploadSizeFromStartOfInterval / timeSinceStartOfInterval;

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

        currentFileUploadSize = Math.round((percentComplete / 100) * fileUploader.getFileSize());

        currentUploadSizeRef.current = Math.min(
          totalUploadSize,
          currentUploadSizeRef.current - previousFileUploadSize + currentFileUploadSize
        );

        setPercentComplete((currentUploadSizeRef.current / totalUploadSize) * 100);

        if (uploadRateRef.current !== 0) {
          const uploadSizeRemaining = totalUploadSize - currentUploadSizeRef.current;

          const timeRemaining = Math.round(uploadSizeRemaining / uploadRateRef.current);

          if (currentTimeRemaining === null) {
            currentTimeRemaining = timeRemaining;
            setTimeRemaining(currentTimeRemaining);
            return;
          }

          // Do not show an increase in the time remaining by two seconds or minutes
          // so as to prevent jumping the time remaining up and down constantly
          // due to rounding, inaccuracies in the estimate and slight variations
          // in upload rates over time.
          if (timeRemaining < ONE_MINUTE) {
            const currentSecondsRemaining = Math.ceil(currentTimeRemaining / ONE_SECOND);
            const secondsRemaining = Math.ceil(timeRemaining / ONE_SECOND);
            const delta = secondsRemaining - currentSecondsRemaining;
            if (delta < 0 || delta > 2) {
              currentTimeRemaining = timeRemaining;
              setTimeRemaining(currentTimeRemaining);
            }
            return;
          }

          if (timeRemaining < ONE_HOUR) {
            const currentMinutesRemaining = Math.ceil(currentTimeRemaining / ONE_MINUTE);
            const minutesRemaining = Math.ceil(timeRemaining / ONE_MINUTE);
            const delta = minutesRemaining - currentMinutesRemaining;
            if (delta < 0 || delta > 2) {
              currentTimeRemaining = timeRemaining;
              setTimeRemaining(currentTimeRemaining);
            }
            return;
          }

          // Hours remaining...
          currentTimeRemaining = timeRemaining;
          setTimeRemaining(currentTimeRemaining);
        }
      };

      const progressCallback = (progressEvent: DicomFileUploaderProgressEvent) => {
        updateProgress(progressEvent.percentComplete);
      };

      // Use the uploader promise to flag any error and count the number of
      // uploads completed.
      fileUploader
        .load()
        .catch((rejection: UploadRejection) => {
          if (rejection.status === UploadStatus.Failed) {
            setNumFails(numFails => numFails + 1);
          }
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

  const cancelAllUploads = useCallback(async () => {
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
    }
  }, []);

  const getFormattedTimeRemaining = useCallback((): string => {
    if (timeRemaining == null) {
      return '';
    }

    if (timeRemaining < ONE_MINUTE) {
      const secondsRemaining = Math.ceil(timeRemaining / ONE_SECOND);
      return `${secondsRemaining} ${secondsRemaining === 1 ? 'second' : 'seconds'}`;
    }

    if (timeRemaining < ONE_HOUR) {
      const minutesRemaining = Math.ceil(timeRemaining / ONE_MINUTE);
      return `${minutesRemaining} ${minutesRemaining === 1 ? 'minute' : 'minutes'}`;
    }

    const hoursRemaining = Math.ceil(timeRemaining / ONE_HOUR);
    return `${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'}`;
  }, [timeRemaining]);

  const getPercentCompleteRounded = useCallback(
    () => Math.min(100, Math.round(percentComplete)),
    [percentComplete]
  );

  /**
   * Determines if the progress bar should show the infinite animation or not.
   * Show the infinite animation for progress less than 1% AND if less than
   * one pixel of the progress bar would be displayed.
   */
  const showInfiniteProgressBar = useCallback((): boolean => {
    return (
      getPercentCompleteRounded() < 1 &&
      (progressBarContainerRef?.current?.offsetWidth ?? 0) * (percentComplete / 100) < 1
    );
  }, [getPercentCompleteRounded, percentComplete]);

  /**
   * Gets the CSS style for the 'n of m' (files completed) text.
   * The width changes according to numFilesCompleted and can vary,
   * e.g. "1 of 200", "10 of 200", "100 of 200" all have differents width.
   */
  const getNofMFilesStyle = useCallback(() => {
    // the number of digits accounts for the digits being on each side of the ' of '
    const numDigits =
      numFilesCompleted.toString().length + dicomFileUploaderArr.length.toString().length;
    // The number of digits + 3 additional characters (accounts for ' of ').
    // Even though intuitively 4 should be better, this is the most accurate width.
    // The font may play a part in this discrepancy.
    const numChars = numDigits + 3;
    return { width: `${numChars}ch` };
  }, [numFilesCompleted]);

  const getNumCompletedAndTimeRemainingComponent = (): ReactElement => {
    return (
      <div className="bg-primary-dark flex h-14 items-center px-1 pb-4 text-lg text-white">
        {numFilesCompleted === dicomFileUploaderArr.length ? (
          <>
            <span className={NO_WRAP_ELLIPSIS_CLASS_NAMES}>{`${dicomFileUploaderArr.length} ${
              dicomFileUploaderArr.length > 1 ? 'files' : 'file'
            } completed.`}</span>
            <Button
              disabled={false}
              className="ml-auto"
              onClick={onComplete}
            >
              {'Close'}
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap">
              <span
                style={getNofMFilesStyle()}
                className={classNames(NO_WRAP_ELLIPSIS_CLASS_NAMES, 'text-right')}
              >
                {`${numFilesCompleted} of ${dicomFileUploaderArr.length}`}&nbsp;
              </span>
              <span className={NO_WRAP_ELLIPSIS_CLASS_NAMES}>{' files completed.'}</span>
              <br />
              <span>
                {timeRemaining ? `Less than ${getFormattedTimeRemaining()} remaining. ` : ''}
              </span>
            </div>

            <span
              className={
                'text-primary hover:text-primary-lightactive:text-aqua-pale ml-auto cursor-pointer whitespace-nowrap'
              }
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
      <div className="ml-auto flex w-6 justify-center">
        {numFails > 0 && (
          <div onClick={() => setShowFailedOnly(currentShowFailedOnly => !currentShowFailedOnly)}>
            <Icons.ByName
              className="cursor-pointer"
              name="icon-status-alert"
            ></Icons.ByName>
          </div>
        )}
      </div>
    );
  };

  const getPercentCompleteComponent = (): ReactElement => {
    return (
      <div className="ohif-scrollbar border-secondary-light overflow-y-scroll border-b px-2">
        <div className="min-h-14 flex w-full items-center p-2.5">
          {numFilesCompleted === dicomFileUploaderArr.length ? (
            <>
              <div className="text-primary-light text-xl">
                {numFails > 0
                  ? `Completed with ${numFails} ${numFails > 1 ? 'errors' : 'error'}!`
                  : 'Completed!'}
              </div>
              {getShowFailedOnlyIconComponent()}
            </>
          ) : (
            <>
              <div
                ref={progressBarContainerRef}
                className="flex-grow"
              >
                <ProgressLoadingBar
                  progress={showInfiniteProgressBar() ? undefined : Math.min(100, percentComplete)}
                ></ProgressLoadingBar>
              </div>
              <div className="ml-1 flex w-24 items-center">
                <div className="w-10 text-right text-foreground">{`${getPercentCompleteRounded()}%`}</div>
                {getShowFailedOnlyIconComponent()}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex grow flex-col">
      {getNumCompletedAndTimeRemainingComponent()}
      <div className="flex grow flex-col overflow-hidden bg-black text-lg">
        {getPercentCompleteComponent()}
        <div className="ohif-scrollbar h-1 grow overflow-y-scroll px-2">
          {dicomFileUploaderArr
            .filter(
              dicomFileUploader =>
                !showFailedOnly || dicomFileUploader.getStatus() === UploadStatus.Failed
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
  dicomFileUploaderArr: PropTypes.arrayOf(PropTypes.instanceOf(DicomFileUploader)).isRequired,
  onComplete: PropTypes.func.isRequired,
};

export default DicomUploadProgress;
