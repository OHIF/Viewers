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
import { radcadapi } from '../../../utils/constants';
import eventBus from '../../../lib/eventBus';

const Jobs = ({
  data,
  user,
  viewport,
  series,
  instances,
  isActive,
  setIsActive,
}) => {
  const elementRef = useRef();
  const overlayRef = useRef(false);
  const cachedRef = useRef(false);
  const instanceRef = useRef();
  const layerRef = useRef();
  const opacityRef = useRef();
  const colorMapRef = useRef();
  const statusRef = useRef();
  const [isError, setIsError] = useState(false);
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

  let path = window.location.pathname;
  path = path.replace('radionics', 'projects');
  const base_url = `wadors:https://healthcare.googleapis.com/v1${path.replace(
    'study',
    'dicomWeb/studies'
  )}`;

  // useEffect for checking data status
  useEffect(() => {
    if (data.status === 'RUNNING') {
      statusRef.current = data.status;
    }

    if (statusRef.current === 'RUNNING' && data.status === 'DONE') {
      cornerstone.imageCache.purgeCache();
      localStorage.setItem('radiomicsDone', JSON.stringify(1));
      window.location.reload();
    }
  }, [data.status]);

  useEffect(() => {
    eventBus.dispatch('jobstatus', {
      data,
      instances,
    });
  }, [data]);

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
  }, [eventFunction]);

  // this is for checking and setting textures and description
  useEffect(() => {
    if (data.texture_uids) {
      setTextures(data.texture_uids);
      setDescription(data.texture_descriptions);
    }
  }, [data.texture_descriptions, data.texture_uids]);

  // useEffect function for removing overlay when status changes
  useEffect(() => {
    (async () => {
      if (
        overlayStatus === false &&
        overlayRef.current === true &&
        instanceRef.current !== null
      ) {
        await removeOverlay();
      } else {
        return;
      }
    })();
  }, [overlayStatus]);

  useEffect(() => {
    opacityRef.current = opacityStatus;
    colorMapRef.current = colorMapStatus;
  }, [opacityStatus, colorMapStatus]);

  // function for showing jobs if jobs data is available
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
  const handleOverlay = async seriesUID => {
    // remove previous overlay if it exists
    if (overlayRef.current === true) {
      await removeOverlay();
      // changing overlay status to false
      overlayRef.current = false;
      instanceRef.current = seriesUID;
    }

    instanceRef.current = seriesUID;

    setIsInstance(seriesUID);

    // getting current canvas element
    const element = elementRef.current;
    if (!element) {
      return;
    }

    // get current image
    const image = cornerstone.getImage(element);

    // extract source id from the derived image data
    const source_uid = image.imageId.split('/')[18];

    const source_series_uid = image.imageId.split('/')[16];

    try {
      var requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      };

      await fetch(
        `${radcadapi}/instance?source=${source_uid}&texture=${seriesUID}`,
        requestOptions
      )
        .then(r => r.json().then(data => ({ status: r.status, data: data })))
        .then(response => {
          const image_id = response['data']['texture_instance_uid'];
          performOverlay(seriesUID, image_id);
        });
    } catch (err) {
      console.log(err);
    }
  };

  // function for deriving image id and then adding image
  const performOverlay = (series_uid, instance_uid) => {
    if (base_url.endsWith('/')) {
      const image_id = `${base_url}series/${series_uid}/instances/${instance_uid}/frames/1`;
      console.log('WithSlash', { image_id });
      addImageLayer(image_id);
    } else {
      const image_id = `${base_url}/series/${series_uid}/instances/${instance_uid}/frames/1`;
      console.log('WithoutSlash', { image_id });
      addImageLayer(image_id);
    }
  };

  // function for loading an image and setting it as an added layer
  const addImageLayer = async image_id => {
    await cornerstone
      .loadImage(image_id)
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
      })
      .catch(error => {
        console.log(error);
      });
  };

  // function for getting new image during overlay scroll activity
  const eventFunction = event => {
    if (overlayRef.current === false) {
      return;
    } else {
      const eventData = event.detail;

      // getting the current index of the image in the stack
      const current_image_index =
        eventData.enabledElement.toolStateManager.toolState.stack.data[0]
          .currentImageIdIndex;

      // getting the current object of the image in the stack
      const current_image_array =
        eventData.enabledElement.toolStateManager.toolState.stack.data[0];

      const current_image_id =
        current_image_array.imageIds[current_image_index];

      // get current image
      const image = cornerstone.getImage(elementRef.current);

      const source_series_uid = image.imageId.split('/')[16];

      sourceAndInstance(
        source_series_uid,
        instanceRef.current,
        current_image_id
      );
    }
  };

  // function for caching all texture image instances using cornerstone
  const cacheEntireSeries = series => {
    if (
      cachedRef.current === true &&
      series[0].SeriesInstanceUID === instanceRef.current
    ) {
      return;
    } else {
      const instances = series[0].instances;

      const promises = [];

      instances.map(instance => {
        if (instance.wadorsuri.includes('wadors:') === false) {
          const image_id = 'wadors:' + instance.wadorsuri;
          instance.wadorsuri = image_id;
          const loadPromise = cornerstone.loadAndCacheImage(image_id);
          promises.push(loadPromise);
        } else {
          const loadPromise = cornerstone.loadAndCacheImage(instance.wadorsuri);
          promises.push(loadPromise);
        }
      });

      cachedRef.current = true;
      Promise.all(promises);
    }
  };

  // function for removing all overlays added to the base image / canvas
  const removeOverlay = async () => {
    return new Promise((res, rej) => {
      setTimeout(() => {
        try {
          const element = elementRef.current;
          if (!element) {
            res(true);
          }

          setIsInstance('');

          // set overlay and instance status to defaults
          overlayRef.current = false;
          instanceRef.current = null;

          const all_layers = cornerstone.getLayers(element);
          if (all_layers.length > 1) {
            cornerstone.removeLayer(element, all_layers[1].layerId);
            cornerstone.updateImage(element);
          }

          // update overlay status in the jobs context api
          setOverlayStatus(false);
          cachedRef.current = false;
          // cornerstone.imageCache.purgeCache();
          res(true);
        } catch (error) {
          console.warn('removeOverlay caught', { error });
          rej(false);
        }
      }, 1500);
    });
  };

  // Getting all source and instance
  const sourceAndInstance = (source, instance, image_id) => {
    // getting the current source series with metadata
    const selectedSourceSeries = allSeriesState.filter(new_data => {
      if (new_data.SeriesInstanceUID === source) {
        return new_data;
      }
    });

    // getting the current selected texture series with metadata
    const selectedInstanceSeries = allSeriesState.filter(new_data => {
      if (new_data.SeriesInstanceUID === instance) {
        return new_data;
      }
    });

    if (selectedInstanceSeries && selectedInstanceSeries.length > 0) {
      cacheEntireSeries(selectedInstanceSeries);

      // adding a wadors to all instances wadorsuri to allow comparism
      if (selectedSourceSeries && selectedSourceSeries.length > 0) {
        const images = selectedSourceSeries[0].instances.map(instance => {
          if (instance.wadorsuri.includes('wadors:') === false) {
            const image_id = 'wadors:' + instance.wadorsuri;
            instance.wadorsuri = image_id;
          }
          return instance;
        });
        selectedSourceSeries[0].instances = images;
      }

      // comparing the instances selected source series and matching to image
      const foundCurrentImage = selectedSourceSeries[0].instances.filter(
        instance => {
          if (instance.wadorsuri === image_id) {
            return instance;
          }
        }
      );

      // getting the slicelocation of the current image from the source series
      const source_slice_location = foundCurrentImage[0].metadata.SliceLocation;

      // comparing the instances selected source series and matching to image
      const foundTextureImage = selectedInstanceSeries[0].instances.filter(
        instance => {
          if (instance.metadata.SliceLocation === source_slice_location) {
            return instance;
          }
        }
      );

      // getting the slicelocation of the current image from the source series
      const texture_slice_location =
        foundTextureImage[0].metadata.SliceLocation;

      const texture_image = foundTextureImage[0].wadorsuri;

      if (texture_image.includes('wadors:') === false) {
        const image_id = 'wadors:' + texture_image;
        addImageLayer(image_id);
      } else {
        addImageLayer(texture_image);
      }
      // console.log({
      //   selectedSourceSeries,
      //   selectedInstanceSeries,
      //   image_id,
      //   foundCurrentImage,
      //   foundTextureImage,
      //   source_slice_location,
      //   texture_slice_location,
      // });
    }
  };

  return (
    <div>
      <div className="accordion-item">
        <div className="accordion-title" onClick={show}>
          <div>
            <b>Job {data.job}</b>
          </div>
          {/* Not the best way to go about this */}
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          <div>
            {data.status === 'RUNNING' && (
              <div>
                <FontAwesomeIcon icon={faRunning} />
                &nbsp; {data.instances_done}/{instances}
              </div>
            )}
            {data.status === 'PENDING' && <FontAwesomeIcon icon={faSpinner} />}
            {data.status === 'ERROR' && (
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                onClick={showError}
              />
            )}
            {data.status === 'DONE' && <FontAwesomeIcon icon={faCheckCircle} />}
          </div>
        </div>

        {/* Accordion content when Job is Done */}
        {isActive && (
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
                  There is an error creating this job. Please &nbsp;
                  <a className="reveal-error" onClick={showErrorMessage}>
                    click here
                  </a>
                  &nbsp; for more details
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
                  {data.error_message.exception.match(/'(.*?)'/g)}. &nbsp;
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
