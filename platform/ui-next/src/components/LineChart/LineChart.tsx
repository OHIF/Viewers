import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import * as d3Selection from 'd3-selection';
import { lineChart } from './d3LineChart';
import './LineChart.css';

const LineChart = ({
  width: widthProp,
  height: heightProp,
  axis,
  series,
  showAxisLabels = true,
  showAxisGrid = true,
  showLegend = false,
  legendWidth = 120,
  transparentChartBackground = false,
  containerClassName,
  chartContainerClassName,
}: {
  title: string;
  width: number;
  height: number;
  showAxisGrid: boolean;
  showAxisLabels: boolean;
  showLegend: boolean;
  legendWidth: number;
  transparentChartBackground: boolean;
  containerClassName: string;
  chartContainerClassName: string;
}): JSX.Element => {
  const chartContainerRef = useRef(null);
  const [d3SVGContainer, setD3SVGRef] = useState(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const chartContainer = chartContainerRef.current;
    const containerWidth = chartContainer.offsetWidth;
    const containerHeight = chartContainer.offsetHeight;
    const d3Container = d3Selection
      .create('svg')
      .attr('viewBox', [0, 0, containerWidth, containerHeight])
      .style('max-width', `${containerWidth}px`)
      .style('overflow', 'visible');

    chartContainer.append(d3Container.node());

    setD3SVGRef(d3Container);
    setWidth(containerWidth);
    setHeight(containerHeight);
  }, [chartContainerRef]);

  useEffect(() => {
    if (!d3SVGContainer) {
      return;
    }

    lineChart.addLineChartNode({
      d3SVGRef: d3SVGContainer,
      axis,
      series,
      width,
      height,
      showAxisLabels,
      showAxisGrid,
      showLegend,
      legendWidth,
      transparentChartBackground,
    });
  }, [
    d3SVGContainer,
    axis,
    series,
    width,
    height,
    showAxisLabels,
    showAxisGrid,
    transparentChartBackground,
    showLegend,
    legendWidth,
  ]);

  return (
    <div
      className={classnames(
        'LineChart text-white',
        {
          [`w-[${widthProp}px]`]: !!widthProp,
          [`h-[${heightProp}px]`]: !!heightProp,
        },
        {
          'w-full': !widthProp,
          'h-full': !heightProp,
        },
        containerClassName
      )}
    >
      <div
        id="chartContainer"
        ref={chartContainerRef}
        className={classnames('h-full w-full', chartContainerClassName)}
      ></div>
    </div>
  );
};

LineChart.propTypes = {
  title: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  showAxisLabels: PropTypes.bool,
  showAxisGrid: PropTypes.bool,
  showLegend: PropTypes.bool,
  legendWidth: PropTypes.number,
  transparentChartBackground: PropTypes.bool,
  containerClassName: PropTypes.string,
  chartContainerClassName: PropTypes.string,
};

export default LineChart;
