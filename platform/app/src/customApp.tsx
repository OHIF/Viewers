import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import ReactDOM from 'react-dom';
import App from './App';
import { Tabs } from "antd";
import OrdersList from './pages/orders';
import { ConfigProvider } from "antd";
import AppHeader from './pages/header';
import "./custom-app.css";
import "./index.css";
import WysigEditor from './pages/ReportEditor/wysig';

const MyViewer = ({ appProps }) => {
  useEffect(() => {
    console.log("inside use viewer", appProps);

    const app = React.createElement(App, appProps, null);
    const pacs_app_element = document.getElementById('pacs-app');
    console.log("pcs app eellment", pacs_app_element);

    if (pacs_app_element) {
      ReactDOM.render(app, pacs_app_element);
    }

  }, []);
  return (<div id="!pacs-app">
    <App config={appProps.config} defaultExtensions={appProps.defaultExtensions} defaultModes={appProps.defaultModes} />
  </div>);
};

function CustomApp(appProps) {
  useEffect(() => {
    console.log("inside use custom app");
    document.title = 'Yashoda Pacs';
  }, []);

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'Orders List',
      children: <OrdersList />,
    },
    {
      key: '2',
      label: 'PACS',
      children: <MyViewer appProps={appProps} />,
    },
  ];

  return (
    <>
      {/* <BrowserRouter>
        <div className="app-content" style={{ background: "white", width: '100vw', height: '100vh' }}>
          <Routes>
            <Route
              path="/site"
              element={
                <>
                  <Home />
                </>
              }
            />
            <Route
              path="/viewer"
              element={
                <>
                  <MyViewer appProps={appProps} />
                </>
              }
            />
          </Routes>
        </div>
      </BrowserRouter> */}
      {/* <MyViewer appProps={appProps} /> */}
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#EF8200",
          },
        }}
      >
        <AppHeader />
        <div className='custom-body'>
          <Tabs style={{ background: 'white' }} items={items} />
        </div>
        {/* <WysigEditor /> */}
      </ConfigProvider>

    </>
  );
};

export default CustomApp;
