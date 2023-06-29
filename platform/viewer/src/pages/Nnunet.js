import React, { useEffect, useRef, useState } from 'react';
import Page from '../components/Page';
import { withRouter, useLocation, useHistory } from 'react-router-dom';
import { Icon } from '../../../ui/src/elements/Icon';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import { servicesManager } from '../App';
import { CSSTransition } from 'react-transition-group';
import { radcadapi } from '../utils/constants';

const { UIDialogService, UINotificationService } = servicesManager.services;

const transitionDuration = 500;
const transitionClassName = 'labelling';
const transitionOnAppear = true;

function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest function.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export const getExistingSegmentations = async (series_uid, userEmail) => {
  try {
    const response = await fetch(
      `${radcadapi}/segmentations?series=${series_uid}&email=${userEmail}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting existing segmentations: ', error);
    return [];
  }
};

// startNnunetProcess function
export const startNnunetProcess = async (
  studyInstanceUID,
  seriesInstanceUID,
  user
) => {
  try {
    UIDialogService.dismiss({ id: 'ForceRerun' });

    const url = radcadapi + '/nnunet_lung';
    const body = JSON.stringify({
      studyInstanceUID: studyInstanceUID,
      seriesInstanceUID: seriesInstanceUID,
      userEmail: user.profile.email,
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.access_token}`,
      },
      body: body,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error starting nnUNet process: ', error);
  }
};

// checkJobStatus function
export const checkJobStatus = async userEmail => {
  try {
    const url =
      radcadapi +
      `/nnunet/job-status?user_email=${userEmail}&job_type=NNUNET_LUNG`;
    const response = await fetch(url, {
      method: 'GET',
    });
    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error('Error checking nnUNet job status: ', error);
  }
};

const ForceRerun = props => {
  return (
    <CSSTransition
      // in={this.props.displayComponent}
      appear={transitionOnAppear}
      timeout={transitionDuration}
      classNames={transitionClassName}
      // onExited={this.props.onTransitionExit}
    >
      <div
        className="importModalContainer"
        style={{
          position: 'relative',
          padding: '1em',
          zIndex: '999',
          transition: 'all 200ms linear',
          maxHeight: '500px',
          background: 'var(--ui-gray-darkest)',
        }}
      >
        <div className="seriesTitle">{props.message}</div>
        <div className="footer" style={{ justifyContent: 'flex-end' }}>
          <div>
            <button
              onClick={props.onClose}
              data-cy="cancel-btn"
              className="btn btn-default"
            >
              Cancel
            </button>
            <button
              onClick={props.onConfirm}
              className="btn btn-primary"
              data-cy="ok-btn"
            >
              Run
            </button>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};

function NnunetPage({ studyInstanceUIDs, seriesInstanceUIDs }) {
  const [processStarted, setProcessStarted] = useState(false);
  const [count, setCount] = useState(1);
  const user = useSelector(state => state.oidc.user);
  const location = useLocation();
  const history = useHistory();
  const [loading, setLoading] = useState(true);

  const handleOnSuccess = () => {
    const direction = localStorage.getItem('direction');
    const pathname =
      direction && direction === 'back'
        ? location.pathname.replace('nnunet', 'view')
        : location.pathname.replace('nnunet', 'edit');

    history.push(pathname);
  };

  const handleOnExist = () => {
    let direction = localStorage.getItem('direction');
    let pathname;
    if (direction && direction == 'back')
      pathname = location.pathname.replace('nnunet', 'view');
    else pathname = location.pathname.replace('nnunet', 'edit');
    UIDialogService.dismiss({ id: 'ForceRerun' });
    history.push(pathname);
  };

  const showLoadSegmentationDialog = message => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.create({
      id: 'ForceRerun',
      isDraggable: false,
      showOverlay: true,
      centralize: true,
      content: ForceRerun,
      contentProps: {
        message,
        onConfirm: async () => {
          await startNnunetProcess(
            studyInstanceUIDs[0],
            JSON.parse(localStorage.getItem('series_uid')),
            user
          );
        },
        onClose: () => handleOnExist(),
      },
    });
  };

  useInterval(async () => {
    if (processStarted) {
      const status = await checkJobStatus(user.profile.email);

      if (status === 'DONE' || status === 'ERROR') {
        handleOnSuccess();
      }
    }
  }, 16000);

  useEffect(async () => {
    const series_uid = JSON.parse(localStorage.getItem('series_uid') || '');

    const segmentationsList = await getExistingSegmentations(
      series_uid,
      user.profile.email
    );
    if (isEmpty(segmentationsList)) {
      await startNnunetProcess(
        studyInstanceUIDs[0],
        JSON.parse(localStorage.getItem('series_uid')),
        user
      );
      setProcessStarted(true);
    } else {
      showLoadSegmentationDialog(
        segmentationsList.includes('nnunet')
          ? 'Nnunet segmentations exist, do you re-run nnunet segmentation?'
          : 'Non-nnunet segmentations exist, do you run nnunet segmentation?'
      );
    }
  }, []);

  const loadingIcon = (
    <Icon name="circle-notch" className="loading-icon-spin loading-icon" />
  );

  return (
    <Page>
      <div
        style={{
          width: '100%',
          height: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading && (
          <>
            <div className="nnunet-page__header">
              <h1 className="nnunet-page__title">
                Loading nnU-Net Segmentation
              </h1>
            </div>
            {loadingIcon}
          </>
        )}
      </div>
    </Page>
  );
}
export default withRouter(NnunetPage);
