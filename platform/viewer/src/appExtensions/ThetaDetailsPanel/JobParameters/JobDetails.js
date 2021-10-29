import React, { useEffect } from 'react';
import axios from 'axios';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import '../AITriggerComponent.css';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';
import { connect } from 'react-redux';
import { servicesManager } from './../../../App';

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

  const { UINotificationService } = servicesManager.services;

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
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // setting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    setElement(element);

    const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');

    const image = cornerstone.getImage(element);

    console.log({ image });

    if (tool_data && tool_data.data.length > 0) {
      // console.log({ toolData: tool_data.data[0] });
      setToolData(tool_data.data[0]);

      let startX = parseInt(tool_data.data[0].handles.start.x.toFixed(2));
      let startY = parseInt(tool_data.data[0].handles.start.y.toFixed(2));
      let endX = parseInt(tool_data.data[0].handles.end.x.toFixed(2));
      let endY = parseInt(tool_data.data[0].handles.end.y.toFixed(2));

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
  }, []);

  const triggerJob = () => {
    const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');
    const data = tool_data.data[0];
    sendParams(data);
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
    // console.log({ data, viewport });
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

    console.log({ body });

    await client
      .post(`/texture`, body)
      .then(response => {
        console.log({ response });
        cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(
          {}
        );
        cornerstone.updateImage(element);

        if (response.status === 202) {
          UINotificationService.show({
            message:
              'Job triggered successfully. Please wait for it to be complete.',
          });
        }

        // clearing all params
        clearParams();
      })
      .catch(error => {
        console.log(error);
      });
  };

  return (
    <div className="component">
      <div className="title-header">Parameters</div>
      {Object.keys(toolData).length > 0 && (
        <div>
          <h4>Dimensions </h4>
          <p>
            <b>Width:</b> {width}
          </p>
          <p>
            <b>Height:</b> {height}
          </p>
          <h4>Coordinates</h4>
          <p>
            <b>x:</b> {x}
          </p>
          <p>
            <b>y:</b> {y}
          </p>
        </div>
      )}
      <br />

      <label>
        <div className="triggerButton">
          <button
            onClick={triggerJob}
            disabled={isDisabled}
            className="syncButton"
          >
            Trigger Job
          </button>
        </div>
      </label>
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
