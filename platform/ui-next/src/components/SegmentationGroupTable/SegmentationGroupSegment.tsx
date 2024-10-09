import React from 'react';
import { DataRow } from '../DataRow';

interface SegmentItemProps {
  segmentationId: string;
  segmentIndex: number;
  label: string;
  color: number[];
  isActive: boolean;
  disableEditing?: boolean;
  isLocked: boolean;
  isVisible: boolean;
  onClick: (segmentationId: string, segmentIndex: number) => void;
  onEdit: (segmentationId: string, segmentIndex: number) => void;
  onDelete: (segmentationId: string, segmentIndex: number) => void;
  onColor: (segmentationId: string, segmentIndex: number) => void;
  onToggleVisibility: (segmentationId: string, segmentIndex: number) => void;
  onToggleLocked: (segmentationId: string, segmentIndex: number) => void;
}

const SegmentationGroupSegment: React.FC<SegmentItemProps> = ({
  segmentationId,
  segmentIndex,
  label,
  color,
  isActive,
  disableEditing,
  isLocked,
  isVisible,
  onClick,
  onEdit,
  onDelete,
  onColor,
  onToggleVisibility,
  onToggleLocked,
}) => {
  const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

  const handleAction = (action: string) => {
    switch (action) {
      case 'Rename':
        onEdit(segmentationId, segmentIndex);
        break;
      case 'Lock':
        onToggleLocked(segmentationId, segmentIndex);
        break;
      case 'Delete':
        onDelete(segmentationId, segmentIndex);
        break;
      default:
        console.debug('Unknown action:', action);
    }
  };

  const actionOptions = disableEditing ? ['Lock'] : ['Rename', 'Lock', 'Delete'];

  return (
    <DataRow
      number={segmentIndex}
      title={label}
      description=""
      colorHex={cssColor}
      actionOptions={actionOptions}
      onAction={handleAction}
      isSelected={isActive}
      onSelect={() => onClick(segmentationId, segmentIndex)}
    />
  );
};

export default SegmentationGroupSegment;
