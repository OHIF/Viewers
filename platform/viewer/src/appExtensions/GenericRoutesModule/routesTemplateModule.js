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

const ROUTES_DEF = {
  viewer: {
    template: 'Viewer',
    component: ViewerRouting,
  },
  standAloneViewer: {
    template: 'StandAloneViewer',
    component: StandaloneRouting,
  },
  studyList: {
    template: 'StudyList',
    component: StudyListRouting,
    condition: appConfig => {
      return appConfig.showStudyList !== undefined
        ? appConfig.showStudyList
        : true;
    },
  },
  local: {
    template: 'Local',
    component: ViewerLocalFileData,
  },
  IHEInvokeImageDisplay: {
    template: 'IHEInvokeImageDisplay',
    component: IHEInvokeImageDisplay,
  },
  gcloudViewer: {
    template: 'GCloudViewer',
    component: ViewerRouting,
    condition: appConfig => {
      return !!appConfig.enableGoogleCloudAdapter;
    },
  },
  gcloudStudyList: {
    template: 'GCloudStudyList',
    component: StudyListRouting,
    condition: appConfig => {
      const showList =
        appConfig.showStudyList !== undefined ? appConfig.showStudyList : true;

      return showList && !!appConfig.enableGoogleCloudAdapter;
    },
  },
};

export default ROUTES_DEF;
