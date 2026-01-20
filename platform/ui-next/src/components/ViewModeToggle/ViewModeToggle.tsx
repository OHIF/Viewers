import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icons } from '../Icons';

const ViewModeToggle = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="bg-bkg-med border-glass-border flex items-center rounded-lg border p-1">
      <button
        className={classnames(
          'flex h-8 w-8 items-center justify-center rounded transition-all duration-200',
          {
            'bg-actions-primary text-white shadow-sm': viewMode === 'list',
            'text-info-muted hover:text-white': viewMode !== 'list',
          }
        )}
        onClick={() => onViewModeChange('list')}
        title="List View"
      >
        <Icons.ListView className="h-4 w-4" />
      </button>
      <button
        className={classnames(
          'flex h-8 w-8 items-center justify-center rounded transition-all duration-200',
          {
            'bg-actions-primary text-white shadow-sm': viewMode === 'grid',
            'text-info-muted hover:text-white': viewMode !== 'grid',
          }
        )}
        onClick={() => onViewModeChange('grid')}
        title="Grid View"
      >
        <Icons.ThumbnailView className="h-4 w-4" />
      </button>
    </div>
  );
};

ViewModeToggle.propTypes = {
  viewMode: PropTypes.oneOf(['list', 'grid']).isRequired,
  onViewModeChange: PropTypes.func.isRequired,
};

export { ViewModeToggle };
