import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Sidebar } from '../Sidebar';
import { ImmersiveHeader } from '../ImmersiveHeader';

const DashboardLayout = ({
  children,
  menuOptions,
  activePath,
  onMenuClick,
  headerTitle,
  headerContent,
}) => {
  const [isSidebarExpanded] = useState(true);

  return (
    <div className="bg-bkg-low font-inter flex h-screen w-full overflow-hidden text-white">
      {/* Sidebar */}
      <Sidebar
        menuOptions={menuOptions}
        activePath={activePath}
        onMenuClick={onMenuClick}
        isExpanded={isSidebarExpanded}
      />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <ImmersiveHeader title={headerTitle}>{headerContent}</ImmersiveHeader>

        {/* Content */}
        <main className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {/* Background Gradients/Glows */}
        <div className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full overflow-hidden">
          <div className="bg-actions-primary/5 absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full blur-[120px]"></div>
          <div className="bg-actions-highlight/5 absolute top-[40%] right-[10%] h-[40%] w-[40%] rounded-full blur-[100px]"></div>
        </div>
      </div>
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node,
  menuOptions: PropTypes.array.isRequired,
  activePath: PropTypes.string,
  onMenuClick: PropTypes.func,
  headerTitle: PropTypes.string,
  headerContent: PropTypes.node,
};

export { DashboardLayout };
