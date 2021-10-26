import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ScrollableArea } from '../../../../../ui/src/ScrollableArea/ScrollableArea';
import ImageThumbnail from '../../../../../ui/src/components/studyBrowser/ImageThumbnail';

const Jobs = ({ title, content, user, viewport }) => {
  const [isActive, setIsActive] = useState(false);

  // console.log(user.profile.email);
  const access_token = user.access_token;

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
    (async () => {
      const series = viewport.viewportSpecificData[0].SeriesInstanceUID;
      const email = user.profile.email;

      const data = await client
        .get(`/jobs?series=${series}&email=${email}`)
        .then(response => {
          console.log(response);
        })
        .catch(error => {
          // setError(error);
          console.log(error);
        });

      if (data) {
        console.log(data);
      }
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
      {isActive && (
        <div className="accordion-content">
          <ScrollableArea scrollStep={201} class="series-browser">
            <ImageThumbnail />
          </ScrollableArea>
        </div>
      )}
    </div>
  );
};

export default Jobs;
