import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SegmentationItem from './SegmentationItem';

import Icon from '../Icon';

const SegmentationTable = ({
  title = '',
  segmentations = [],
  activeSegmentationId = '',
  onClick = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onToggleVisibility = () => {},
  onToggleVisibilityAll = () => {},
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
      setHiddenSegmentationIds(segmentations.map(segmentation => segmentation.id));

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
      <div className="bg-secondary-main flex justify-between px-2 py-1">
        <span className="text-base font-bold uppercase tracking-widest text-white">{title}</span>
        <div className="flex">
          <span className="text-base font-bold text-white">{amount}</span>
          <Icon
            name="eye-hidden"
            className="ml-2 w-6 cursor-pointer text-white transition duration-300 hover:opacity-80"
            onClick={() => handleToggleAll()}
          />
        </div>
      </div>
      <div className="ohif-scrollbar max-h-64 overflow-y-auto overflow-x-hidden">
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

export default SegmentationTable;
