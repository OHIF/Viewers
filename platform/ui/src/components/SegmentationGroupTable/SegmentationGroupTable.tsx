import React, { useEffect, useState } from 'react';
import { PanelSection } from '../../components';
import SegmentationConfig from './SegmentationConfig';
import SegmentationDropDownRow from './SegmentationDropDownRow';
import NoSegmentationRow from './NoSegmentationRow';
import AddSegmentRow from './AddSegmentRow';
import SegmentationGroupSegment from './SegmentationGroupSegment';
import { useTranslation } from 'react-i18next';

type SegmentationGroupTableProps = {
  segmentationsInfo: AppTypes.Segmentation.SegmentationInfo[];
  segmentationConfig?: SegmentationConfig;
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
  setFillAlpha?: (value: number) => void;
  setFillAlphaInactive?: (value: number) => void;
  setOutlineWidthActive?: (value: number) => void;
  setOutlineOpacityActive?: (value: number) => void;
  setRenderFill?: (value: boolean) => void;
  setRenderInactiveRepresentations?: (value: boolean) => void;
  setRenderOutline?: (value: boolean) => void;
  addSegmentationClassName?: string;
};

const SegmentationGroupTable: React.FC<SegmentationGroupTableProps> = ({
  segmentationsInfo = [],
  segmentationConfig,
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
  setOutlineOpacityActive = () => {},
  setRenderFill = () => {},
  setRenderInactiveRepresentations = () => {},
  setRenderOutline = () => {},
  addSegmentationClassName,
}) => {
  const { t } = useTranslation('SegmentationTable');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  if (!segmentationsInfo?.length) {
    return (
      <div className="flex min-h-0 flex-col bg-black text-[13px] font-[300]">
        <PanelSection title={t('Segmentation')}>
          <div className="bg-primary-dark">
            <div className="select-none bg-black py-[3px]">
              {showAddSegmentation && !disableEditing && (
                <NoSegmentationRow
                  onSegmentationAdd={onSegmentationAdd}
                  addSegmentationClassName={addSegmentationClassName}
                />
              )}
            </div>
          </div>
        </PanelSection>
      </div>
    );
  }

  const representationExist = segmentationsInfo.find(info => info.representation !== null);

  if (!representationExist) {
    return null;
  }

  const { segmentation: activeSegmentation, representation: activeRepresentation } =
    segmentationsInfo.find(info => {
      const representation = info.representation;
      return representation.active;
    });

  const activeSegmentationId = activeSegmentation.segmentationId;

  debugger;

  return (
    <div className="flex min-h-0 flex-col bg-black text-[13px] font-[300]">
      <PanelSection
        title={t('Segmentation')}
        actionIcons={[
          {
            name: 'settings-bars',
            onClick: () => setIsConfigOpen(isOpen => !isOpen),
          },
        ]}
      >
        {/* {isConfigOpen && (
          <SegmentationConfig
            setFillAlpha={setFillAlpha}
            setFillAlphaInactive={setFillAlphaInactive}
            setOutlineWidthActive={setOutlineWidthActive}
            setOutlineOpacityActive={setOutlineOpacityActive}
            setRenderFill={setRenderFill}
            setRenderInactiveRepresentations={setRenderInactiveRepresentations}
            setRenderOutline={setRenderOutline}
            segmentationConfig={segmentationConfig}
          />
        )} */}
        <div className="bg-primary-dark">
          <div className="mt-1 select-none">
            <SegmentationDropDownRow
              segmentationsInfo={segmentationsInfo}
              disableEditing={disableEditing}
              activeSegmentation={activeSegmentation}
              onActiveSegmentationChange={onSegmentationClick}
              onSegmentationDelete={onSegmentationDelete}
              onSegmentationEdit={onSegmentationEdit}
              onSegmentationDownload={onSegmentationDownload}
              onSegmentationDownloadRTSS={onSegmentationDownloadRTSS}
              storeSegmentation={storeSegmentation}
              onSegmentationAdd={onSegmentationAdd}
              addSegmentationClassName={addSegmentationClassName}
              onToggleSegmentationVisibility={onToggleSegmentationVisibility}
            />
            {!disableEditing && showAddSegment && (
              <AddSegmentRow onClick={() => onSegmentAdd(activeSegmentationId)} />
            )}
          </div>
        </div>
        <div className="ohif-scrollbar flex h-fit min-h-0 flex-1 flex-col overflow-auto bg-black">
          {Object.values(activeRepresentation?.segments).map(segment => {
            if (!segment) {
              return null;
            }

            const { segmentIndex, color, visible } = segment;
            const segmentFromSegmentation = activeSegmentation.segments[segmentIndex];
            const { locked, active, cachedStats, label } = segmentFromSegmentation;

            return (
              <div
                className="mb-[1px]"
                key={segmentIndex}
              >
                <SegmentationGroupSegment
                  segmentationId={activeSegmentationId}
                  segmentIndex={segmentIndex}
                  label={label}
                  color={color}
                  isActive={active}
                  disableEditing={disableEditing}
                  isLocked={locked}
                  isVisible={visible}
                  onClick={onSegmentClick}
                  onEdit={onSegmentEdit}
                  onDelete={onSegmentDelete}
                  showDelete={disableEditing ? false : showDeleteSegment}
                  onColor={onSegmentColorClick}
                  onToggleVisibility={onToggleSegmentVisibility}
                  onToggleLocked={onToggleSegmentLock}
                />
              </div>
            );
          })}
        </div>
      </PanelSection>
    </div>
  );
};

export default SegmentationGroupTable;
