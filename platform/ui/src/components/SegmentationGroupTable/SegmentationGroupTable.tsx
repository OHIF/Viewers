import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../';
import SegmentationGroup from './SegmentationGroup';
import SegmentationConfig from './SegmentationConfig';

const AddNewSegmentationAndConfig = ({ onConfigChange }) => {
  const [isSegmentationConfigOpen, setIsSegmentationConfigOpen] =
    useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex items-center px-3 py-2">
        <div className="flex items-center  gap-2">
          <Icon name="tool-crosshair" className="w-4 h-4 text-white" />
          <span className="text-base text-white ">Add New Segmentation</span>
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
      <div className="flex flex-col mt-2 gap-2">
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
