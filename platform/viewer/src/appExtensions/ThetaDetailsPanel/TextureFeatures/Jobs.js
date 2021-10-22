import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Jobs = ({ title, content, user, viewport }) => {
  const [isActive, setIsActive] = useState(false);

  const client = axios.create({
    baseURL: 'https://radcadapi.thetatech.ai',
    timeout: 90000,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${user.access_token}`;
    return config;
  });

  useEffect(() => {
    (async () => {
      // series_uid: viewport.viewportSpecificData[0].SeriesInstanceUID,

      // const data = await APIs.jobs.jobs();
      // const data = await client.get('/jobs').then(response => {
      //   console.log(response);
      // }).catch(error => {
      //   setError(error);
      // });
    })();
  }, []);

  return (
    <div className="accordion-item">
      <div className="accordion-title" onClick={() => setIsActive(!isActive)}>
        <div>
          <b>{title}</b>
        </div>
        {/* Not the best way to go about this */}
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        &nbsp; &nbsp; &nbsp;
        <div>{isActive ? '-' : '+'}</div>
      </div>
      {isActive && <div className="accordion-content">{content}</div>}
    </div>
  );
};

export default Jobs;
