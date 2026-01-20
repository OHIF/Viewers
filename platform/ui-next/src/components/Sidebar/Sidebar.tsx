import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const SidebarItem = ({ icon, label, isActive, onClick, isExpanded }) => {
  return (
    <div
      className={classnames(
        'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200',
        {
          'bg-actions-primary shadow-actions-primary/20 text-white shadow-lg': isActive,
          'text-info-secondary hover:bg-white/5 hover:text-white': !isActive,
          'justify-center': !isExpanded,
        }
      )}
      onClick={onClick}
    >
      <div className="flex h-5 w-5 items-center justify-center">{icon}</div>
      {isExpanded && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
};

SidebarItem.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  isExpanded: PropTypes.bool,
};

const Sidebar = ({ menuOptions, activePath, onMenuClick, isExpanded = true }) => {
  return (
    <div
      className={classnames(
        'border-glass-border bg-bkg-low/95 flex h-full flex-col border-r backdrop-blur-xl transition-all duration-300',
        {
          'w-64': isExpanded,
          'w-16': !isExpanded,
        }
      )}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          {/* Placeholder for Logo Icon if needed, or just use the text/image from config */}
          {isExpanded && (
            <img
              src="./essential-logic-logo.png"
              alt="Essential Logic"
              className="h-8 object-contain"
            />
          )}
          {!isExpanded && <div className="bg-actions-primary h-8 w-8 rounded"></div>}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col gap-1 px-2 py-4">
        {menuOptions.map((option, index) => (
          <SidebarItem
            key={index}
            icon={option.icon}
            label={option.label}
            isActive={activePath === option.path}
            onClick={() => onMenuClick(option)}
            isExpanded={isExpanded}
          />
        ))}
      </div>

      {/* User Profile / Footer */}
      <div className="border-glass-border border-t p-4">
        <div className={classnames('flex items-center gap-3', { 'justify-center': !isExpanded })}>
          <div className="from-actions-primary to-actions-highlight h-8 w-8 rounded-full bg-gradient-to-tr"></div>
          {isExpanded && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Dr. A. Chen</span>
              <span className="text-info-muted text-xs">Radiologist</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  menuOptions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node.isRequired,
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
    })
  ).isRequired,
  activePath: PropTypes.string,
  onMenuClick: PropTypes.func,
  isExpanded: PropTypes.bool,
};

export { Sidebar };
