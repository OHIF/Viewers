import React, { useEffect, useState } from 'react';
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

const Jobs = ({ data, user, viewport, series }) => {
  const [isActive, setIsActive] = useState(false);
  const [textures, setTextures] = useState([]);
  const [description, setDescription] = useState([]);
  const [layerID, setLayerID] = useState();
  // console.log(user.profile.email);
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
    // console.log({ data });
    if (data.texture_uids) {
      setTextures(data.texture_uids);
      setDescription(data.texture_descriptions);
    }
  }, []);

  // Functionality for showing jobs if jobs data is available
  const show = () => {
    if (data.status === 'DONE') {
      setIsActive(!isActive);
    }
  };

  // Function for setting image id and performing overlay
  const handleOverlay = instance => {
    // const image_id = `${base_url}/series/${series}/instances/${instance}/frames/1`;

    // console.log({ image_id });

    const image_id = `wadors:https://healthcare.googleapis.com/v1/projects/lungradcad-project/locations/us/datasets/Sample_Hospital/dicomStores/Sample_Department/dicomWeb/studies/1.3.6.1.4.1.14519.5.2.1.6450.4012.206382517630164051916496664467/series/1.2.826.0.1.3680043.8.498.11304309571167765720419441848296739121/instances/1.2.826.0.1.3680043.8.498.74644997802360878882857126969140009153/frames/1`;

    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // getting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    // retrieving cornerstone enable element object
    let enabled_element = cornerstone.getEnabledElement(element);
    if (!enabled_element || !enabled_element.image) {
      return;
    }

    cornerstone.loadImage(image_id).then(image => {
      // Getting all layers
      const all_layers = cornerstone.getLayers(element);

      if (all_layers.length > 1) {
        cornerstone.removeLayer(element, layerID);
        cornerstone.updateImage(element);
        setLayerID();
      }

      // adding layer to current viewport
      const layerId = cornerstone.addLayer(element, image);

      setLayerID(layerId);

      // Setting the new image layer as the active layer
      cornerstone.setActiveLayer(element, layerId);

      // Getting active layer
      const layer = cornerstone.getActiveLayer(element);

      //** Loop through all layers and set default options to non active layer */
      const every_layer = cornerstone.getLayers(element);

      for (let other_layer of every_layer) {
        if (layer.layerId === other_layer.layerId) {
          // change the opacity and colormap
          layer.options.opacity = parseFloat(0.5);
          layer.viewport.colormap = 'hotIron';

          // update the element to apply new settings
          cornerstone.updateImage(element);
        }
        // else {
        // change the opacity
        // other_layer.options.opacity = parseFloat(0.5);
        //   other_layer.viewport.colormap = 'gray';

        // update the element to apply new settings
        //   cornerstone.updateImage(element);
        // }
      }
    });
  };

  return (
    <div className="accordion-item">
      <div className="accordion-title" onClick={show}>
        <div>
          <b>Job {data.job}</b>
        </div>
        {/* Not the best way to go about this */}
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
        {/* <div>{isActive ? '-' : '+'}</div> */}
        <div>
          {data.status === 'RUNNING' && <FontAwesomeIcon icon={faRunning} />}
          {data.status === 'PENDING' && <FontAwesomeIcon icon={faSpinner} />}
          {data.status === 'ERROR' && (
            <FontAwesomeIcon icon={faExclamationTriangle} />
          )}
          {data.status === 'DONE' && <FontAwesomeIcon icon={faCheckCircle} />}
        </div>
      </div>
      {isActive && (
        <div className="accordion-content">
          <ScrollableArea scrollStep={201} class="series-browser">
            {textures.length > 0 && (
              <div className="textures">
                {textures.map((texture, index) => (
                  <ul key={index} onClick={() => handleOverlay(texture)}>
                    {description[index]}
                  </ul>
                ))}
              </div>
            )}
          </ScrollableArea>
        </div>
      )}
    </div>
  );
};

export default Jobs;
