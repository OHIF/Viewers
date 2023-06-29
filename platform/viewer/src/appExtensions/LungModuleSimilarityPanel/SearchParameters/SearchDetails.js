import React, { useContext, useEffect } from 'react';
import axios from 'axios';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import '../LungModuleSimilarityPanel.css';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';
import { connect } from 'react-redux';
import { servicesManager } from '../../../App';
import { JobsContext } from '../../../context/JobsContext';
import { withModal } from '@ohif/ui';
import { Tooltip } from '../../../../../ui/src/components/tooltip';
import ExpandableToolMenu from '../../../../../ui/src/viewer/ExpandableToolMenu';
import circularLoading from '../../ThetaDetailsPanel/TextureFeatures/utils/circular-loading.json';
import { useLottie } from 'lottie-react';
import eventBus from '../../../lib/eventBus';
import { radcadapi } from '../../../utils/constants';

function getMalignantScore(data) {
  const knnLength = data.knn.length;
  const malignantCount = data.knn.filter(item => item.malignant).length;
  return malignantCount + '/' + knnLength;
}

const RenderSimilarityResult = ({ data, imgDimensions }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: imgDimensions.width,
          height: imgDimensions.height,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: data.region_rectangle.x,
            top: data.region_rectangle.y,
            width: data.region_rectangle.w,
            height: data.region_rectangle.h,
            border: data.malignant ? '3px solid red' : '3px solid blue',
          }}
        />
        <img
          src={data.image_url}
          style={{
            flex: 1,
            marginBottom: 20,
          }}
        />
      </div>
    </div>
  );
};

export const RenderLoadingIcon = ({ size }) => {
  const options = {
    animationData: circularLoading,
    loop: true,
    autoplay: true,
  };

  const { View: Loader } = useLottie(options);

  return (
    <div
      style={{
        height: size,
        width: size,
        position: 'relative',
        display: 'flex',
      }}
    >
      <div
        style={{
          width: '300%',
          height: '300%',
          display: 'flex',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {Loader}
      </div>
    </div>
  );
};

export const RenderLoadingModal = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex:7,
      }}
    >
      <RenderLoadingIcon size={70} />
      <p
        style={{
          color: 'white',
        }}
      >
        Please Wait..
      </p>
    </div>
  );
};

const RenderSimilarityResultText = ({ content, res, title }) => (
  <p
    style={{
      color: 'white',
      alignSelf: 'flex-start',
      padding: 0,
      margin: 0,
      marginLeft: 20,
      ...(title === 'Malignant' && { color: res.malignant ? 'red' : 'blue' }),
    }}
  >
    {content}
  </p>
);

const SearchDetails = props => {
  const { user, t, ...rest } = props;
  const [isDisabled, setIsDisabled] = React.useState(true);
  const [toolData, setToolData] = React.useState({});
  const [x, setX] = React.useState();
  const [y, setY] = React.useState();
  const xRef = React.useRef();
  const yRef = React.useRef();
  const widthRef = React.useRef();
  const heightRef = React.useRef();
  const [width, setWidth] = React.useState();
  const [height, setHeight] = React.useState();
  const [element, setElement] = React.useState();
  const [showListState, setShowListState] = React.useState(false);
  const [loadingState, setLoadingState] = React.useState(false);
  const [newSearchState, setNewSearchState] = React.useState(true);
  const {
    setResultsList,
    resultsListState,
    setSimilarityResultState,
    similarityResultState,
  } = useContext(JobsContext);

  const access_token = user.access_token;

  const client = axios.create({
    baseURL: radcadapi,
    // timeout: 90000,
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
    eventBus.on('triggerReload', data =>
      document.getElementById('trigger').click()
    );

    return () => {
      eventBus.remove('triggerReload');
    };
  });

  useEffect(() => {
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // setting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    setElement(element);

    // retrieving rectangle tool roi data from element
    let tool_data = localStorage.getItem('mask');
    tool_data =
      tool_data && tool_data !== 'undefined' ? JSON.parse(tool_data) : {};

    // const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');
    if (tool_data) {
      // if (tool_data && tool_data.data.length > 0) {
      // setToolData(tool_data.data[0]);

      let startX = parseInt(tool_data.handles.start.x.toFixed(2));
      let startY = parseInt(tool_data.handles.start.y.toFixed(2));
      let endX = parseInt(tool_data.handles.end.x.toFixed(2));
      let endY = parseInt(tool_data.handles.end.y.toFixed(2));
      // let startX = parseInt(tool_data.data[0].handles.start.x.toFixed(2));
      // let startY = parseInt(tool_data.data[0].handles.start.y.toFixed(2));
      // let endX = parseInt(tool_data.data[0].handles.end.x.toFixed(2));
      // let endY = parseInt(tool_data.data[0].handles.end.y.toFixed(2));

      const x_min = Math.min(startX, endX);
      const x_max = Math.max(startX, endX);
      const y_min = Math.min(startY, endY);
      const y_max = Math.max(startY, endY);
      const width = x_max - x_min;
      const height = y_max - y_min;
      setX(x_min);
      setY(y_min);
      setHeight(height);
      setWidth(width);
      xRef.current = x_min;
      yRef.current = y_min;
      heightRef.current = height;
      widthRef.current = width;
      setIsDisabled(false);
    } else {
      initSearchPanel(element);
    }

    // Pull event from cornerstone-tools
    const { EVENTS } = cornerstoneTools;
    // element.addEventListener(EVENTS.MEASUREMENT_COMPLETED, eventhandler);

    // return () =>
    // element.removeEventListener(EVENTS.MEASUREMENT_COMPLETED, eventhandler);
  }, []);

  React.useEffect(() => {
    if (
      x !== xRef &&
      y !== yRef &&
      height !== heightRef &&
      width !== widthRef
    ) {
      setNewSearchState(true);
    }
  }, [x, y, width, height]);

  const eventhandler = event => {
    setIsDisabled(true);
    setToolData(event.detail.measurementData);
    let startX = parseInt(
      event.detail.measurementData.handles.start.x.toFixed(2)
    );
    let startY = parseInt(
      event.detail.measurementData.handles.start.y.toFixed(2)
    );
    let endX = parseInt(event.detail.measurementData.handles.end.x.toFixed(2));
    let endY = parseInt(event.detail.measurementData.handles.end.y.toFixed(2));

    const x_min = Math.min(startX, endX);
    const x_max = Math.max(startX, endX);
    const y_min = Math.min(startY, endY);
    const y_max = Math.max(startY, endY);
    const width = x_max - x_min;
    const height = y_max - y_min;
    setX(x_min);
    setY(y_min);
    setHeight(height);
    setWidth(width);
    xRef.current = x_min;
    yRef.current = y_min;
    heightRef.current = height;
    widthRef.current = width;
    setIsDisabled(false);
  };

  const triggerJob = () => {
    // const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');
    // const data = tool_data.data[0];
    let tool_data = localStorage.getItem('mask');
    tool_data =
      tool_data && tool_data !== 'undefined' ? JSON.parse(tool_data) : {};

    sendParams(tool_data);
  };

  const clearParams = () => {
    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.get(
      element,
      'RectangleRoi'
    );

    if (!toolState) {
      setToolData({});
      setX();
      setY();
      setHeight();
      setWidth();
      setIsDisabled(true);
    }
  };

  const initSearchPanel = async el => {
    // const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');
    console.log('init search data start');

    // const data = tool_data.data[0];
    // const series_uid = data.SeriesInstanceUID;
    // const study_uid = data.StudyInstanceUID;
    setLoadingState('list');
    const email = user.profile.email;

    // get current image
    const image = cornerstone.getImage(el);
    // extract instance uid from the derived image data
    const instance_uid = image.imageId.split('/')[18];

    console.log({ split: image.imageId.split('/'), instance_uid, email });
    let result = await new Promise(res =>
      fetchResults({ res, instance_uid, email })
    );
    console.log({ result });

    setLoadingState('');
    setSimilarityResultState(result.jobList[0]);
    setResultsList(result.jobList[0]);

    try {
      if (result.jobList[0].knn.length <= 0) {
        // UINotificationService.show({
        //   title: 'Similar looking scans failed to get results',
        //   type: 'error',
        //   autoClose: false,
        // });
      }
    } catch (error) {}
  };

  const fetchResults = async ({ jobId, res, instance_uid, email }) => {
    try {
      console.log('fetching from remote');
      // const email = user.profile.email;

      var requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      };

      let response = await fetch(
        `${radcadapi}/similarity?instance=${instance_uid}&email=${email}`,
        requestOptions
      );
      response = await response.json();

      // const response = await client.get(
      //   `/similarity?instance=${instance_uid}&email=nick.fragakis%40thetatech.ai`
      // );

      console.log({ response, jobId, instance_uid, email });
      if (jobId) {
        // let currJob;
        // if (response.results.length > 0) currJob = response.results[0];
        const currJob = response.results.find(result => {
          return result.job_id === jobId;
        });
        console.log({ currJob });

        if (currJob && currJob.status === 'DONE') {
          console.log('found job');

          res({ currJob, jobList: response.results });
        } else {
          console.log('waiting to retry');
          await setTimeout(() => {
            fetchResults({ jobId, res, instance_uid, email });
          }, 1000);
        }
      } else {
        res({ jobList: response.results });
      }
    } catch (error) {
      console.log('get similarity result caught', { error });
    }
  };

  const sendParams = async data => {
    const radiomicsDone = JSON.parse(
      localStorage.getItem('radiomicsDone') || 0
    );

    setLoadingState('searching', { data });

    const series_uid =
      data.SeriesInstanceUID || JSON.parse(localStorage.getItem('series_uid'));
    const study_uid =
      data.StudyInstanceUID ||
      JSON.parse(localStorage.getItem('studyInstanceUID'));
    // const email = user.profile.email;
    const email = 'nick.fragakis@thetatech.ai';

    // get current image
    const image = cornerstone.getImage(element);
    // extract instance uid from the derived image data
    const instance_uid = image.imageId.split('/')[18];
    setLoadingState('searching', { instance_uid });

    console.log({ instance_uid });

    const body = {
      study_uid: study_uid,
      series_uid: series_uid,
      email,
      instance_uid,
      parameters: {
        rectangle: {
          x: x,
          y: y,
          w: width,
          h: height,
        },
      },
    };

    var requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(body),
    };

    fetch(`${radcadapi}/similarity`, requestOptions)
      .then(r => r.json().then(data => ({ status: r.status, data: data })))
      .then(async response => {
        console.log('response-----search');
        console.log(response);
        if (response.status === 201) {
          console.log('fetching');
          let result = await new Promise(res =>
            fetchResults({ jobId: response.data.job, res, instance_uid, email })
          );

          console.log('found', { result });

          setNewSearchState(false);
          setLoadingState('');

          setSimilarityResultState(result.currJob);
          setResultsList(result.jobList);

          console.log({
            fetchscans: result.currJob,
          });

          const score = getMalignantScore(result.currJob);

          eventBus.dispatch('fetchscans', {
            ...result.currJob,
            score,
          });

          localStorage.setItem(
            'print-similarscans',
            JSON.stringify(result.jobList)
          );
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  function getMeta(url) {
    return new Promise((res, rej) => {
      var img = new Image();
      img.src = url;
      img.onload = function() {
        res({
          width: this.width,
          height: this.height,
        });
      };
    });
  }

  return (
    <div
      className="component"
      style={{
        backgroundColor: '#ffffff00',
      }}
    >
      <button
        style={{
          display: 'none',
        }}
        onClick={triggerJob}
        id="trigger"
        className="syncButton"
      >
        trigger
      </button>
      {loadingState && <RenderLoadingModal />}

      {similarityResultState ? (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            // paddingTop: 20,
          }}
        >
          <img
            crossOrigin="anonymous"
            src={similarityResultState.query}
            style={{
              width: 100,
              height: 100,
              marginBottom: 20,
              border: '2.55px solid green',
            }}
          />

          <div
            id="resetrow"
            style={{
              width: '100%',
              display: 'flex',
              // flexDirection: 'column',
              // flexWrap: 'wrap',
            }}
          >
            {similarityResultState.knn.map((res, index) => {
              return (
                // <>
                <div
                  style={{
                    width: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: 20,
                    paddingBottom: 20,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  key={index}
                  onClick={async () => {
                    console.log('open similarity modal');
                    const imgDimensions = await getMeta(res.image_url);

                    rest.modal.show({
                      content: () => (
                        <RenderSimilarityResult
                          data={res}
                          imgDimensions={imgDimensions}
                        />
                      ),
                      title: 'Similarity Result',
                    });
                  }}
                >
                  <div
                    style={{
                      width: '90%',
                      paddingBottom: '90%', // This maintains the 1:1 aspect ratio
                      position: 'relative', // Enables positioning of child elements
                    }}
                  >
                    <img
                      crossOrigin="anonymous"
                      src={res.region_thumbnail_url}
                      style={{
                        position: 'absolute', // Positions the image within the div
                        top: 0,
                        left: 0,
                        width: '100%', // Sets image width to full size of parent div
                        height: '100%', // Sets image height to full size of parent div
                        border: '2.55px solid blue',
                        borderColor: res.malignant ? 'red' : 'blue',
                      }}
                    />
                  </div>

                  <RenderSimilarityResultText
                    content={`Similarity: ${res.similarity_score}`}
                    res={res}
                  />
                  <RenderSimilarityResultText
                    content={`Dataset: ${res.dataset}`}
                    res={res}
                  />
                  <RenderSimilarityResultText
                    content={`Dataset Id: ${res.data_id}`}
                    res={res}
                  />
                  <RenderSimilarityResultText
                    content={`Malignant: ${res.malignant ? 'true' : 'false'}`}
                    res={res}
                    title={'Malignant'}
                  />
                </div>
                // </>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
    viewport: state.viewports,
  };
};

const ConnectedSearchDetails = connect(
  mapStateToProps,
  null
)(SearchDetails);

export default withModal(ConnectedSearchDetails);
