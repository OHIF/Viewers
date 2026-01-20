import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icons } from '../Icons';

const StudyCard = ({
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
        'border-glass-border bg-bkg-med/50 hover:border-actions-primary/50 hover:bg-bkg-med hover:shadow-actions-primary/10 group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all duration-300 hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      {/* Top Row: Modality Badge & Date */}
      <div className="mb-3 flex items-center justify-between">
        <div className="bg-actions-primary/20 text-actions-highlight flex items-center justify-center rounded px-2 py-1 text-xs font-bold">
          {modality}
        </div>
        <span className="text-info-muted text-xs">{studyDate}</span>
      </div>

      {/* Patient Info */}
      <div className="mb-4 flex flex-col">
        <h3 className="group-hover:text-actions-highlight mb-1 truncate text-lg font-semibold text-white transition-colors">
          {patientName || 'Unnamed Patient'}
        </h3>
        <span className="text-info-muted text-xs">MRN: {mrn}</span>
      </div>

      {/* Description */}
      <div className="mb-4 flex-1">
        <p className="line-clamp-2 text-info-secondary text-sm">
          {description || 'No description available'}
        </p>
      </div>

      {/* Footer: Instances & Actions */}
      <div className="border-glass-border mt-auto flex items-center justify-between border-t pt-3">
        <div className="text-info-muted flex items-center gap-1 text-xs">
          <Icons.GroupLayers className="h-4 w-4" />
          <span>{numInstances} images</span>
        </div>

        <div className="opacity-0 transition-opacity group-hover:opacity-100">
          <Icons.LaunchArrow className="text-actions-highlight h-4 w-4" />
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.1), transparent 40%)',
        }}
      ></div>
    </div>
  );
};

StudyCard.propTypes = {
  patientName: PropTypes.string,
  mrn: PropTypes.string,
  studyDate: PropTypes.string,
  description: PropTypes.string,
  modality: PropTypes.string,
  numInstances: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export { StudyCard };
