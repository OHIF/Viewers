import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icons } from '../Icons';

const StudyListRichRow = ({
  patientName,
  mrn,
  studyDate,
  description,
  modality,
  numInstances,
  onClick,
  className,
}) => {
  return (
    <div
      className={classnames(
        'bg-bkg-med/30 hover:border-actions-primary/30 hover:bg-bkg-med group flex cursor-pointer items-center justify-between rounded-lg border border-transparent px-4 py-3 transition-all duration-200 hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Modality Icon/Badge */}
        <div className="bg-actions-primary/10 text-actions-highlight flex h-10 w-10 items-center justify-center rounded-full">
          <span className="text-xs font-bold">{modality}</span>
        </div>

        {/* Patient Info */}
        <div className="flex flex-col">
          <span className="group-hover:text-actions-highlight font-medium text-white transition-colors">
            {patientName || 'Unnamed Patient'}
          </span>
          <span className="text-info-muted text-xs">MRN: {mrn}</span>
        </div>
      </div>

      {/* Description */}
      <div className="flex-1 px-8">
        <span className="text-info-secondary line-clamp-1 text-sm">
          {description || 'No description'}
        </span>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-6">
        <span className="text-info-muted text-sm">{studyDate}</span>

        <div className="text-info-muted flex w-16 items-center justify-end gap-1 text-xs">
          <Icons.GroupLayers className="h-4 w-4" />
          <span>{numInstances}</span>
        </div>

        <Icons.LaunchArrow className="text-info-muted group-hover:text-actions-highlight h-4 w-4 opacity-0 transition-all group-hover:opacity-100" />
      </div>
    </div>
  );
};

StudyListRichRow.propTypes = {
  patientName: PropTypes.string,
  mrn: PropTypes.string,
  studyDate: PropTypes.string,
  description: PropTypes.string,
  modality: PropTypes.string,
  numInstances: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export { StudyListRichRow };
