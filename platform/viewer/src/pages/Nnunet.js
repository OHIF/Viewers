import React, { useEffect, useRef, useState } from 'react';
import Page from '../components/Page';
import { withRouter, useLocation, useHistory } from 'react-router-dom';
import { Icon } from '../../../ui/src/elements/Icon';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import { servicesManager } from '../App';
import { CSSTransition } from 'react-transition-group';
import { client } from '../appExtensions/LungModuleSimilarityPanel/utils';
import { radcadapi } from '../utils/constants';
const { UIDialogService } = servicesManager.services;

function useIsMountedRef() {
  const isMounted = useRef(true);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  return isMounted;
}

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
  const [has_nnunet, setHas_Nnunet] = useState(false);
  const user = useSelector(state => state.oidc.user);
  const location = useLocation();
  const history = useHistory();
  const isMountedRef = useIsMountedRef();

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
      // const segmentations = await fetchSegmentations();
      const series_uid = JSON.parse(localStorage.getItem('series_uid') || '');

      // const series_uid = seriesInstanceUIDs;
      // const series_uid = viewportData[0].SeriesInstanceUID;
      // const email = 'nick.fragakis%40thetatech.ai';
      const email = user.profile.email;
      const body = {
        email: 'bimpongamoako@gmail.com', //'nick.fragakis@thetatech.ai',
      };
      let segmentations = await client.get(
        `/segmentations?series=${series_uid}&email=${email}`,
        body
      );
      console.log(segmentations);
      segmentations = segmentations.data;

      const segmentationsList = Object.keys(segmentations) || [];
      for (const segment_label_name of segmentationsList) {
        if (segment_label_name.includes('nnunet')) {
          setHas_Nnunet(true);
          break;
        }
      }

      if (isEmpty(segmentationsList)) {
        // no segmentations exist - autorun nnunet
        await startNNunetProcess();
      } else if (has_nnunet) {
        // ask if they want to force rerun
        showloadSegmentationDailog(
          'Nnunet segmentations exist, do you re-run nnunet segmentation ?'
        );
      } else {
        // non-nnunet segmentations exist. ask the user
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

      var requestOptions = {
        method: 'GET',
      };

      let response = await fetch(
        `${radcadapi}/job-status?email=nick.fragakis@thetatech.ai&job_type=NNUNET_LUNG`,
        requestOptions
      );
      response = await response.json();

      // if (count > 5) handleOnSuccess();
      if (response.status === 'DONE') {
        handleOnSuccess();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startNNunetProcess = async () => {
    try {
      UIDialogService.dismiss({ id: 'ForceRerun' });

      const series_uid = seriesInstanceUIDs;
      const study_uid = studyInstanceUIDs;
      const email = user.profile.email;

      const body = {
        study_uid:
          '1.3.6.1.4.1.32722.99.99.100855571832074152951605738408734618579',
        series_uid:
          '1.3.6.1.4.1.32722.99.99.71621653125201582124240564508842688465',
        email: 'nick.fragakis@thetatech.ai',
        parameters: {},
        // study_uid: study_uid,
        // series_uid: series_uid,
        // email: email,
        // parameters: {
        //   FLAIR:
        //     '1.3.6.1.4.1.14519.5.2.1.6450.4012.137394205856739469389144102217',
        //   T1:
        //     '1.3.6.1.4.1.14519.5.2.1.6450.4012.137394205856739469389144102217',
        //   T2:
        //     '1.3.6.1.4.1.14519.5.2.1.6450.4012.137394205856739469389144102217',
        // },
      };

      var requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      };

      const response = await fetch(`${radcadapi}/nnunet_lung`, requestOptions);
      const result = await response.json();

      setProcessState(true);
    } catch (error) {
      setProcessState(true);
      // console.error(error);
    }
  };

  useInterval(() => {
    if (processStarted) checkJobStatus();
    // axios request here to get the next image
  }, 16000);

  useEffect(() => {
    // showloadSegmentationDailog('sample');
    checkExistingSegmentations();
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
