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
    <div className="flex flex-col text-primary-active bg-black text-[12px] h-[42px] px-[8px]">
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setIsSegmentationConfigOpen(!isSegmentationConfigOpen)}
      >
        <div
          className="flex items-center pt-[9px] cursor-pointer hover:opacity-80"
          onClick={() => onSegmentationAdd()}
        >
          <Icon name="row-add" className="w-6 h-6" />
          <div className="pl-1">Add</div>
        </div>
        <div className="flex-grow" />
        <div className="flex items-center pt-[9px] cursor-pointer hover:opacity-80">
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
  onSegmentationClick,
  onSegmentClick,
  onGlobalConfigChange,
  onSegmentationAdd,
  onSegmentationRename,
  onSegmentationDelete,
  showAddSegmentation,
  showAddSegment,
  onSegmentAdd,
  onSegmentDelete,
  onSegmentEdit,
  onToggleSegmentationVisibility,
  onToggleSegmentVisibility,
}) => {
  const [isMinimized, setIsMinimized] = useState(() => {
    return segmentations.reduce((acc, { id }) => {
      acc[id] = true;
      return acc;
    }, {});
  });

  const onToggleMinimizeSegmentation = useCallback(
    id => {
      setIsMinimized(prevState => ({
        ...prevState,
        [id]: !prevState[id],
      }));
    },
    [setIsMinimized]
  );

  return (
    <div className="font-inter">
      <GetSegmentationConfig
        onConfigChange={onGlobalConfigChange}
        showAddSegmentation={showAddSegmentation}
        onSegmentationAdd={onSegmentationAdd}
      />
      <div className="flex flex-col gap-2">
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
                onSegmentationClick={() => onSegmentationClick(id)}
                activeSegmentIndex={activeSegmentIndex}
                onToggleMinimizeSegmentation={onToggleMinimizeSegmentation}
                onSegmentationRename={onSegmentationRename}
                onSegmentationDelete={onSegmentationDelete}
                onSegmentClick={onSegmentClick}
                onSegmentEdit={onSegmentEdit}
                onToggleSegmentVisibility={onToggleSegmentVisibility}
                onToggleSegmentationVisibility={onToggleSegmentationVisibility}
                onSegmentAdd={onSegmentAdd}
                onSegmentDelete={onSegmentDelete}
              />
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
