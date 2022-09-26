import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../';
import SegmentationGroup from './SegmentationGroup';
import SegmentationConfig from './SegmentationConfig';

const GetSegmentationConfig = ({
  onConfigChange,
  showAddSegmentation,
  onSegmentationAdd,
}) => {
  const [isSegmentationConfigOpen, setIsSegmentationConfigOpen] = useState(
    false
  );

  return (
    <div className="flex flex-col text-primary-active bg-black text-[12px] px-[8px] justify-center ohif-scrollbar max-h-112">
      <div
        className="flex items-center cursor-pointer h-[42px]"
        onClick={() => setIsSegmentationConfigOpen(!isSegmentationConfigOpen)}
      >
        {showAddSegmentation && (
          <div
            className="flex items-center cursor-pointer hover:opacity-80"
            onClick={() => onSegmentationAdd()}
          >
            <Icon name="row-add" className="w-6 h-6" />
            <div className="pl-1">Add</div>
          </div>
        )}
        <div className="flex-grow" />
        <div className="flex items-center cursor-pointer hover:opacity-80">
          <Icon
            name="settings"
            className="w-4 h-4 cursor-pointer hover:opacity-80"
          />
          <div className="pl-2">Appearance</div>
        </div>
      </div>
      {isSegmentationConfigOpen && (
        <SegmentationConfig onConfigChange={onConfigChange} />
      )}
    </div>
  );
};

const SegmentationGroupTable = ({
  segmentations,
  onGlobalConfigChange,
  onSegmentationAdd,
  onSegmentationEdit,
  onSegmentationClick,
  onSegmentationDelete,
  showAddSegmentation,
  showAddSegment,
  onSegmentClick,
  onSegmentAdd,
  onSegmentDelete,
  onSegmentEdit,
  onToggleSegmentationVisibility,
  onToggleSegmentVisibility,
  onSegmentColorClick,
  isMinimized,
  onToggleMinimizeSegmentation,
}) => {
  return (
    <div className="font-inter">
      <GetSegmentationConfig
        onConfigChange={onGlobalConfigChange}
        showAddSegmentation={showAddSegmentation}
        onSegmentationAdd={onSegmentationAdd}
      />
      <div className="flex flex-col pr-[1px]">
        {!!segmentations.length &&
          segmentations.map(segmentation => {
            const {
              id,
              label,
              displayText = [],
              segmentCount,
              segments,
              isVisible,
              isActive,
              activeSegmentIndex,
            } = segmentation;
            return (
              <>
                <SegmentationGroup
                  key={id}
                  id={id}
                  label={label}
                  isMinimized={isMinimized[id]}
                  segments={segments}
                  showAddSegment={showAddSegment}
                  segmentCount={segmentCount}
                  isActive={isActive}
                  isVisible={isVisible}
                  onSegmentColorClick={onSegmentColorClick}
                  onSegmentationClick={() => onSegmentationClick(id)}
                  activeSegmentIndex={activeSegmentIndex}
                  onToggleMinimizeSegmentation={onToggleMinimizeSegmentation}
                  onSegmentationEdit={onSegmentationEdit}
                  onSegmentationDelete={onSegmentationDelete}
                  onSegmentClick={onSegmentClick}
                  onSegmentEdit={onSegmentEdit}
                  onToggleSegmentVisibility={onToggleSegmentVisibility}
                  onToggleSegmentationVisibility={
                    onToggleSegmentationVisibility
                  }
                  onSegmentAdd={onSegmentAdd}
                  onSegmentDelete={onSegmentDelete}
                />
                <div className="h-2 bg-black"></div>
              </>
            );
          })}
      </div>
    </div>
  );
};

SegmentationGroupTable.propTypes = {
  title: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  segmentations: PropTypes.array.isRequired,
  activeSegmentationId: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleLocked: PropTypes.func,
  onToggleVisibility: PropTypes.func.isRequired,
  onToggleVisibilityAll: PropTypes.func.isRequired,
};

SegmentationGroupTable.defaultProps = {
  title: '',
  amount: 0,
  segmentations: [],
  activeSegmentationId: '',
  onClick: () => {},
  onEdit: () => {},
  onToggleVisibility: () => {},
  onToggleVisibilityAll: () => {},
  onSegmentationClick: () => {},
};

export default SegmentationGroupTable;
