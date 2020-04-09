import React, { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { select } from 'd3-selection';

import './TimecourseContent.css';

import { lineChart } from './chart';

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 350;

const DEFAULT_AXIS = {
  x: {
    label: 'Time',
    unit: 's',
    indexRef: 0,
    type: 'x',
  },
  y: {
    label: 'Signal Intensity',
    indexRef: 1,
    type: 'y',
  },
};

let defaultTimecourseInterval = 60; // 1 minute
let _peekIndex = 10;
let _glomerularIndex = 60;

function LineChartContainer({
  axis = DEFAULT_AXIS,
  timecourse,
  chartDimension,
  onPlacePoints,
  peekIndex = _peekIndex,
  glomerularIndex = _glomerularIndex,
  timecourseInterval = defaultTimecourseInterval,
}) {
  const d3Container = useRef(null);
  const chartRef = useRef(null);
  const { width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = chartDimension;

  useEffect(() => {
    if (timecourse && d3Container.current) {
      const d3Content = select(d3Container.current);
      chartRef.current = lineChart.addLineChartNode(
        d3Content,
        (nextPeekIndex, nextGlomerularIndex, nextTimecourseInterval) => {
          _peekIndex = nextPeekIndex;
          _glomerularIndex = nextGlomerularIndex;
          defaultTimecourseInterval = nextTimecourseInterval;

          onPlacePoints(_peekIndex, _glomerularIndex, timecourseInterval);
        },
        axis,
        timecourse,
        peekIndex,
        glomerularIndex,
        width,
        height,
        true,
        true
      );

      lineChart.defaultTimecourseInterval(timecourseInterval);
    }
  }, [
    timecourse,
    d3Container.current,
    width,
    height,
    peekIndex,
    glomerularIndex,
  ]);

  return (
    <div>
      <div
        class="reset"
        onClick={() => {
          lineChart.resetZoom(chartRef.current);
        }}
      >
        Reset
      </div>
      <svg
        className="d3-component"
        width={width}
        height={height}
        ref={d3Container}
      />
    </div>
  );
}

const _getDimensions = targetRef => {
  return {
    width: targetRef.current ? targetRef.current.offsetWidth : undefined,
    height: targetRef.current ? targetRef.current.offsetHeight : undefined,
  };
};
function TimecourseContent({
  timecourse,
  measurementId,
  show,
  peekIndex,
  glomerularIndex,
  onPlacePoints,
}) {
  const contentRef = useRef();
  const [chartDimension, setChartDimension] = useState({});

  const adjustChartDimension = useCallback(() => {
    const { width } = _getDimensions(contentRef);
    if (width !== chartDimension.width) {
      setChartDimension({ width });
    }
  }, [chartDimension]);

  useEffect(() => {
    adjustChartDimension();
  }, [show]);

  useEffect(() => {
    window.addEventListener('resize', adjustChartDimension);

    return () => {
      window.removeEventListener('resize', adjustChartDimension);
    };
  }, [chartDimension]);

  return (
    <div ref={contentRef} id={`chart-content-${measurementId}`}>
      <LineChartContainer
        timecourse={timecourse}
        chartDimension={chartDimension}
        onPlacePoints={onPlacePoints}
        peekIndex={peekIndex}
        glomerularIndex={glomerularIndex}
      ></LineChartContainer>
    </div>
  );
}

TimecourseContent.propTypes = {
  timecourse: PropTypes.object.required,
  measurementId: PropTypes.string.required,
  show: PropTypes.bool.required,
  onPlacePoints: PropTypes.func.required,
  peekIndex: PropTypes.number,
  glomerularIndex: PropTypes.number,
  timecourseInterval: PropTypes.number,
};

export default TimecourseContent;
