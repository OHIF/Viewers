import LineChartViewport from './Components/LineChartViewport/index';

const getViewportModule = () => {
  return [
    {
      name: 'chartViewport',
      component: LineChartViewport,
    },
  ];
};

export { getViewportModule as default };
