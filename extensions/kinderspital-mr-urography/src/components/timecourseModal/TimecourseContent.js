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
function LineChartContainer({
  axis = DEFAULT_AXIS,
  timecourse,
  chartDimension,
}) {
  const d3Container = useRef(null);
  const chartRef = useRef(null);
  const { width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = chartDimension;
  useEffect(() => {
    if (timecourse && d3Container.current) {
      const d3Content = select(d3Container.current);
      chartRef.current = lineChart.addLineChartNode(
        d3Content,
        axis,
        timecourse,
        width,
        height
      );
    }
  }, [timecourse, d3Container.current, width, height]);

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
function TimecourseContent({ timecourse, measurementId, show }) {
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
      ></LineChartContainer>
    </div>
  );
}

TimecourseContent.propTypes = {
  timecourse: PropTypes.object.required,
  measurementId: PropTypes.string.required,
  show: PropTypes.bool.required,
};

export default TimecourseContent;
