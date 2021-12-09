import React, { useEffect, useContext, useRef } from 'react';
import '../AITriggerComponent.css';
import Jobs from './Jobs';
import { connect } from 'react-redux';
import axios from 'axios';
import { JobsContext } from '../../../context/JobsContext';
import Loader from './utils/circle-loading.svg';
import lottie from 'lottie-web';
import circularLoading from './utils/circular-loading.json';
import handLoading from './utils/hand-loading.json';


const TextureFeature = props => {
  const [jobs, setJobs] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user, viewport } = props;
  const access_token = user.access_token;
  const email = user.profile.email;
  const series = viewport.viewportSpecificData[0].SeriesInstanceUID;
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);
  const instancesRef = useRef();

  const client = axios.create({
    baseURL:
      'https://lqcbek7tjb.execute-api.us-east-2.amazonaws.com/2021-10-26_Deployment',
    timeout: 90000,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${access_token}`;
    return config;
  });

  // loading loader animation during component call
  useEffect(() => {
    lottie.loadAnimation({
      container: document.querySelector('#loader-svg'),
      animationData: circularLoading,
      renderer: 'svg',
      loop: true,
      autoplay: true,
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getJobs();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // getting all jobs for the current series being displayed in viewport
  const getJobs = async () => {
    try {
      await client
        .get(`/jobs?series=${series}&email=${email}`)
        .then(response => {
          instancesRef.current = response.data.instances;
          setIsLoading(false);
          setJobs([...response.data.jobs]);
        });
    } catch (err) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const removeOverlay = () => {
    setOverlayStatus(false);
  };

  return (
    <div className="component">
      <div className="title-header">Texture Features</div>

      {isLoading && (
        <div className="loader">
          {/* <h2>Loading...</h2> */}
          {/* <img height={40} src={Loader} alt="Loading..." /> */}
          <div id="loader-svg" />
        </div>
      )}

      {overlayStatus && (
        <div>
          <br></br>
          <label>
            <div className="triggerButton">
              <button onClick={removeOverlay} className="syncButton">
                Remove Overlay
              </button>
              <br></br>
            </div>
          </label>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="accordion">
          {jobs.map((data, index) => (
            <Jobs
              key={index}
              user={user}
              viewport={viewport}
              series={series}
              data={data}
              instances={instancesRef.current}
            />
          ))}
        </div>
      )}

      {!isLoading && jobs.length <= 0 && (
        <div className="accordion">
          <p>
            There are current no jobs created. Kindly select the AiTrigger
            button on the toolbar to begin the job creation process
          </p>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
    viewport: state.viewports,
  };
};

const ConnectedTextureFeature = connect(
  mapStateToProps,
  null
)(TextureFeature);

export default ConnectedTextureFeature;
