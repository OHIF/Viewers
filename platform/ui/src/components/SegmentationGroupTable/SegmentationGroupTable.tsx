import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../';
import SegmentationGroup from './SegmentationGroup';
import SegmentationConfig from './SegmentationConfig';

const AddNewSegmentationAndConfig = ({ onConfigChange }) => {
  const [isSegmentationConfigOpen, setIsSegmentationConfigOpen] = useState(
    false
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center pl-1 py-1 border-2 border-secondary-main">
        <Icon name="settings" className="w-4 h-4 text-white" />
        <div className="text-base font-inter text-primary-active pl-2 ">
          Appearance
        </div>
      </div>
      <div className="flex items-center pl-1 py-1">
        <Icon name="row-add" className="w-6 h-6 text-white" />
        <div className="text-base font-inter text-primary-active pl-2 ">
          Add Segmentation
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
  onClickSegmentation,
  onGlobalConfigChange,
  onSegmentationConfigChange,
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
    <div>
      <AddNewSegmentationAndConfig onConfigChange={onGlobalConfigChange} />
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
            } = segmentation;
            return (
              <SegmentationGroup
                key={id}
                id={id}
                label={label}
                segmentCount={segmentCount}
                segments={segments}
                isActive={isActive}
                onClick={() => onClickSegmentation(id)}
                isVisible={isVisible}
                isMinimized={isMinimized[id]}
                onToggleMinimizeSegmentation={onToggleMinimizeSegmentation}
                onSegmentationConfigChange={onSegmentationConfigChange}
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
  onClickSegmentation: () => {},
};

export default SegmentationGroupTable;
