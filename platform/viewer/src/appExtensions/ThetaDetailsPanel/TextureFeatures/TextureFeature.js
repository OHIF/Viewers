import React, { useEffect } from 'react';
import '../AITriggerComponent.css';
import Jobs from './Jobs';
import { connect } from 'react-redux';
import axios from 'axios';

const TextureFeature = props => {
  const [jobs, setJobs] = React.useState([]);
  const { user, viewport } = props;
  const access_token = user.access_token;
  const series = viewport.viewportSpecificData[0].SeriesInstanceUID;
  const email = user.profile.email;

  const client = axios.create({
    baseURL: 'https://radcadapi.thetatech.ai',
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
    // console.log({ Path: window.location.pathname });
    (async () => {
      const results = await client
        .get(`/jobs?series=${series}&email=${email}`)
        .then(response => {
          setJobs(response.data.jobs);
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
            <Jobs key={index} user={user} viewport={viewport} data={data} />
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
