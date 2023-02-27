import React, { useEffect, useRef, useState } from 'react';
import Page from '../components/Page';
import { withRouter, useLocation, useHistory } from 'react-router-dom';
import { Icon } from '../../../ui/src/elements/Icon';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import { servicesManager } from '../App';
import { CSSTransition } from 'react-transition-group';
import { radcadapi } from '../utils/constants';


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

const transitionDuration = 500;
const transitionClassName = 'labelling';
const transitionOnAppear = true;

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
  const [processStarted, setProcessState] = useState(false);
  const [count, setCount] = useState(1);
  const user = useSelector(state => state.oidc.user);
  const location = useLocation();
  const history = useHistory();
  const [loading, setLoading] = useState(true);

  const handleOnSuccess = () => {
    let direction = localStorage.getItem('direction');
    let pathname;
    if (direction && direction == 'back')
      pathname = location.pathname.replace('nnunet', 'view');
    else pathname = location.pathname.replace('nnunet', 'edit');

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

  const showloadSegmentationDailog = message => {
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
          await startNNunetProcess();
        },
        onClose: () => handleOnExist(),
      },
    });
  };

  const checkExistingSegmentations = async () => {
    try {
      const series_uid = JSON.parse(localStorage.getItem('series_uid') || '');
      const email = user.profile.email;
      var requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      };

      let segmentations = await fetch(
        `${radcadapi}/segmentations?series=${series_uid}&email=${email}`,
        requestOptions
      );
      if (segmentations.status == 200)
        segmentations = await segmentations.json();
      else segmentations = {};

      let has_nnunet = false;
      const segmentationsList = Object.keys(segmentations) || [];
      for (const segment_label_name of segmentationsList) {
        if (segment_label_name.includes('nnunet')) {
          has_nnunet = true;
          break;
        }
      }

      if (isEmpty(segmentationsList)) {
        await startNNunetProcess();
      } else if (has_nnunet) {
        showloadSegmentationDailog(
          'Nnunet segmentations exist, do you re-run nnunet segmentation ?'
        );
      } else {
        showloadSegmentationDailog(
          'Non-nnunet segmentations exist, do you run nnunet segmentation ?'
        );
      }
    } catch (error) {
      handleOnSuccess();
      console.log(error);
    }
  };

  const checkJobStatus = async () => {
    try {
      setCount(count + 1);
      const email = user.profile.email;

      var requestOptions = {
        method: 'GET',
      };

      let response = await fetch(
        `${radcadapi}/job-status?email=${email}&job_type=NNUNET_LUNG`,
        requestOptions
      );
      response = await response.json();

      // if (count > 5) handleOnSuccess();
      if (response.status === 'DONE') handleOnSuccess();
      else if (response.status === 'ERROR') handleOnSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  const startNNunetProcess = async () => {
    try {
      UIDialogService.dismiss({ id: 'ForceRerun' });
      const series_uid = JSON.parse(localStorage.getItem('series_uid'));

      const study_uid = studyInstanceUIDs;
      const email = user.profile.email;
      const state = window.store.getState();

      const body = {
        parameters: {},
        study_uid: study_uid[0],
        series_uid: series_uid,
        email: email,
      };

      var requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + state.oidc.user.access_token,
        },
        body: JSON.stringify(body),
      };

      const response = await fetch(`${radcadapi}/nnunet_lung`, requestOptions);
      const result = await response.json();

      setProcessState(true);
    } catch (error) {
      // setProcessState(true);
      console.error(error);
    }
  };

  useInterval(() => {
    if (processStarted) checkJobStatus();
    // axios request here to get the next image
  }, 16000);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(radcadapi + '/endpoint-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(data => {
          if (
            data['nnUNet-3d-fullres-lung-endpoint'] === 'RUNNING' &&
            data['nnUNet-4D-Brain-lite-3modality-endpoint'] === 'RUNNING' &&
            data['cbir-encoder'] === 'RUNNING'
          ) {
            setLoading(false);
            clearInterval(interval);
            checkExistingSegmentations();
          } else {
            UINotificationService.show({
              title: 'Endpoint warming up',
              type: 'error',
              autoClose: true,
            });
          }
        })
        .catch(error => console.error(error));
    }, 60000);

    fetch(radcadapi + '/endpoint-status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        if (
          data['nnUNet-3d-fullres-lung-endpoint'] === 'RUNNING' &&
          data['nnUNet-4D-Brain-lite-3modality-endpoint'] === 'RUNNING' &&
          data['cbir-encoder'] === 'RUNNING'
        ) {
          setLoading(false);
          clearInterval(interval);
          checkExistingSegmentations();
        } else {
          UINotificationService.show({
            title: 'Endpoint warming up',
            type: 'error',
            autoClose: true,
          });
        }
      })
      .catch(error => console.error(error));

    return () => clearInterval(interval);
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
        {loadingIcon}
      </div>
    </Page>
  );
}

export default withRouter(NnunetPage);
