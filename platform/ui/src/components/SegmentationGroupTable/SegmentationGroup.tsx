import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SegmentItem from './SegmentItem';
import SegmentationConfig from './SegmentationConfig';
import Dropdown from '../Dropdown';
import classnames from 'classnames';
import Icon from '../Icon';
import IconButton from '../IconButton';

const AddNewSegmentRow = ({ onConfigChange }) => {
  const [isSegmentationConfigOpen, setIsSegmentationConfigOpen] =
    useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex items-center px-3 py-2">
        <div className="flex items-center  gap-2">
          <Icon name="tool-crosshair" className="w-4 h-4 text-white" />
          <span className="text-base text-white ">Add Segment</span>
        </div>
        <div className="flex-grow" />
        <div className="w-4 h-4 flex items-center justify-center">
          <Icon
            name="settings"
            className="w-4 h-4 text-white"
            onClick={() =>
              setIsSegmentationConfigOpen(!isSegmentationConfigOpen)
            }
          />
        </div>
      </div>
      {isSegmentationConfigOpen && (
        <SegmentationConfig onConfigChange={onConfigChange} />
      )}
    </div>
  );
};

const SegmentGroupHeader = ({
  isMinimized,
  onToggleMinimizeSegmentation,
  id,
  label,
  segmentCount,
  onClickSegmentationEdit,
  onClickSegmentationDelete,
}) => {
  return (
    <div className="flex items-center px-2 pl-3 py-2 bg-secondary-main gap-2">
      <Icon
        name="chevron-down"
        className={classnames(
          'w-4 h-4 text-white transition duration-300 cursor-pointer',
          {
            'transform rotate-180': !isMinimized,
          }
        )}
        onClick={() => onToggleMinimizeSegmentation(id)}
      />
      <span className="text-base text-white ">{label}</span>
      <div className="flex-grow" />
      <div className="bg-gray-800 rounded-sm w-4 h-4 flex items-center justify-center">
        <span className="text-base text-white ">{segmentCount}</span>
      </div>
      <div className="flex">
        <Dropdown
          id="options"
          showDropdownIcon={false}
          list={[
            {
              title: 'Rename',
              onClick: onClickSegmentationEdit,
            },
            {
              title: 'Delete',
              onClick: onClickSegmentationDelete,
            },
          ]}
        >
          <IconButton
            id={'options-chevron-down-icon'}
            variant="text"
            color="inherit"
            size="initial"
            className="text-primary-active"
          >
            <Icon name="chevron-down" />
          </IconButton>
        </Dropdown>
      </div>
    </div>
  );
};

const SegmentationGroup = ({
  label,
  id,
  segmentCount,
  isVisible,
  isActive,
  isMinimized,
  segments,
  activeSegmentIndex,
  onClickNewSegment,
  onClickSegment,
  onClickSegmentEdit,
  onClickSegmentDelete,
  onToggleSegmentLocked,
  onClickSegmentColor,
  onToggleSegmentVisibility,
  onToggleSegmentationVisibility,
  onClickSegmentationEdit,
  onClickSegmentationDelete,
  onToggleActive,
  onToggleMinimizeSegmentation,
  onSegmentationConfigChange,
}) => {
  return (
    <div className="flex flex-col">
      <div
        className={classnames('flex flex-col', {
          'border border-primary-light ': isActive,
        })}
      >
        <SegmentGroupHeader
          isMinimized={isMinimized}
          onToggleMinimizeSegmentation={onToggleMinimizeSegmentation}
          id={id}
          label={label}
          segmentCount={segmentCount}
          onClickSegmentationEdit={onClickSegmentationEdit}
          onClickSegmentationDelete={onClickSegmentationDelete}
        />

        {/* Add segment row */}
        {!isMinimized && (
          <div className="flex flex-col">
            <AddNewSegmentRow onConfigChange={onSegmentationConfigChange} />
            {!!segments.length &&
              segments.map(segment => {
                if (segment === undefined || segment === null) {
                  return null;
                }

                const { segmentIndex, color, label, isVisible, isLocked } =
                  segment;
                return (
                  <SegmentItem
                    key={segmentIndex}
                    segmentationId={id}
                    segmentIndex={segmentIndex}
                    label={label}
                    color={color}
                    isActive={activeSegmentIndex === segmentIndex}
                    isLocked={isLocked}
                    isVisible={isVisible}
                    onClick={onClickSegment}
                    onEdit={onClickSegmentEdit}
                    onDelete={onClickSegmentDelete}
                    onColor={onClickSegmentColor}
                    onToggleVisibility={onToggleSegmentVisibility}
                    onToggleLocked={onToggleSegmentLocked}
                  />
                );
              })}
          </div>
        )}
        {/* Segments */}
      </div>
    </div>
  );
};

SegmentationGroup.propTypes = {
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  segmentCount: PropTypes.number.isRequired,
  isVisible: PropTypes.bool.isRequired,
  segments: PropTypes.array.isRequired,
  activeSegmentIndex: PropTypes.number,
  onClickNewSegment: PropTypes.func.isRequired,
  onClickSegment: PropTypes.func.isRequired,
  onClickSegmentEdit: PropTypes.func.isRequired,
  onClickSegmentDelete: PropTypes.func.isRequired,
  onToggleSegmentLocked: PropTypes.func,
  onToggleSegmentVisibility: PropTypes.func.isRequired,
  onToggleSegmentationVisibility: PropTypes.func.isRequired,
};

SegmentationGroup.defaultProps = {
  label: '',
  segmentCount: 0,
  segments: [],
};

export default SegmentationGroup;
