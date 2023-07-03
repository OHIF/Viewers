import React, { useEffect, useContext, useRef, useState } from 'react';
import '../AITriggerComponent.css';
import Jobs from './Jobs';
import { connect } from 'react-redux';
import { JobsContext } from '../../../context/JobsContext';
import circularLoading from './utils/circular-loading.json';
import { useLottie } from 'lottie-react';
import { radcadapi } from '../../../utils/constants';

const TextureFeature = props => {
  const [jobs, setJobs] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user, viewport } = props;
  const [isActive, setIsActive] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const access_token = user.access_token;
  // const email = user.profile.email;
  const email = 'nick.fragakis@thetatech.ai';

  const series = viewport.viewportSpecificData[0].SeriesInstanceUID;
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);
  const instancesRef = useRef();
  const jobsLengthRef = useRef(0);
  const jobsStatusRef = useRef('');

  const options = {
    animationData: circularLoading,
    loop: true,
    autoplay: true,
  };

  const { View: Loader } = useLottie(options);


  useEffect(() => {
    const interval = setInterval(() => {
      getJobs(jobs);
    }, 2000);
    return () => clearInterval(interval);
  }, [getJobs, jobs]);

  // getting all jobs for the current series being displayed in viewport
  const getJobs = async jobsArr => {
    try {
      var requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      };

      await fetch(
        `${radcadapi}/jobs?series=${series}&email=${email}`,
        requestOptions
      )
        .then(r => r.json().then(data => ({ status: r.status, data: data })))
        .then(response => {
          // console.log({ lastJob: response.data });
          instancesRef.current = response.data.instances;
          if (
            response.data.jobs.length !== jobsLengthRef.current ||
            response.data.jobs[0].status !== 'DONE' ||
            (response.data.jobs[0].status === 'DONE' &&
              jobs[0].status !== 'DONE')
          ) {
            setIsActive(false);
            setJobs([...response.data.jobs]);
            jobsLengthRef.current = response.data.jobs.length;
          }
          setIsLoading(false);
        });
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const removeOverlay = () => {
    setOverlayStatus(false);
  };

  let filterjobs = jobs;
  if (filterjobs.length > 0 && showMore) filterjobs = filterjobs.slice(0, 1);

  return (
    <div className="component">
      {/* <div className="title-header">Texture Features</div> */}

      {isLoading && <div className="loader">{Loader}</div>}

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

      {!isLoading && filterjobs.length > 0 && (
        <>
          <div className="accordion">
            {filterjobs.map((data, index) => (
              <Jobs
                key={index}
                user={user}
                viewport={viewport}
                series={series}
                data={data}
                instances={instancesRef.current}
                isActive={isActive === index}
                setIsActive={() => {
                  if (isActive === index) {
                    setIsActive(false);
                  } else {
                    setIsActive(index);
                  }
                }}
              />
            ))}
          </div>
          <button onClick={() => setShowMore(!showMore)} className="syncButton">
            {showMore ? 'Show More' : 'Show less'}
          </button>
        </>
      )}

      {!isLoading && filterjobs.length <= 0 && (
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
