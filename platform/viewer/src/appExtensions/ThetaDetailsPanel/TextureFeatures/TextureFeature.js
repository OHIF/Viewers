import React, { useEffect, useContext } from 'react';
import '../AITriggerComponent.css';
import Jobs from './Jobs';
import { connect } from 'react-redux';
import axios from 'axios';
import { JobsContext } from '../../../context/JobsContext';

const TextureFeature = props => {
  const [jobs, setJobs] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user, viewport } = props;
  const access_token = user.access_token;
  const email = user.profile.email;
  const series = viewport.viewportSpecificData[0].SeriesInstanceUID;
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);

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

  useEffect(() => {
    const interval = setInterval(() => {
      getJobs();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // getting all jobs for the current series being displayed in viewport
  const getJobs = async () => {
    try {
      await client
        .get(`/jobs?series=${series}&email=${email}`)
        .then(response => {
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
        <div style={{ alignItems: 'center' }}>
          <h1>Loading...</h1>
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
            />
          ))}
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
