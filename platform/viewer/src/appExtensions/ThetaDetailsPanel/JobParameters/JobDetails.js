import React, { useContext, useEffect } from 'react';
import axios from 'axios';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import '../AITriggerComponent.css';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';
import { connect } from 'react-redux';
import { servicesManager } from './../../../App';
import { JobsContext } from '../../../context/JobsContext';
import classNames from 'classnames';
import { radcadapi } from '../../../utils/constants';

const JobParameters = props => {
  const { user, viewport } = props;
  const [isDisabled, setIsDisabled] = React.useState(true);
  const [toolData, setToolData] = React.useState({});
  const [startX, setStartX] = React.useState();
  const [startY, setStartY] = React.useState();
  const [endX, setEndX] = React.useState();
  const [endY, setEndY] = React.useState();
  const [x, setX] = React.useState();
  const [y, setY] = React.useState();
  const [width, setWidth] = React.useState();
  const [height, setHeight] = React.useState();
  const [element, setElement] = React.useState();
  const { allSeriesState } = useContext(JobsContext);

  const [activeTab, setActiveTab] = React.useState(false);
  const [opacity, setOpacity] = React.useState(0.5);
  const [sync, setSync] = React.useState(false);
  const [colorMap, setColorMap] = React.useState('spectral');
  const [enabledElement, setEnabledElement] = React.useState({});
  const [layers, setLayers] = React.useState([]);
  const [acLayer, setAcLayer] = React.useState('');
  const colors = cornerstone.colors.getColormapsList();
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);
  const { opacityStatus, setOpacityStatus } = useContext(JobsContext);
  const { colorMapStatus, setColorMapStatus } = useContext(JobsContext);
  const { UINotificationService } = servicesManager.services;

  const access_token = user.access_token;

  const client = axios.create({
    baseURL: radcadapi,
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
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // setting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    setElement(element);

    // retrieving rectangle tool roi data from element
    // const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');
    let tool_data = localStorage.getItem('mask');
    tool_data =
      tool_data && tool_data !== 'undefined' ? JSON.parse(tool_data) : {};

    // if (tool_data && tool_data.data.length > 0) {
    if (tool_data) {
      // setToolData(tool_data.data[0]);
      setToolData(tool_data);

      // let startX = parseInt(tool_data.data[0].handles.start.x.toFixed(2));
      // let startY = parseInt(tool_data.data[0].handles.start.y.toFixed(2));
      // let endX = parseInt(tool_data.data[0].handles.end.x.toFixed(2));
      // let endY = parseInt(tool_data.data[0].handles.end.y.toFixed(2));

      let startX = parseInt(tool_data.handles.start.x.toFixed(2));
      let startY = parseInt(tool_data.handles.start.y.toFixed(2));
      let endX = parseInt(tool_data.handles.end.x.toFixed(2));
      let endY = parseInt(tool_data.handles.end.y.toFixed(2));

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
      setIsDisabled(false);
    }

    // retrieving cornerstone enable element object
    const enabled_element = cornerstone.getEnabledElement(element);
    if (!enabled_element || !enabled_element.image) {
      return;
    }

    // retriveing all current layers
    const allLayers = cornerstone.getLayers(element);

    if (allLayers.length <= 0) {
      createBaseLayerControl(element, enabled_element.image.imageId);
    }

    setTimeout(() => {
      // getting active layer for modification
      const layer = cornerstone.getActiveLayer(element);

      if (!layer) return;

      // updating all state variables to their new values
      setSync(enabled_element.syncViewports);
      setAcLayer(layer.layerId);
      setLayers([...allLayers]);
      setElement(viewports.element);
      setEnabledElement(viewports);
    }, 700);

    // Pull event from cornerstone-tools
    // const { EVENTS } = cornerstoneTools;
    // element.addEventListener(EVENTS.MEASUREMENT_COMPLETED, eventhandler);

    // return () =>
    // element.removeEventListener(EVENTS.MEASUREMENT_COMPLETED, eventhandler);
  }, []);

  useEffect(() => {
    const radiomicsDone = JSON.parse(
      localStorage.getItem('radiomicsDone') || 0
    );

    if (!isDisabled && radiomicsDone != 1)
      setTimeout(() => {
        document.getElementById('triggerNewJob').click();
      }, 1000);
  }, [isDisabled]);

  const triggerJob = () => {
    let tool_data = localStorage.getItem('mask');
    tool_data =
      tool_data && tool_data !== 'undefined' ? JSON.parse(tool_data) : {};

    // const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');
    const data = tool_data;

    if (allSeriesState.length >= 1000) {
      UINotificationService.show({
        message: `Cannot create more than a 1000 textures as texture number limit has been reached. Please contact Tech Support for further assistance`,
        duration: 5000,
        type: 'error',
      });
      return;
    } else {
      sendParams(data);
    }
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

  const sendParams = async data => {
    const series_uid = data.SeriesInstanceUID;
    const study_uid = data.StudyInstanceUID;
    const email = user.profile.email;

    const body = {
      study_uid: study_uid,
      series_uid: series_uid,
      email: email,
      parameters: {
        rectangle: {
          x: x,
          y: y,
          w: width,
          h: height,
        },
      },
    };

    await client
      .post(`/texture`, body)
      .then(response => {
        // cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(
        //   {}
        // );
        // cornerstone.updateImage(element);

        if (response.status === 202) {
          UINotificationService.show({
            message:
              'Job triggered successfully. Please wait for it to be completed',
            duration: 5000,
          });
        }

        // clearing all params
        clearParams();

        // set stackscroll as active tool
        cornerstoneTools.setToolActive('StackScroll', { mouseButtonMask: 1 });
      })
      .catch(error => {
        console.log(error);
      });
  };

  // function for creating a base layer if non exists
  const createBaseLayerControl = (element, image_id) => {
    cornerstone.loadAndCacheImage(image_id).then(image => {
      // adding layer for the first stack of images
      const layer_id = cornerstone.addLayer(element, image);

      // Setting the new image layer as the active layer
      cornerstone.setActiveLayer(element, layer_id);

      // update the current image on the viewport with the new image
      cornerstone.updateImage(element);
    });
  };

  // function for changing opacity of active layer
  const onHandleOpacuty = event => {
    setOpacity(event.target.value);
    const all_layers = cornerstone.getLayers(element);
    if (all_layers.length > 1) {
      const layer = cornerstone.getLayer(element, all_layers[1].layerId);

      // setting prefered opacity for active layer
      layer.options.opacity = event.target.value;

      setOpacityStatus(event.target.value);

      // update the element to apply new settings
      cornerstone.updateImage(element);
    }
  };

  // function for changing the colormap for an active layer
  const onHandleColorChange = event => {
    // console.log(event.target.value);
    setColorMap(event.target.value);

    // getting all active layers in the current element
    const all_layers = cornerstone.getLayers(element);

    if (all_layers.length > 1) {
      const layer = cornerstone.getLayer(element, all_layers[1].layerId);

      // setting colormap to selected color
      layer.viewport.colormap = event.target.value;

      setColorMapStatus(event.target.value);

      // update the element to apply new settings
      cornerstone.updateImage(element);
    }
  };

  return (
    <div className="component">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'space-around',
          // flexWrap: 'wrap',
        }}
      >
        <div
          className={classNames('btn', {
            'btn-primary': true,
          })}
          onClick={() => setActiveTab(!activeTab)}
        >
          {activeTab ? ' Hide Layout Parameter' : ' Show Layout Parameter'}
        </div>
      </div>

      {activeTab && (
        <>
          <div className="title-header">Layer Controls</div>

          <h4>Opacity Settings</h4>
          <form>
            <label>
              <input
                id="imageOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={onHandleOpacuty}
                disabled={overlayStatus === true ? false : true}
              />
            </label>

            <h4>Color Maps</h4>
            <label>
              <select
                id="colormaps"
                className="select-container"
                onChange={onHandleColorChange}
                value={colorMap}
                disabled={overlayStatus === true ? false : true}
              >
                {colors.map((color, index) => (
                  <option key={index} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </label>
          </form>
        </>
      )}

      {Object.keys(toolData).length > 0 && (
        <div>
          <label>
            <div className="triggerButton">
              <button
                id="triggerNewJob"
                style={{
                  display: 'none',
                }}
                onClick={triggerJob}
                disabled={isDisabled}
                className="syncButton"
              >
                Trigger Job
              </button>
            </div>
          </label>
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

const ConnectedJobParameters = connect(
  mapStateToProps,
  null
)(JobParameters);

export default ConnectedJobParameters;

// const eventhandler = event => {
//   setIsDisabled(true);
//   setToolData(event.detail.measurementData);
//   let startX = parseInt(
//     event.detail.measurementData.handles.start.x.toFixed(2)
//   );
//   let startY = parseInt(
//     event.detail.measurementData.handles.start.y.toFixed(2)
//   );
//   let endX = parseInt(event.detail.measurementData.handles.end.x.toFixed(2));
//   let endY = parseInt(event.detail.measurementData.handles.end.y.toFixed(2));

//   const x_min = Math.min(startX, endX);
//   const x_max = Math.max(startX, endX);
//   const y_min = Math.min(startY, endY);
//   const y_max = Math.max(startY, endY);
//   const width = x_max - x_min;
//   const height = y_max - y_min;
//   setX(x_min);
//   setY(y_min);
//   setHeight(height);
//   setWidth(width);
//   setIsDisabled(false);
// };
