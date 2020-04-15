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

function LineChartContainer({
  axis = DEFAULT_AXIS,
  measurements,
  targetMeasurementNumber,
  chartDimension,
  onPlacePoints,
}) {
  const d3Container = useRef(null);
  const chartRef = useRef(null);
  const { width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = chartDimension;
  const [currentIndex, setCurrentIndex] = useState(() =>
    measurements.findIndex(
      measurement => measurement.measurementNumber === targetMeasurementNumber
    )
  );

  const timecourseIntervalsRef = useRef({});

  useEffect(() => {
    timecourseIntervalsRef.current = measurements.reduce(
      (acc, measurement, index) => {
        let pointsDiff;
        const { pIndex, gIndex } = measurement;
        // map to intervals diff from timecourse if existing p and g or use defaultInterval
        if (!isNaN(pIndex) && !isNaN(gIndex)) {
          const { timecourse = [] } = measurement;

          if (timecourse.length) {
            pointsDiff = Math.abs(
              timecourse[pIndex][0] - timecourse[gIndex][0]
            );
          }
        }
        acc[index] = isNaN(pointsDiff) ? defaultTimecourseInterval : pointsDiff;

        return acc;
      },
      {}
    );
  }, [measurements]);

  const measurement = measurements[currentIndex];
  const { timecourse } = measurement || {};
  const [area, setArea] = useState();

  const changeCurrentChart = value => {
    const nextIndex =
      (currentIndex + value + measurements.length) % measurements.length;

    setCurrentIndex(nextIndex);
  };

  const isValidTimecourseInterval = index => {
    const currentValue = timecourseIntervalsRef.current[index];
    return currentValue && currentValue === defaultTimecourseInterval;
  };

  const invalidateTimecourseInterval = (measurement, index) => {
    measurement.pIndex = undefined;
    measurement.gIndex = undefined;
    measurement.areaUnderCurve = undefined;

    timecourseIntervalsRef.current[index] = defaultTimecourseInterval;
  };

  useEffect(() => {
    const measurement = measurements[currentIndex];
    const { areaUnderCurve = 0 } = measurement || {};
    setArea(areaUnderCurve);
  }, [currentIndex]);
  useEffect(() => {
    if (timecourse && d3Container.current) {
      const _isValidTimecourseInterval = isValidTimecourseInterval(
        currentIndex
      );

      if (!_isValidTimecourseInterval) {
        invalidateTimecourseInterval(measurement, currentIndex);
      }

      const { pIndex, gIndex } = measurement;
      const d3Content = select(d3Container.current);
      chartRef.current = lineChart.addLineChartNode(
        d3Content,
        (nextPeekIndex, nextGlomerularIndex, nextTimecourseInterval) => {
          measurement.pIndex = nextPeekIndex;
          measurement.gIndex = nextGlomerularIndex;

          const timecourseChanged =
            defaultTimecourseInterval !== nextTimecourseInterval;

          if (timecourseChanged) {
            defaultTimecourseInterval = nextTimecourseInterval;
            timecourseIntervalsRef.current[
              currentIndex
            ] = nextTimecourseInterval;
            lineChart.defaultTimecourseInterval(defaultTimecourseInterval);
          }

          const area = onPlacePoints(
            nextPeekIndex,
            nextGlomerularIndex,
            currentIndex,
            measurement,
            timecourseChanged
          );

          setArea(area);
        },
        axis,
        timecourse,
        pIndex,
        gIndex,
        width,
        height,
        true,
        true
      );

      lineChart.defaultTimecourseInterval(defaultTimecourseInterval);
    }
  }, [currentIndex, d3Container.current, width, height, timecourse]);

  return (
    <div>
      <div className="toolbarRow">
        <div
          className="toolbarButton"
          onClick={() => {
            lineChart.resetZoom(chartRef.current);
          }}
        >
          Reset
        </div>
        <div
          className="toolbarButton big"
          onClick={() => changeCurrentChart(-1)}
        >
          Previous
        </div>
        <div
          className="toolbarButton big"
          onClick={() => changeCurrentChart(1)}
        >
          Next
        </div>
        {Number(area) > 0 && (
          <div className="toolbarInfo">Area under curve: {area.toFixed(2)}</div>
        )}
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
  show,
  targetMeasurementNumber,
  measurements,
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
    measurements && (
      <div ref={contentRef} id="chart-content">
        <LineChartContainer
          measurements={measurements}
          targetMeasurementNumber={targetMeasurementNumber}
          chartDimension={chartDimension}
          onPlacePoints={onPlacePoints}
        ></LineChartContainer>
      </div>
    )
  );
}

TimecourseContent.propTypes = {
  measurements: PropTypes.array,
  targetMeasurementNumber: PropTypes.number,
  show: PropTypes.func,
  onPlacePoints: PropTypes.func,
  timecourseInterval: PropTypes.number,
};

export default TimecourseContent;
