import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { ScrollableArea } from '../../../../../ui/src/ScrollableArea/ScrollableArea';
import cornerstone from 'cornerstone-core';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';
import '../AITriggerComponent.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRunning,
  faExclamationTriangle,
  faCheckCircle,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { JobsContext } from '../../../context/JobsContext';
import lottie from 'lottie-web';
import progressLoading from './utils/progress-loading.json';

const Jobs = ({ data, user, viewport, series, instances }) => {
  const elementRef = useRef();
  const overlayRef = useRef(false);
  const instanceRef = useRef();
  const layerRef = useRef();
  const opacityRef = useRef();
  const colorMapRef = useRef();
  // const loadingRef = useRef(false);
  const [isActive, setIsActive] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);
  const [textures, setTextures] = useState([]);
  const [description, setDescription] = useState([]);
  const {
    opacityStatus,
    colorMapStatus,
    allSeriesState,
    isInstance,
    setIsInstance,
    overlayStatus,
    setOverlayStatus,
  } = useContext(JobsContext);
  const access_token = user.access_token;

  const path = window.location.pathname;

  const base_url = `wadors:https://healthcare.googleapis.com/v1${path.replace(
    'study',
    'dicomWeb/studies'
  )}`;

  // setting up client for API requests (centralize this client)
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
      animationData: progressLoading,
      renderer: 'svg',
      loop: true,
      autoplay: true,
    });
  }, []);

  // setting up useEffect for adding and removing an event listener
  useEffect(() => {
    const view_ports = cornerstone.getEnabledElements();

    const viewports = view_ports[0];

    // getting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    elementRef.current = element;

    elementRef.current.addEventListener('cornerstonenewimage', eventFunction);

    return () => {
      elementRef.current.removeEventListener(
        'cornerstonenewimage',
        eventFunction
      );
    };
  }, []);

  // this is for checking and setting textures and description
  useEffect(() => {
    if (data.texture_uids) {
      setTextures(data.texture_uids);
      setDescription(data.texture_descriptions);
    }
  }, [data.texture_descriptions, data.texture_uids]);

  // useEffect function for removing overlay when status changes
  useEffect(() => {
    if (overlayStatus === false) {
      removeOverlay();
    } else {
      return;
    }
  }, [overlayStatus]);

  useEffect(() => {
    opacityRef.current = opacityStatus;
    colorMapRef.current = colorMapStatus;
  }, [opacityStatus, colorMapStatus]);

  // Functionality for showing jobs if jobs data is available
  const show = () => {
    if (data.status === 'DONE') {
      setIsActive(!isActive);
    }
  };

  // function for displaying error message for the job
  const showError = () => {
    if (data.status === 'ERROR') {
      setIsError(!isError);
      setErrorMessage(false);
    }
  };

  // function for displaying error message for the developer
  const showErrorMessage = () => {
    if (isError === true) {
      setErrorMessage(!errorMessage);
      setIsError(!isError);
    } else {
      setErrorMessage(!errorMessage);
      setIsError(!isError);
    }
  };

  // Function for setting image id and performing overlay
  const handleOverlay = async instance => {
    // set loading to true
    setIsLoading(true);

    // remove previous overlay if it exists
    if (overlayRef.current === true) {
      removeOverlay();
      // changing overlay status to false
      overlayRef.current = false;
    }

    instanceRef.current = instance;
    setIsInstance(instance);

    // getting current canvas element
    const element = elementRef.current;
    if (!element) {
      return;
    }

    // get current image
    const image = cornerstone.getImage(element);

    // extract source id from the derived image data
    const source_uid = image.imageId.split('/')[18];

    try {
      await client
        .get(`/instance?source=${source_uid}&texture=${instance}`)
        .then(response => {
          const image_id = response['data']['texture_instance_uid'];
          performOverlay(instance, image_id);
        });
    } catch (err) {
      console.log(err);
    }
  };

  // functionality for deriving image id and then adding image
  const performOverlay = (series_uid, image_uid) => {
    // console.log({ series_uid });

    const image_id = `${base_url}/series/${series_uid}/instances/${image_uid}/frames/1`;

    // console.log({ image_id });

    // retrieving cornerstone enable element object
    let enabled_element = cornerstone.getEnabledElement(elementRef.current);

    if (!enabled_element || !enabled_element.image) {
      return;
    }

    addImageLayer(image_id);
  };

  // functionality for loading an image and setting it as an added layer
  const addImageLayer = async image_id => {
    await cornerstone
      .loadAndCacheImage(image_id)
      .then(image => {
        // Getting all layers
        const all_layers = cornerstone.getLayers(elementRef.current);

        // remove any previous layer if it exists so we don`t have multiple layers
        if (all_layers.length > 1) {
          cornerstone.removeLayer(elementRef.current, all_layers[1].layerId);
          cornerstone.updateImage(elementRef.current);
        }

        const options = {
          opacity: opacityRef.current,
          viewport: {
            colormap: colorMapRef.current,
          },
        };

        // adding layer to current viewport
        const layer_id = cornerstone.addLayer(
          elementRef.current,
          image,
          options
        );

        // set new layer id from above added layer
        layerRef.current = layer_id;

        // update overlay reference
        overlayRef.current = true;

        // update the overlay status in the jobs context api
        setOverlayStatus(true);

        // update the canvase with the all new data
        cornerstone.updateImage(elementRef.current);

        // set loader to false
        setIsLoading(false);
      })
      .catch(error => {
        console.log(error);
      });
  };

  // functionality for getting new image during overlay scroll activity
  const eventFunction = event => {
    setIsLoading(true);
    if (overlayRef.current === false) {
      return;
    } else {
      const eventData = event.detail;

      // getting the current index of the image in the stack
      const current_image_index =
        eventData.enabledElement.toolStateManager.toolState.stack.data[0]
          .currentImageIdIndex;
      getImageUrl(current_image_index, instanceRef.current);
    }
  };

  // functionality for getting image from list series available in the server
  const getImageUrl = (image_index, series_uid) => {
    const chosen_series = allSeriesState.filter(new_data => {
      if (new_data.SeriesInstanceUID === series_uid) {
        return new_data;
      }
    });

    if (chosen_series && chosen_series.length > 0) {
      cacheEntireSeries(chosen_series);

      const images = chosen_series[0].instances.filter((instance, index) => {
        if (index === image_index) {
          return instance;
        }
      });

      const image_id = 'wadors:' + images[0].wadorsuri;

      addImageLayer(image_id);
    }
  };

  // This method loads the image of each layer and resolve the
  // promise only after getting all of them loaded
  // function loadImages() {
  //   const promises = [];

  //   layers.forEach(function(layer) {
  //     const loadPromise = cornerstone.loadAndCacheImage(layer.imageId);
  //     promises.push(loadPromise);
  //   });

  //   return Promise.all(promises);
  // }

  const cacheEntireSeries = series => {
    const instances = series[0].instances;

    const promises = [];

    instances.map(instance => {
      const image_id = 'wadors:' + instance.wadorsuri;

      const loadPromise = cornerstone.loadAndCacheImage(image_id);
      promises.push(loadPromise);
    });

    Promise.all(promises);
  };

  // functionality for removing all overlays added to the base image / canvas
  const removeOverlay = () => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    setIsInstance('');

    const all_layers = cornerstone.getLayers(element);
    if (all_layers.length > 1) {
      cornerstone.removeLayer(element, all_layers[1].layerId);
      cornerstone.updateImage(element);
    }

    // update overlay status in the jobs context api
    setOverlayStatus(false);

    // set overlay and instance status to defaults
    overlayRef.current = false;

    instanceRef.current = undefined;
  };

  return (
    <div>
      <div className="accordion-item">
        {isLoading === true && <div id="loader-svg" />}

        {isActive && isLoading === false && (
          <div className="accordion-title" onClick={show}>
            <div>
              <b>Job {data.job}</b>
            </div>
            {/* Not the best way to go about this */}
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
            <div>
              {data.status === 'RUNNING' && (
                <div>
                  <FontAwesomeIcon icon={faRunning} />
                  &nbsp; {data.instances_done}/{instances}
                </div>
              )}
              {data.status === 'PENDING' && (
                <FontAwesomeIcon icon={faSpinner} />
              )}
              {data.status === 'ERROR' && (
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  onClick={showError}
                />
              )}
              {data.status === 'DONE' && (
                <FontAwesomeIcon icon={faCheckCircle} />
              )}
            </div>
          </div>
        )}

        {/* Accordion content when Job is Done */}
        {isActive && isLoading === false && (
          <div className="accordion-content">
            <ScrollableArea scrollStep={201} class="series-browser">
              {textures.length > 0 && (
                <div className="textures">
                  {textures.map((texture, index) => (
                    <li
                      key={index}
                      onClick={() => handleOverlay(texture)}
                      className={
                        isInstance === texture
                          ? 'selected-instance'
                          : 'texture_uids'
                      }
                    >
                      {description[index]}
                    </li>
                  ))}
                </div>
              )}
            </ScrollableArea>
          </div>
        )}
        {/* Accordion content when job has an error */}
        {isError && (
          <div className="accordion-content">
            <ScrollableArea scrollStep={201} class="series-browser">
              <div className="jobError">
                <p>
                  There is an error creating this job. Please{' '}
                  <a className="reveal-error" onClick={showErrorMessage}>
                    click here
                  </a>{' '}
                  for more details
                </p>
              </div>
            </ScrollableArea>
          </div>
        )}

        {/* Accordion content when job has an error */}
        {errorMessage && (
          <div className="accordion-content">
            <ScrollableArea scrollStep={201} class="series-browser">
              <div className="jobError">
                <p>
                  {data.error_message.exception.match(/'(.*?)'/g)}.
                  <a className="reveal-error" onClick={showErrorMessage}>
                    Go Back
                  </a>
                </p>
              </div>
            </ScrollableArea>
          </div>
        )}
      </div>
    </div>
  );
};
export default Jobs;
