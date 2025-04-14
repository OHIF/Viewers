import LineChartViewport from './Components/LineChartViewport/index';

const getViewportModule = () => {
  return [
    {
      name: 'chartViewport',
      component: LineChartViewport,
      isReferenceViewable: () => false,
    },
  ];
};

export { getViewportModule as default };
