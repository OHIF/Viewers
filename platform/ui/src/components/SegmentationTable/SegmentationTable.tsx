import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../';
import SegmentationItem from './SegmentationItem';

const SegmentationTable = ({
  title,
  segmentations,
  activeSegmentationId,
  onClick,
  onEdit,
  onDelete,
  onToggleVisibility,
  onToggleVisibilityAll,
}) => {
  const [hiddenSegmentationIds, setHiddenSegmentationIds] = useState([]);
  const amount = segmentations.length;

  const handleToggleAll = () => {
    // filter segmentation ids that are hidden
    const visibleSegmentationsIds = segmentations
      .filter(segmentation => !hiddenSegmentationIds.includes(segmentation.id))
      .map(segmentation => segmentation.id);

    // check if there is at least one visible segmentation
    // if there is set all to invisible state
    if (visibleSegmentationsIds.length > 0) {
      // make all invisible
      setHiddenSegmentationIds(
        segmentations.map(segmentation => segmentation.id)
      );

      // toggle those that are visible
      onToggleVisibilityAll(visibleSegmentationsIds);
    }

    // if there is no visible segmentation, set
    // all to visible state
    if (visibleSegmentationsIds.length === 0) {
      // copy hidden segmentation ids
      const Ids = [...hiddenSegmentationIds];
      setHiddenSegmentationIds([]);

      // toggle those that are hidden
      onToggleVisibilityAll(Ids);
    }
  };

  return (
    <div>
      <div className="flex justify-between px-2 py-1 bg-secondary-main">
        <span className="text-base font-bold tracking-widest text-white uppercase">
          {title}
        </span>
        <div className="flex">
          <span className="text-base font-bold text-white">{amount}</span>
          <Icon
            name="eye-hidden"
            className="w-6 ml-2 text-white transition duration-300 cursor-pointer hover:opacity-80"
            onClick={() => handleToggleAll()}
          />
        </div>
      </div>
      <div className="overflow-x-hidden overflow-y-auto ohif-scrollbar max-h-64">
        {!!segmentations.length &&
          segmentations.map((segmentation, i) => {
            const { id, label, displayText = [] } = segmentation;
            return (
              <SegmentationItem
                key={id}
                id={id}
                index={i + 1}
                label={label ?? `Segmentation ${i + 1}`}
                displayText={displayText}
                isActive={activeSegmentationId === id}
                isVisible={!hiddenSegmentationIds.includes(id)}
                onClick={() => {
                  onClick(id);
                }}
                onEdit={() => {
                  onEdit(id);
                }}
                onDelete={() => {
                  onDelete(id);
                }}
                toggleVisibility={() => {
                  onToggleVisibility(id);

                  // if segmentation is visible, remove it from hiddenSegmentationIds
                  if (hiddenSegmentationIds.includes(id)) {
                    setHiddenSegmentationIds(
                      hiddenSegmentationIds.filter(hiddenId => hiddenId !== id)
                    );
                  } else {
                    // if segmentation is hidden, add it to hiddenSegmentationIds
                    setHiddenSegmentationIds([...hiddenSegmentationIds, id]);
                  }
                }}
              />
            );
          })}
      </div>
    </div>
  );
};

SegmentationTable.propTypes = {
  title: PropTypes.string.isRequired,
  segmentations: PropTypes.array.isRequired,
  activeSegmentationId: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleVisibility: PropTypes.func.isRequired,
  onToggleVisibilityAll: PropTypes.func.isRequired,
};

SegmentationTable.defaultProps = {
  title: '',
  segmentations: [],
  activeSegmentationId: '',
  onClick: () => {},
  onEdit: () => {},
  onToggleVisibility: () => {},
  onToggleVisibilityAll: () => {},
};

export default SegmentationTable;
