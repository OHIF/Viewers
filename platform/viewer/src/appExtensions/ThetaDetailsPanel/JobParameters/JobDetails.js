import React, { useEffect } from 'react';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import '../AITriggerComponent.css';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';
import { connect } from 'react-redux';

const JobParameters = (props) => {
  const [isDisabled, setIsDisabled] = React.useState(true);
  const [toolData, setToolData] = React.useState({});
  const [startX, setStartX] = React.useState();
  const [startY, setStartY] = React.useState();
  const [endX, setEndX] = React.useState();
  const [endY, setEndY] = React.useState();
  const [width, setWidth] = React.useState();
  const [height, setHeight] = React.useState();
  const [element, setElement] = React.useState();
  const [user, setUser] = React.useState();

  useEffect(() => {
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // setting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    setElement(element);

    const toolData = cornerstoneTools.getToolState(element, 'RectangleRoi');

    if (toolData && toolData.data.length > 0) {
      setToolData(toolData.data[0]);
      setStartX(toolData.data[0].handles.start.x.toFixed(2));
      setStartY(toolData.data[0].handles.start.y.toFixed(2));
      setEndX(toolData.data[0].handles.end.x.toFixed(2));
      setEndY(toolData.data[0].handles.end.y.toFixed(2));
      setHeight(toolData.data[0].handles.textBox.boundingBox.height.toFixed(2));
      setWidth(toolData.data[0].handles.textBox.boundingBox.width.toFixed(2));
      setIsDisabled(false);
    }
  }, []);

  const triggerJob = () => {
    const toolData = cornerstoneTools.getToolState(element, 'RectangleRoi');
    const data = toolData.data[0];

    setUser(props.user);

    // console.log('User', props.user);
  };

  return (
    <div className="component">
      <div className="title-header">Parameters</div>
      {Object.keys(toolData).length > 0 && (
        <div>
          <h4>Dimension: </h4>
          <p>
            <b>Width:</b> {width}
          </p>
          <p>
            <b>Height:</b> {height}
          </p>
          <h4>Handles Start</h4>
          <p>
            <b>x:</b> {startX}
          </p>
          <p>
            <b>y:</b> {startY}
          </p>
          <h4>Handles End</h4>
          <p>
            <b>x:</b> {endX}
          </p>
          <p>
            <b>y:</b> {endY}
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
