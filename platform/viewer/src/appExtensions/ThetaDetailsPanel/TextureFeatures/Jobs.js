import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ScrollableArea } from '../../../../../ui/src/ScrollableArea/ScrollableArea';
import ImageThumbnail from '../../../../../ui/src/components/studyBrowser/ImageThumbnail';
import { Thumbnail } from '../../../../../ui/src/components/studyBrowser/Thumbnail';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';
import '../AITriggerComponent.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRunning,
  faExclamationTriangle,
  faCheckCircle,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import Images from './data';
import { JobsContext } from '../../../context/JobsContext';

const Jobs = ({ data, user, viewport, series }) => {
  const [isActive, setIsActive] = useState(false);
  const [isError, setIsError] = useState(false);
  const [textures, setTextures] = useState([]);
  const [description, setDescription] = useState([]);
  const [layerID, setLayerID] = useState();
  const { allSeriesState, setSeries } = useContext(JobsContext);
  const access_token = user.access_token;

  const path = window.location.pathname;

  const viewportSpecificData = viewport.viewportSpecificData[0];

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

  useEffect(() => {
    if (data.texture_uids) {
      setTextures(data.texture_uids);
      setDescription(data.texture_descriptions);
    }
  }, [data.texture_descriptions, data.texture_uids]);

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
    }
  };
  // Function for setting image id and performing overlay
  const handleOverlay = async instance => {
    const view_ports = cornerstone.getEnabledElements();

    const viewports = view_ports[0];

    // getting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    const image = cornerstone.getImage(element);

    const source_uid = image.imageId.split('/')[18];

    try {
      await client
        .get(`/instance?source=${source_uid}&texture=${instance}`)
        .then(response => {
          const image_id = response['data']['texture_instance_uid'];
          performOverlay(element, instance, image_id);
        });
    } catch (err) {
      console.log(err);
    }
  };
  const performOverlay = (element, series_uid, image_uid) => {
    // const imageIds = [];

    const image_id = `${base_url}/series/${series_uid}/instances/${image_uid}/frames/1`;

    // retrieving cornerstone enable element object
    let enabled_element = cornerstone.getEnabledElement(element);

    const currentImageIndex =
      enabled_element.toolStateManager.toolState.stack.data[0]
        .currentImageIdIndex;

    console.log({ CurrentMainImageIndex: currentImageIndex });

    if (!enabled_element || !enabled_element.image) {
      return;
    }

    // Images.map(data => {
    //   const newImage = 'wadors:' + data + '/frames/1';
    //   imageIds.push(newImage);
    // });

    // imageIds.push(image_id);

    // const stack = {
    //   currentImageIdIndex: 0,
    //   imageIds: imageIds,
    // };

    // const synchronizerImage = new cornerstoneTools.Synchronizer(
    //   'cornerstonenewimage',
    //   cornerstoneTools.stackImagePositionSynchronizer
    // );

    cornerstone.loadImage(image_id).then(image => {
      // Getting all layers
      const all_layers = cornerstone.getLayers(element);
      if (all_layers.length > 1) {
        cornerstone.removeLayer(element, all_layers[1].layerId);
        cornerstone.updateImage(element);
        setLayerID();
      }

      const options = {
        opacity: 0.5,
        viewport: {
          colormap: 'hotIron',
        },
      };

      // adding layer to current viewport
      const layerId = cornerstone.addLayer(element, image, options);
      // console.log({ layerId });

      // set new layer id from above added layer
      setLayerID(layerId);

      // synchronizerImage.add(element);
      // cornerstoneTools.addStackStateManager(element, ['stack']);
      // cornerstoneTools.addToolState(element, 'stack', stack);
      // cornerstoneTools.setToolActive('StackScrollMouseWheel', {
      //   mouseButtonMask: 1,
      //   synchronizationContext: synchronizerImage,
      // });

      cornerstone.updateImage(element);
    });

    element.addEventListener('cornerstonenewimage', event => {
      const eventData = event.detail;

      const currentImageIdIndex =
        eventData.enabledElement.toolStateManager.toolState.stack.data[0]
          .currentImageIdIndex;

      console.log({ currentImageIdIndex });
      getImageUrl(element, currentImageIdIndex);
    });
  };

  const removeOverlay = () => {
    const view_ports = cornerstone.getEnabledElements();

    const viewports = view_ports[0];

    // getting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    const all_layers = cornerstone.getLayers(element);
    if (all_layers.length > 1) {
      cornerstone.removeLayer(element, all_layers[1].layerId);
      cornerstone.updateImage(element);
      setLayerID();
    }

    // removing event listener for the cornerstone added new image
    element.removeEventListener('cornerstonenewimage', event => {
      console.log({ removeListener: event });
    });
  };

  const getImageUrl = (element, imageIndex) => {
    const chosen_series = allSeriesState.filter(new_data => {
      return new_data.SeriesInstanceUID === series;
    });

    if (chosen_series && chosen_series.length > 0) {
      const images = chosen_series[0].instances.filter((instance, index) => {
        console.log({ imageIndex, index, instance });
        return index === imageIndex;
      });

      const image_id = 'wadors:' + images[0].baseWadoRsUri + '/frames/1';

      cornerstone.loadImage(image_id).then(image => {
        // Getting all layers
        const all_layers = cornerstone.getLayers(element);
        if (all_layers.length > 1) {
          cornerstone.removeLayer(element, all_layers[1].layerId);
          cornerstone.updateImage(element);
          setLayerID();
        }

        const options = {
          opacity: 0.5,
          viewport: {
            colormap: 'hotIron',
          },
        };

        const layerId = cornerstone.addLayer(element, image, options);

        setLayerID(layerId);

        cornerstone.updateImage(element);
      });
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
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          <div>
            {data.status === 'RUNNING' && <FontAwesomeIcon icon={faRunning} />}
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
                      className="texture_uids"
                      key={index}
                      onClick={() => handleOverlay(texture)}
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
                <p>{data.error_message.exception.match(/'(.*?)'/g)}</p>
              </div>
            </ScrollableArea>
          </div>
        )}
        {layerID && (
          <label>
            <br></br>
            <div className="triggerButton">
              <button onClick={removeOverlay} className="syncButton">
                Remove Overlay
              </button>
              <br></br>
            </div>
            <br></br>
          </label>
        )}
      </div>
    </div>
  );
};
export default Jobs;
