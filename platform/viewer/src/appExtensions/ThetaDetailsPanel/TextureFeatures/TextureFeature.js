import React, { useEffect } from 'react';
import '../AITriggerComponent.css';
import Jobs from './Jobs';
import { connect } from 'react-redux';
import axios from 'axios';

const TextureFeature = props => {
  const [jobs, setJobs] = React.useState([]);
  const { user, viewport } = props;
  const access_token = user.access_token;
  const email = user.profile.email;
  const series = viewport.viewportSpecificData[0].SeriesInstanceUID;

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
    // getting all jobs for the current series being displayed in viewport
    (async () => {
      await client
        .get(`/jobs?series=${series}&email=${email}`)
        .then(response => {
          console.log({ response });
          setJobs([...response.data.jobs]);
        })
        .catch(error => {
          console.log(error);
        });
    })();
  }, []);

  return (
    <div className="component">
      <div className="title-header">Texture Features</div>
      {jobs.length > 0 && (
        <div className="accordion">
          {jobs.map((data, index) => (
            <Jobs
              key={index}
              user={user}
              viewport={viewport}
              data={data}
              series={series}
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
