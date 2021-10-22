import React, { useEffect } from 'react';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import '../AITriggerComponent.css';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';
import { connect } from 'react-redux';
import { servicesManager } from './../../../App';

const JobParameters = props => {
  const [isDisabled, setIsDisabled] = React.useState(true);
  const [toolData, setToolData] = React.useState({});
  const [startX, setStartX] = React.useState();
  const [startY, setStartY] = React.useState();
  const [x, setX] = React.useState();
  const [y, setY] = React.useState();
  const [width, setWidth] = React.useState();
  const [height, setHeight] = React.useState();
  const [element, setElement] = React.useState();

  const { UINotificationService } = servicesManager.services;

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

    if (tool_data && tool_data.data.length > 0) {
      console.log({ toolData: tool_data.data[0] });
      setToolData(tool_data.data[0]);
      setX(tool_data.data[0].handles.textBox.x.toFixed(2));
      setY(tool_data.data[0].handles.textBox.y.toFixed(2));
      setHeight(
        tool_data.data[0].handles.textBox.boundingBox.height.toFixed(2)
      );
      setWidth(tool_data.data[0].handles.textBox.boundingBox.width.toFixed(2));
      setIsDisabled(false);
    }
  }, []);

  const triggerJob = () => {
    const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');
    const data = tool_data.data[0];

    UINotificationService.show({
      message: 'Job triggered successfully.',
    });

    cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState({});
    cornerstone.updateImage(element);

    // clearing all params
    clearParams();
  };

  const clearParams = () => {
    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.get(element, 'RectangleRoi');

    if (!toolState) {
      setToolData({});
      setX();
      setY();
      setHeight();
      setWidth();
      setIsDisabled(true);
    }
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
  };
};

const ConnectedJobParameters = connect(
  mapStateToProps,
  null
)(JobParameters);

export default ConnectedJobParameters;
