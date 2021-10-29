import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ScrollableArea } from '../../../../../ui/src/ScrollableArea/ScrollableArea';
import ImageThumbnail from '../../../../../ui/src/components/studyBrowser/ImageThumbnail';
import { Thumbnail } from '../../../../../ui/src/components/studyBrowser/Thumbnail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/fontawesome-svg-core';

const Jobs = ({ data, user, viewport }) => {
  const [isActive, setIsActive] = useState(false);0
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

  // useEffect(() => {
  //   console.log({ data });
  // }, []);

  const show = () => {
    if (data.status === 'DONE') {
      setIsActive(!isActive);
    }
  };

  return (
    <div className="accordion-item">
      <div className="accordion-title" onClick={show()}>
        <div>
          <b>Job {data.job}</b>
        </div>
        {/* Not the best way to go about this */}
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        {/* <div>{isActive ? '-' : '+'}</div> */}
        <div>
          <b>{data.status}</b>
        </div>
      </div>
      {isActive && (
        <div className="accordion-content">
          <ScrollableArea scrollStep={201} class="series-browser">
            {/* <ImageThumbnail /> */}
            <div
              // key={thumb.displaySetInstanceUID}
              className="thumbnail-container"
              data-cy="thumbnail-list"
            >
              {/* <Thumbnail
              // active={active}
              // supportsDrag={supportsDrag}
              // key={`${studyIndex}_${thumbIndex}`}
              // id={`${studyIndex}_${thumbIndex}`} // Unused?
              // Study
              // StudyInstanceUID={StudyInstanceUID} // used by drop
              // Thumb
              // altImageText={altImageText}
              // imageId={imageId}
              // InstanceNumber={InstanceNumber}
              // displaySetInstanceUID={displaySetInstanceUID} // used by drop
              // numImageFrames={numImageFrames}
              // SeriesDescription={SeriesDescription}
              // SeriesNumber={SeriesNumber}
              // hasWarnings={hasWarnings}
              // stackPercentComplete={stackPercentComplete}
              // Events
              /> */}
            </div>
          </ScrollableArea>
        </div>
      )}
    </div>
  );
};

export default Jobs;
