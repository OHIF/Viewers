import asyncComponent from '../../components/AsyncComponent.js';

// Dynamic Import Routes (CodeSplitting)
const IHEInvokeImageDisplay = asyncComponent(() =>
  import(
    /* webpackChunkName: "IHEInvokeImageDisplay" */ '../../routes/IHEInvokeImageDisplay.js'
  )
);
const ViewerRouting = asyncComponent(() =>
  import(
    /* webpackChunkName: "ViewerRouting" */ '../../routes/ViewerRouting.js'
  )
);

const StudyListRouting = asyncComponent(() =>
  import(
    /* webpackChunkName: "StudyListRouting" */ '../../studylist/StudyListRouting.js'
  )
);
const StandaloneRouting = asyncComponent(() =>
  import(
    /* webpackChunkName: "ConnectedStandaloneRouting" */ '../../connectedComponents/ConnectedStandaloneRouting.js'
  )
);
const ViewerLocalFileData = asyncComponent(() =>
  import(
    /* webpackChunkName: "ViewerLocalFileData" */ '../../connectedComponents/ViewerLocalFileData.js'
  )
);

const ROUTES_DEF = [
  {
    name: 'Viewer',
    template: ViewerRouting,
  },
  {
    name: 'StandAloneViewer',
    template: StandaloneRouting,
  },
  {
    name: 'StudyList',
    template: StudyListRouting,
    condition: appConfig => {
      return appConfig.showStudyList !== undefined
        ? appConfig.showStudyList
        : true;
    },
  },
  {
    name: 'Local',
    template: ViewerLocalFileData,
  },
  {
    name: 'IHEInvokeImageDisplay',
    template: IHEInvokeImageDisplay,
  },
  {
    name: 'GCloudViewer',
    template: ViewerRouting,
    condition: appConfig => {
      return !!appConfig.enableGoogleCloudAdapter;
    },
  },
  {
    name: 'GCloudStudyList',
    template: StudyListRouting,
    condition: appConfig => {
      const showList =
        appConfig.showStudyList !== undefined ? appConfig.showStudyList : true;

      return showList && !!appConfig.enableGoogleCloudAdapter;
    },
  },
];

export default ROUTES_DEF;
