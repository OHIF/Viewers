import React, { useEffect, useRef, useState } from 'react';
import Page from '../components/Page';
import { withRouter, useLocation, useHistory } from 'react-router-dom';
import { Icon } from '../../../ui/src/elements/Icon';
import { useSelector } from 'react-redux';

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

function NnunetPage({ studyInstanceUIDs, seriesInstanceUIDs }) {
  const [processStarted, setProcessState] = useState(true);
  const [count, setCount] = useState(1);
  const user = useSelector(state => state.oidc.user);
  const location = useLocation();
  const history = useHistory();

  const handleOnSuccess = () => {
    const pathname = location.pathname.replace('nnunet', 'edit');
    history.push(pathname);
  };

  const checkJobStatus = async () => {
    try {
      setCount(count + 1);

      var requestOptions = {
        method: 'GET',
      };

      const response = await fetch(
        `https://radcadapi.thetatech.ai/job-status?email=nick.fragakis@thetatech.ai&job_type=NNUNET_BRAIN`,
        requestOptions
      );
      let result = await response.json();

      if (count > 5) handleOnSuccess();

      if (response.data.status === 'DONE') {
        handleOnSuccess();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startNNunetProcess = async () => {
    try {
      const series_uid = seriesInstanceUIDs;
      const study_uid = studyInstanceUIDs;
      const email = user.profile.email;
      const body = {
        study_uid: study_uid,
        series_uid: series_uid,
        email: email,
        parameters: {
          FLAIR:
            '1.3.6.1.4.1.14519.5.2.1.6450.4012.137394205856739469389144102217',
          T1:
            '1.3.6.1.4.1.14519.5.2.1.6450.4012.137394205856739469389144102217',
          T2:
            '1.3.6.1.4.1.14519.5.2.1.6450.4012.137394205856739469389144102217',
        },
      };

      var requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      };

      const response = await fetch(
        `https://radcadapi.thetatech.ai/nnunet_brain`,
        requestOptions
      );
      const result = await response.json();

      setProcessState(true);
    } catch (error) {
      setProcessState(true);
      console.error(error);
    }
  };

  useInterval(() => {
    if (processStarted) checkJobStatus();
    // axios request here to get the next image
    console.log('interval');
  }, 1000);

  useEffect(() => {
    startNNunetProcess();
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
