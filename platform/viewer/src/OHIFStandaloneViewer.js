import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter, matchPath } from 'react-router';
import { Switch, Redirect, Route } from 'react-router-dom';
import { NProgress } from '@tanem/react-nprogress';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import {
  ViewerbaseDragDropContext,
  ErrorBoundary,
  asyncComponent,
  retryImport,
} from '@ohif/ui';
import { SignoutCallbackComponent } from 'redux-oidc';
import * as RoutesUtil from './routes/routesUtil';

import './OHIFStandaloneViewer.css';
import './variables.css';
import './theme-tide.css';
// Contexts
import AppContext from './context/AppContext';
import { renderRoutes } from './routes';
import LoginPage from './pages/login';
import DashboardLayout from './layouts';
import SamplePage from './pages/SamplePage';
import AuthGuard from './guards/AuthGuard';
// import UplouderPage from './pages/Uplouder';
import GuestGuard from './guards/GuestGuard';
import { setActiveStep } from '../../core/src/redux/actions';
import { ApplicationSteps } from '../../core/src/redux/reducers/steps';

const ViewerRouting = asyncComponent(() =>
  retryImport(() =>
    import(/* webpackChunkName: "ViewerRouting" */ './routes/ViewerRouting.js')
  )
);
const RadionicRouting = asyncComponent(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "ViewerRouting" */ './routes/RadiomicsRouting.js'
    )
  )
);

const RadionicReportRouting = asyncComponent(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "ViewerRouting" */ './routes/RadiomicsReportRouting.js'
    )
  )
);

const CallbackPage = asyncComponent(() =>
  retryImport(() =>
    import(/* webpackChunkName: "CallbackPage" */ './routes/CallbackPage.js')
  )
);
const StudyListRouting = asyncComponent(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "StudyListRouting" */ './studylist/StudyListRouting.js'
    )
  )
);

const NnunetPage = asyncComponent(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "StudyListRouting" */ './routes/ViewerRouting2.js'
    )
  )
);

class OHIFStandaloneViewer extends Component {
  static contextType = AppContext;
  state = {
    isLoading: false,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    user: PropTypes.object,
    setContext: PropTypes.func,
    userManager: PropTypes.object,
    location: PropTypes.object,
  };

  componentDidMount() {
    this.unlisten = this.props.history.listen((location, action) => {
      if (this.props.setContext) {
        this.props.setContext(window.location.pathname);
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { userManager } = this.props;

    const routes = [
      {
        exact: true,
        path: '/404',
        component: SamplePage,
      },
      {
        exact: true,
        // guard: GuestGuard,
        path: '/silent-refresh.html',
        onEnter: () => {
          RoutesUtil.reload();
        },
      },
      {
        exact: true,
        // guard: GuestGuard,
        path: '/logout-refresh.html',
        onEnter: () => {
          RoutesUtil.reload();
        },
      },
      {
        exact: true,
        // guard: GuestGuard,
        path: '/logout-redirect',
        component: () => (
          <SignoutCallbackComponent
            userManager={userManager}
            successCallback={() => console.log('Signout successful')}
            errorCallback={error => {
              console.warn(error);
              console.warn('Signout failed');
            }}
          />
        ),
      },
      {
        exact: true,
        guard: GuestGuard,
        path: '/login',
        component: () => <LoginPage />,
      },
      {
        exact: true,
        path: '/callback',
        component: () => <CallbackPage userManager={userManager} />,
      },
      {
        exact: true,
        guard: AuthGuard,
        layout: DashboardLayout,
        path: '/uplouder',
        component: SamplePage,
      },

      // {
      //   path: '/organ',
      //   guard: AuthGuard,
      //   layout: DashboardLayout,
      //   routes: [
      //     {
      //       exact: true,
      //       path: '/organ/select',
      //       component: SelectOrganPage,
      //     },
      //     {
      //       exact: true,
      //       path: '/organ/studylist',
      //       component: SamplePage,
      //     },
      //     {
      //       component: () => <Redirect to="/organ/select" />,
      //     },
      //   ],
      // },
      {
        exact: true,
        guard: AuthGuard,
        layout: DashboardLayout,
        path: '/studylist',
        // onEnter: () => {
        //   this.props.onStepChange(ApplicationSteps[1].step);
        // },
        component: StudyListRouting,
      },
      {
        exact: false,
        guard: AuthGuard,
        layout: DashboardLayout,
        // onEnter: () => {
        //   this.props.onStepChange(ApplicationSteps[1].step);
        // },
        path:
          '/studylist/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore',
        component: StudyListRouting,
      },

      // {
      //   exact: true,
      //   guard: AuthGuard,
      //   layout: DashboardLayout,
      //   path: '/segmentation',
      //   component: SamplePage,
      // },
      // {
      //   exact: true,
      //   guard: AuthGuard,
      //   layout: DashboardLayout,
      //   path: '/viewer',
      //   component: StandaloneRouting,
      // // },
      // {
      //   exact: true,
      //   guard: AuthGuard,
      //   layout: DashboardLayout,
      //   path: '/viewer/:studyInstanceUIDs',
      //   component: ViewerRouting,
      // },
      // {
      //   exact: true,
      //   guard: AuthGuard,
      //   layout: DashboardLayout,
      //   path: '/viewer/:studyInstanceUIDs',
      //   component: ViewerRouting,
      // },
      {
        exact: false,
        guard: AuthGuard,
        layout: DashboardLayout,
        path:
          '/view/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
        // onEnter: () => {
        //   this.props.onStepChange(ApplicationSteps[2].step);
        // },
        component: ViewerRouting,
      },
      {
        exact: false,
        guard: AuthGuard,
        layout: DashboardLayout,
        path:
          '/edit/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
        // onEnter: () => {
        //   this.props.onStepChange(ApplicationSteps[4].step);
        // },
        component: ViewerRouting,
      },
      {
        exact: false,
        guard: AuthGuard,
        layout: DashboardLayout,
        path:
          '/nnunet/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
        component: NnunetPage,
      },

      {
        path: '/radionics',
        guard: AuthGuard,
        layout: DashboardLayout,
        routes: [
          {
            exact: false,
            path:
              '/radionics/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
            component: RadionicReportRouting,
          },
          {
            exact: false,
            path:
              '/radionics/report/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',

            component: RadionicRouting,
          },
        ],
      },

      {
        exact: true,
        guard: AuthGuard,
        layout: DashboardLayout,
        path: '/profile',
        component: SamplePage,
      },
      {
        path: '*',
        layout: DashboardLayout,
        routes: [
          {
            exact: true,
            path: '/',
            component: () => <Redirect to="/studylist" />,
          },
          // {
          //   component: () => <Redirect to="/404" />,
          // },
        ],
      },
    ];

    return <div className="App">{renderRoutes(routes)}</div>;
  }
}

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onStepChange: step => {
      dispatch(setActiveStep(step));
    },
  };
};

const ConnectedOHIFStandaloneViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(OHIFStandaloneViewer);

export default ViewerbaseDragDropContext(
  withRouter(ConnectedOHIFStandaloneViewer)
);
