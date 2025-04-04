import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PanelSection } from '../../components';
import SegmentationConfig from './SegmentationConfig';
import NoSegmentationRow from './NoSegmentationRow';
import { useTranslation } from 'react-i18next';
import SegmentationItem from './SegmentationItem';

const SegmentationGroupTableExpanded = ({
  segmentations = [],
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
  setRenderInactiveSegmentations = () => {},
  setRenderOutline = () => {},
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeSegmentationId, setActiveSegmentationId] = useState(null);

  useEffect(() => {
    // find the first active segmentation to set
    let activeSegmentationIdToSet = segmentations?.find(segmentation => segmentation.isActive)?.id;

    // If there is no active segmentation, set the first one to be active
    if (!activeSegmentationIdToSet && segmentations?.length > 0) {
      activeSegmentationIdToSet = segmentations[0].id;
    }

    // If there is no segmentation, set the active segmentation to null
    if (segmentations?.length === 0) {
      activeSegmentationIdToSet = null;
    }

    setActiveSegmentationId(activeSegmentationIdToSet);
  }, [segmentations]);

  const activeSegmentation = segmentations?.find(
    segmentation => segmentation.id === activeSegmentationId
  );
  const { t } = useTranslation('SegmentationTable');

  return (
    <div className="flex min-h-0 flex-col bg-black text-[13px] font-[300]">
      <PanelSection
        title={t('Segmentation')}
        actionIcons={
          activeSegmentation && [
            {
              name: 'settings-bars',
              onClick: () => setIsConfigOpen(isOpen => !isOpen),
            },
          ]
        }
      >
        {isConfigOpen && (
          <SegmentationConfig
            setFillAlpha={setFillAlpha}
            setFillAlphaInactive={setFillAlphaInactive}
            setOutlineWidthActive={setOutlineWidthActive}
            setOutlineOpacityActive={setOutlineOpacityActive}
            setRenderFill={setRenderFill}
            setRenderInactiveSegmentations={setRenderInactiveSegmentations}
            setRenderOutline={setRenderOutline}
            segmentationConfig={segmentationConfig}
          />
        )}
        <div className="bg-primary-dark flex flex-1 flex-col overflow-hidden">
          <div className="select-none bg-black pt-[5px] pb-[5px]">
            {showAddSegmentation && !disableEditing && (
              <NoSegmentationRow onSegmentationAdd={onSegmentationAdd} />
            )}
          </div>
          {segmentations?.length > 0 && (
            <div className="ohif-scrollbar flex flex-1 select-none flex-col gap-[5px] overflow-auto bg-black">
              {segmentations?.map(segmentation => {
                return (
                  <div key={segmentation.id}>
                    <SegmentationItem
                      key={segmentation.id}
                      segmentation={segmentation}
                      disableEditing={disableEditing}
                      onToggleSegmentationVisibility={onToggleSegmentationVisibility}
                      onSegmentationEdit={onSegmentationEdit}
                      onSegmentationDelete={onSegmentationDelete}
                      onSegmentationDownload={onSegmentationDownload}
                      onSegmentationDownloadRTSS={onSegmentationDownloadRTSS}
                      storeSegmentation={storeSegmentation}
                      showAddSegment={showAddSegment}
                      onSegmentAdd={onSegmentAdd}
                      onSegmentClick={onSegmentClick}
                      onSegmentDelete={onSegmentDelete}
                      onSegmentEdit={onSegmentEdit}
                      showDeleteSegment={showDeleteSegment}
                      onSegmentColorClick={onSegmentColorClick}
                      onToggleSegmentVisibility={onToggleSegmentVisibility}
                      onToggleSegmentLock={onToggleSegmentLock}
                      activeSegmentationId={activeSegmentationId}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PanelSection>
    </div>
  );
};

SegmentationGroupTableExpanded.propTypes = {
  segmentations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      isActive: PropTypes.bool.isRequired,
      segments: PropTypes.arrayOf(
        PropTypes.shape({
          segmentIndex: PropTypes.number.isRequired,
          color: PropTypes.array.isRequired,
          label: PropTypes.string.isRequired,
          isVisible: PropTypes.bool.isRequired,
          isLocked: PropTypes.bool.isRequired,
        })
      ),
    })
  ),
  segmentationConfig: PropTypes.object.isRequired,
  disableEditing: PropTypes.bool,
  showAddSegmentation: PropTypes.bool,
  showAddSegment: PropTypes.bool,
  showDeleteSegment: PropTypes.bool,
  onSegmentationAdd: PropTypes.func.isRequired,
  onSegmentationEdit: PropTypes.func.isRequired,
  onSegmentationClick: PropTypes.func.isRequired,
  onSegmentationDelete: PropTypes.func.isRequired,
  onSegmentationDownload: PropTypes.func.isRequired,
  onSegmentationDownloadRTSS: PropTypes.func,
  storeSegmentation: PropTypes.func.isRequired,
  onSegmentClick: PropTypes.func.isRequired,
  onSegmentAdd: PropTypes.func.isRequired,
  onSegmentDelete: PropTypes.func.isRequired,
  onSegmentEdit: PropTypes.func.isRequired,
  onToggleSegmentationVisibility: PropTypes.func.isRequired,
  onToggleSegmentVisibility: PropTypes.func.isRequired,
  onToggleSegmentLock: PropTypes.func.isRequired,
  onSegmentColorClick: PropTypes.func.isRequired,
  setFillAlpha: PropTypes.func.isRequired,
  setFillAlphaInactive: PropTypes.func.isRequired,
  setOutlineWidthActive: PropTypes.func.isRequired,
  setOutlineOpacityActive: PropTypes.func.isRequired,
  setRenderFill: PropTypes.func.isRequired,
  setRenderInactiveSegmentations: PropTypes.func.isRequired,
  setRenderOutline: PropTypes.func.isRequired,
};

export default SegmentationGroupTableExpanded;
