import React from 'react';
import { PanelSection } from '../PanelSection/PanelSection';
import { Icons } from '../Icons';
import SegmentationDropDownRow from './SegmentationDropDownRow';
import SegmentationConfig from './SegmentationConfig';
import SegmentationGroupSegment from './SegmentationGroupSegment';
import NoSegmentationRow from './NoSegmentationRow';
import { Button } from '../Button';
import { ScrollArea } from '../ScrollArea';

type SegmentationGroupTableProps = {
  segmentationsInfo: AppTypes.Segmentation.SegmentationInfo[];
  disableEditing?: boolean;
  showAddSegmentation?: boolean;
  showAddSegment?: boolean;
  showDeleteSegment?: boolean;
  onSegmentationAdd?: () => void;
  onSegmentationEdit?: (segmentationId: string) => void;
  onSegmentationClick?: (segmentationId: string) => void;
  onSegmentationDelete?: (segmentationId: string) => void;
  onSegmentationDownload?: (segmentationId: string) => void;
  onSegmentationDownloadRTSS?: (segmentationId: string) => void;
  storeSegmentation?: (segmentationId: string) => void;
  onSegmentClick?: (segmentationId: string, segmentIndex: number) => void;
  onSegmentAdd?: (segmentationId: string) => void;
  onSegmentDelete?: (segmentationId: string, segmentIndex: number) => void;
  onSegmentEdit?: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentationVisibility?: (segmentationId: string) => void;
  onToggleSegmentVisibility?: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentLock?: (segmentationId: string, segmentIndex: number) => void;
  onSegmentColorClick?: (segmentationId: string, segmentIndex: number) => void;
  setFillAlpha?: (segmentationId: string, type: string, value: number) => void;
  setFillAlphaInactive?: (segmentationId: string, type: string, value: number) => void;
  setOutlineWidthActive?: (segmentationId: string, type: string, value: number) => void;
  setOutlineOpacityActive?: (segmentationId: string, type: string, value: number) => void;
  setRenderFill?: (segmentationId: string, type: string, value: boolean) => void;
  setRenderInactiveSegmentations?: (segmentationId: string, type: string, value: boolean) => void;
  toggleRenderInactiveSegmentations?: (value: boolean) => void;
  renderInactiveSegmentations?: boolean;
  setRenderOutline?: (segmentationId: string, type: string, value: boolean) => void;
};

const SegmentationGroupTable: React.FC<SegmentationGroupTableProps> = ({
  segmentationsInfo = [],
  disableEditing = false,
  showAddSegmentation = true,
  showAddSegment = true,
  showDeleteSegment = true,
  onSegmentationAdd = () => {},
  onSegmentationEdit = () => {},
  onSegmentationClick = () => {},
  onSegmentationDelete = () => {},
  onSegmentationDownload = () => {},
  onSegmentationDownloadRTSS = () => {},
  storeSegmentation = () => {},
  onSegmentClick = () => {},
  onSegmentAdd = () => {},
  onSegmentDelete = () => {},
  onSegmentEdit = () => {},
  onToggleSegmentationVisibility = () => {},
  onToggleSegmentVisibility = () => {},
  onToggleSegmentLock = () => {},
  onSegmentColorClick = () => {},
  setFillAlpha = () => {},
  setFillAlphaInactive = () => {},
  setOutlineWidthActive = () => {},
  toggleRenderInactiveSegmentations = () => {},
  setRenderFill = () => {},
  setRenderOutline = () => {},
  renderInactiveSegmentations = true,
}) => {
  if (!segmentationsInfo?.length) {
    return (
      <div className="select-none bg-black py-[3px]">
        {showAddSegmentation && !disableEditing && (
          <NoSegmentationRow onSegmentationAdd={onSegmentationAdd} />
        )}
      </div>
    );
  }

  const activeSegmentationInfo = segmentationsInfo.find(info => info.representation.active);

  if (!activeSegmentationInfo) {
    return null;
  }

  const activeSegmentationId = activeSegmentationInfo?.segmentation.segmentationId;

  return (
    <div>
      <PanelSection title="Segmentation List">
        <SegmentationDropDownRow
          segmentations={segmentationsInfo.map(info => ({
            id: info.segmentation.segmentationId,
            label: info.segmentation.label,
            isActive: info.representation.active,
            isVisible: info.representation.visible,
          }))}
          disableEditing={disableEditing}
          onActiveSegmentationChange={onSegmentationClick}
          onSegmentationDelete={onSegmentationDelete}
          onSegmentationEdit={onSegmentationEdit}
          onSegmentationDownload={onSegmentationDownload}
          onSegmentationDownloadRTSS={onSegmentationDownloadRTSS}
          storeSegmentation={storeSegmentation}
          onSegmentationAdd={onSegmentationAdd}
          onToggleSegmentationVisibility={onToggleSegmentationVisibility}
        />
        <SegmentationConfig
          representation={activeSegmentationInfo.representation}
          setFillAlpha={(value: number) =>
            setFillAlpha(activeSegmentationId, activeSegmentationInfo.representation.type, value)
          }
          setOutlineWidth={(value: number) =>
            setOutlineWidthActive(
              activeSegmentationId,
              activeSegmentationInfo.representation.type,
              value
            )
          }
          renderInactiveSegmentations={renderInactiveSegmentations}
          toggleRenderInactiveSegmentations={toggleRenderInactiveSegmentations}
          setRenderFill={(value: boolean) =>
            setRenderFill(activeSegmentationId, activeSegmentationInfo.representation.type, value)
          }
          setRenderOutline={(value: boolean) =>
            setRenderOutline(
              activeSegmentationId,
              activeSegmentationInfo.representation.type,
              value
            )
          }
          setFillAlphaInactive={(value: number) =>
            setFillAlphaInactive(
              activeSegmentationId,
              activeSegmentationInfo.representation.type,
              value
            )
          }
        />
        {showAddSegment && (
          <div className="bg-primary-dark my-px flex h-9 w-full items-center justify-between rounded pl-0.5 pr-7">
            <Button
              size="sm"
              variant="ghost"
              className="pr pl-0.5"
              onClick={() => onSegmentAdd(activeSegmentationId)}
            >
              <Icons.Add />
              Add Segment
            </Button>
            <Button
              size="icon"
              variant="ghost"
            >
              <Icons.Hide className="h-6 w-6" />
            </Button>
          </div>
        )}
        <ScrollArea
          className="ohif-scrollbar invisible-scrollbar bg-bkg-low h-[600px] space-y-px"
          showArrows={true}
        >
          {Object.values(activeSegmentationInfo?.representation?.segments).map(segment => {
            if (!segment) {
              return null;
            }
            const { segmentIndex, color, visible } = segment;
            const segmentFromSegmentation =
              activeSegmentationInfo?.segmentation.segments[segmentIndex];

            const { locked, active, label } = segmentFromSegmentation;

            return (
              <SegmentationGroupSegment
                key={segmentIndex}
                segmentationId={activeSegmentationId}
                segmentIndex={segmentIndex}
                label={label}
                color={color}
                isActive={active}
                disableEditing={disableEditing || !showDeleteSegment}
                isLocked={locked}
                isVisible={visible}
                onClick={onSegmentClick}
                onEdit={onSegmentEdit}
                onDelete={onSegmentDelete}
                onColor={onSegmentColorClick}
                onToggleVisibility={onToggleSegmentVisibility}
                onToggleLocked={onToggleSegmentLock}
              />
            );
          })}
        </ScrollArea>
      </PanelSection>
    </div>
  );
};

export default SegmentationGroupTable;
