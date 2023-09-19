import React from 'react';
import { LineChart } from '@ohif/ui';

const LineChartViewport = ({ displaySets }) => {
  const displaySet = displaySets[0];
  const { axis: chartAxis, series: chartSeries } = displaySet.instance.chartData;

  return (
    <LineChart
      showLegend={true}
      legendWidth={150}
      axis={{
        x: {
          label: chartAxis.x.label,
          indexRef: 0,
          type: 'x',
          range: {
            min: 0,
          },
        },
        y: {
          label: chartAxis.y.label,
          indexRef: 1,
          type: 'y',
        },
      }}
      series={chartSeries}
    />
  );
};

export { LineChartViewport as default };
