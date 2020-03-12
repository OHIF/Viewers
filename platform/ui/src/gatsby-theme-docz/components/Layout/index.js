/** @jsx jsx */
import { useRef, useState } from 'react';
import { jsx, Layout as BaseLayout, Main } from 'theme-ui';
import classnames from 'classnames';

import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import * as styles from 'gatsby-theme-docz/src/components/Layout/styles';

const getSidebarStatus = () => window.location.pathname === '/';

export const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(getSidebarStatus());
  const nav = useRef();

  const handleSidebarToggle = () => {
    setSidebarOpen(s => !s);
  };

  return (
    <BaseLayout sx={{ '& > div': { flex: '1 1 auto' } }} data-testid="layout">
      <Main
        sx={styles.main}
        className={classnames({
          'overflow-hidden h-screen lg:overflow-auto': sidebarOpen,
        })}
      >
        <Header onOpen={handleSidebarToggle} />
        <div className={classnames('flex', {})}>
          <Sidebar
            ref={nav}
            sidebarOpen={sidebarOpen}
            onFocus={() => setSidebarOpen(true)}
            onBlur={() => setSidebarOpen(false)}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className={classnames('py-10 w-full', {
              'px-4 overflow-hidden lg:px-20 lg:overflow-auto ': sidebarOpen,
              'px-4 lg:px-8': !sidebarOpen,
            })}
          >
            {children}
          </div>
        </div>
      </Main>
    </BaseLayout>
  );
};
