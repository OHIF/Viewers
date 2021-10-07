import React, { useEffect } from 'react';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import '../AITriggerComponent.css';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';

const JobParameters = () => {
  const [isDisabled, setIsDisabled] = React.useState(true);
  const [toolData, setToolData] = React.useState({});
  const [startX, setStartX] = React.useState();
  const [startY, setStartY] = React.useState();
  const [endX, setEndX] = React.useState();
  const [endY, setEndY] = React.useState();
  const [width, setWidth] = React.useState();
  const [height, setHeight] = React.useState();

  useEffect(() => {
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // setting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    const toolData = cornerstoneTools.getToolState(element, 'RectangleRoi');

    console.log(toolData);

    if (toolData && toolData.data.length > 0) {
      console.log(toolData.data[0]);
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
    console.log('Trigger button called');
  };

  return (
    <div className="component">
      <div className="title-header">Parameters</div>
      {toolData && (
        <div>
          <h4>Dimension: </h4>
          <p>Width: {width}</p> <p>Height: {height} </p>
          <h4>Handles Start</h4>
          <p>x: {startX}</p> <p>y: {startY}</p>
          <h4>Handles End</h4>
          <p>x: {endX}</p> <p>y: {endY}</p>
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

export default JobParameters;
