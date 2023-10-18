import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PanelSection } from '../../components';
import SegmentationConfig from './SegmentationConfig';
import SegmentationDropDownRow from './SegmentationDropDownRow';
import NoSegmentationRow from './NoSegmentationRow';
import AddSegmentRow from './AddSegmentRow';
import SegmentationGroupSegment from './SegmentationGroupSegment';
import { commandsManager } from 'platform/app/src/App';
import { Input, Label, Select, Button, ButtonGroup } from '@ohif/ui';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { servicesManager } from 'platform/app/src/App';
import { getActiveViewportEnabledElement } from 'extensions/cornerstone/src';
import {
  CONSTANTS as cstConstants,
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
  utilities as cstUtils,
} from '@cornerstonejs/tools';
import { getEnabledElement } from 'platform/core/src/state';
import OHIFCornerstoneSEGViewport from 'extensions/cornerstone-dicom-seg/src/viewports/OHIFCornerstoneSEGViewport';

const SegmentationGroupTable = ({
  segmentations,
  // segmentation initial config
  segmentationConfig,
  // UI show/hide
  disableEditing,
  showAddSegmentation,
  showAddSegment,
  showDeleteSegment,
  // segmentation/segment handlers
  onSegmentationAdd,
  onSegmentationEdit,
  onSegmentationClick,
  onSegmentationDelete,
  onSegmentationDownload,
  storeSegmentation,
  // segment handlers
  onSegmentClick,
  onSegmentAdd,
  onSegmentDelete,
  onSegmentEdit,
  onToggleSegmentationVisibility,
  onToggleSegmentVisibility,
  onToggleSegmentLock,
  onSegmentColorClick,
  // segmentation config handlers
  setFillAlpha,
  setFillAlphaInactive,
  setOutlineWidthActive,
  setOutlineOpacityActive,
  setRenderFill,
  setRenderInactiveSegmentations,
  setRenderOutline,
}) => {
  const { segmentationService, viewportGridService } = servicesManager.services;
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeSegmentationId, setActiveSegmentationId] = useState(null);
  const { t } = useTranslation('ROIThresholdConfiguration');
  const [targetHULow, setTargetLow] = useState(200);
  const [targetHUHigh, setTargetHigh] = useState(266);
  const [minHU, setMinHU] = useState(-90);
  const [maxHU, setMaxHU] = useState(500);
  const [lowHU, setLowHU] = useState(73);
  const [highHU, setHighHU] = useState(365);
  const [startSlice, setStart] = useState(1);
  const [endSlice, setEnd] = useState(10);
  let overwrite = false;
  const handleSetRange = useCallback(async () => {
    // Perform the action to set the Hounsfield range
    const segmentation = commandsManager.runCommand('getSegmentation', {
      segmentationId: activeSegmentationId,
    });

    let newEndSlice;
    for (let activeIndex = 1; activeIndex <= segmentation.segmentCount; activeIndex++) {
      console.log(activeIndex);
      segmentationService.setActiveSegment(activeSegmentationId, activeIndex);
      segmentationService.setSegmentColor(
        activeSegmentationId,
        activeIndex,
        segmentation.segments[activeIndex].color
      );
      segmentationService.setSegmentOpacity(
        activeSegmentationId,
        activeIndex,
        segmentation.segments[activeIndex].opacity
      );
      if (endSlice - startSlice > 20) {
        newEndSlice = startSlice + 20;
        for (let newStartSlice = startSlice; newStartSlice < endSlice; newStartSlice += 20) {
          if (newStartSlice + 20 > endSlice) {
            await commandsManager.runCommand('thresholdSegmentation', {
              segmentationId: activeSegmentationId,
              minHU: minHU,
              maxHU: maxHU,
              lowHU: lowHU,
              highHU: highHU,
              targetHUHigh: targetHUHigh,
              targetHULow: targetHULow,
              startSlice: newStartSlice - 1,
              endSlice: endSlice,
              overwrite: overwrite,
              segmentIndex: activeIndex,
            });
          } else {
            await commandsManager.runCommand('thresholdSegmentation', {
              segmentationId: activeSegmentationId,
              minHU: minHU,
              maxHU: maxHU,
              lowHU: lowHU,
              highHU: highHU,
              targetHUHigh: targetHUHigh,
              targetHULow: targetHULow,
              startSlice: newStartSlice - 1,
              endSlice: newEndSlice,
              overwrite: overwrite,
              segmentIndex: activeIndex,
            });
          }
          newEndSlice += 20;
        }
      } else {
        await commandsManager.runCommand('thresholdSegmentation', {
          segmentationId: activeSegmentationId,
          minHU: minHU,
          maxHU: maxHU,
          lowHU: lowHU,
          highHU: highHU,
          targetHUHigh: targetHUHigh,
          targetHULow: targetHULow,
          startSlice: startSlice - 1,
          endSlice: endSlice,
          overwrite: overwrite,
          segmentIndex: activeIndex,
        });
      }
      if (activeIndex === segmentation.segmentCount) {
        overwrite = true;
      } else {
        overwrite = false;
      }
    }
  }, [
    commandsManager,
    activeSegmentationId,
    minHU,
    maxHU,
    lowHU,
    highHU,
    targetHUHigh,
    targetHULow,
    startSlice,
    endSlice,
  ]);
  const onActiveSegmentationChange = segmentationId => {
    onSegmentationClick(segmentationId);
    setActiveSegmentationId(segmentationId);
  };

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

  return (
    <div className="flex min-h-0 flex-col bg-black text-[13px] font-[300]">
      <PanelSection
        title="Segmentation"
        actionIcons={
          activeSegmentation && [
            {
              name: 'settings-bars',
              onClick: () => setIsConfigOpen(isOpen => !isOpen),
            },
          ]
        }
      >
        <div className="bg-primary-dark flex flex-col space-y-4 px-4 py-2">
          <div className="mr-2 text-sm">
            <Label
              className="text-white"
              text="Hounsfield Unit Range"
            />
            <div className="flex justify-between">
              <Input
                label={t('Min HU')}
                labelClassName="text-white"
                className="border-primary-main mt-2 bg-black"
                type="text"
                containerClassName="mr-2"
                value={minHU}
                onChange={e => {
                  if (e.target.value === '-') {
                    setMinHU(e.target.value);
                    console.log(minHU);
                    return;
                  }
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setMinHU(value);
                    console.log(minHU);
                  } else {
                    // handle invalid input, e.g., reset to default value or set to 0
                    setMinHU(0);
                    console.log(minHU);
                  }
                }}
              />
              <Input
                label={t('Low HU')}
                labelClassName="text-white"
                className="border-primary-main mt-2 bg-black"
                type="text"
                containerClassName="mr-2"
                value={lowHU}
                onChange={e => {
                  if (e.target.value === '-') {
                    setLowHU(e.target.value);
                    return;
                  }
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setLowHU(value);
                  }
                }}
              />
            </div>
            <div className="flex justify-between">
              <Input
                label={t('High HU')}
                labelClassName="text-white"
                className="border-primary-main mt-2 bg-black"
                type="text"
                containerClassName="mr-2"
                value={highHU}
                onChange={e => {
                  if (e.target.value === '-') {
                    setHighHU(e.target.value);
                    return;
                  }
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setHighHU(value);
                  }
                }}
              />
              <Input
                label={t('Max HU')}
                labelClassName="text-white"
                className="border-primary-main mt-2 bg-black"
                type="text"
                containerClassName="mr-2"
                value={maxHU}
                onChange={e => {
                  if (e.target.value === '-') {
                    setMaxHU(e.target.value);
                    console.log(maxHU);

                    return;
                  }
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setMaxHU(value);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Input
              label={t('Target HU Low')}
              labelClassName="text-white"
              className="border-primary-main mt-2 bg-black"
              type="text"
              containerClassName="mr-2"
              value={targetHULow}
              onChange={e => {
                if (e.target.value === '-') {
                  setTargetLow(e.target.value);
                  return;
                }
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value)) {
                  setTargetLow(value);
                }
              }}
            />
            <Input
              label={t('Target HU High')}
              labelClassName="text-white"
              className="border-primary-main mt-2 bg-black"
              type="text"
              containerClassName="mr-2"
              value={targetHUHigh}
              onChange={e => {
                if (e.target.value === '-') {
                  setTargetHigh(e.target.value);
                  return;
                }
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value)) {
                  setTargetHigh(value);
                }
              }}
            />
          </div>
          <div className="flex justify-between">
            <Input
              label={t('Start Slice')}
              labelClassName="text-white"
              className="border-primary-main mt-2 bg-black"
              type="text"
              containerClassName="mr-2"
              value={startSlice}
              onChange={e => {
                console.log(e.target.value);
                if (e.target.value === '-') {
                  setStart(e.target.value);
                  return;
                }
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value)) {
                  setStart(value);
                }
              }}
            />
            <Input
              label={t('End Slice')}
              labelClassName="text-white"
              className="border-primary-main mt-2 bg-black"
              type="text"
              containerClassName="mr-2"
              value={endSlice}
              onChange={e => {
                console.log(e.target.value);
                if (e.target.value === '-') {
                  setEnd(e.target.value);
                  return;
                }
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value)) {
                  setEnd(value);
                }
              }}
            />
          </div>
          <div className="mr-2 text-sm">
            <Label className="text-white" />

            <div>
              <Button
                size="medium"
                className="group-hover:bg-secondary-dark flex w-full items-center rounded-[4px] pr-2 text-white"
                color="primary"
                variant="outlined"
                onClick={handleSetRange}
              >
                {t('Add Color Segments')}
              </Button>
            </div>
          </div>
        </div>
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
        <div className="bg-primary-dark">
          {segmentations?.length === 0 ? (
            <div className="select-none rounded-[4px]">
              {showAddSegmentation && !disableEditing && (
                <NoSegmentationRow onSegmentationAdd={onSegmentationAdd} />
              )}
            </div>
          ) : (
            <div className="mt-1 select-none">
              <SegmentationDropDownRow
                segmentations={segmentations}
                disableEditing={disableEditing}
                activeSegmentation={activeSegmentation}
                onActiveSegmentationChange={onActiveSegmentationChange}
                onSegmentationDelete={onSegmentationDelete}
                onSegmentationEdit={onSegmentationEdit}
                onSegmentationDownload={onSegmentationDownload}
                storeSegmentation={storeSegmentation}
                onSegmentationAdd={onSegmentationAdd}
                onToggleSegmentationVisibility={onToggleSegmentationVisibility}
              />
              {/* {!disableEditing && showAddSegment && (
                <AddSegmentRow onClick={() => handleSetRange()} />
              )} */}
            </div>
          )}
        </div>
        {activeSegmentation && (
          <div className="ohif-scrollbar mt-1.5 flex min-h-0 flex-col overflow-y-hidden">
            {activeSegmentation?.segments?.map(segment => {
              if (!segment) {
                return null;
              }

              const { segmentIndex, color, label, isVisible, isLocked } = segment;
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
                    isActive={activeSegmentation.activeSegmentIndex === segmentIndex}
                    disableEditing={disableEditing}
                    isLocked={isLocked}
                    isVisible={isVisible}
                    onClick={onSegmentClick}
                    onEdit={onSegmentEdit}
                    onDelete={onSegmentDelete}
                    showDelete={showDeleteSegment}
                    onColor={onSegmentColorClick}
                    onToggleVisibility={onToggleSegmentVisibility}
                    onToggleLocked={onToggleSegmentLock}
                  />
                </div>
              );
            })}
          </div>
        )}
      </PanelSection>
    </div>
  );
};

SegmentationGroupTable.propTypes = {
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

SegmentationGroupTable.defaultProps = {
  segmentations: [],
  disableEditing: false,
  showAddSegmentation: true,
  showAddSegment: true,
  showDeleteSegment: true,
  onSegmentationAdd: () => { },
  onSegmentationEdit: () => { },
  onSegmentationClick: () => { },
  onSegmentationDelete: () => { },
  onSegmentationDownload: () => { },
  storeSegmentation: () => { },
  onSegmentClick: () => { },
  onSegmentAdd: () => { },
  onSegmentDelete: () => { },
  onSegmentEdit: () => { },
  onToggleSegmentationVisibility: () => { },
  onToggleSegmentVisibility: () => { },
  onToggleSegmentLock: () => { },
  onSegmentColorClick: () => { },
  setFillAlpha: () => { },
  setFillAlphaInactive: () => { },
  setOutlineWidthActive: () => { },
  setOutlineOpacityActive: () => { },
  setRenderFill: () => { },
  setRenderInactiveSegmentations: () => { },
  setRenderOutline: () => { },
};
export default SegmentationGroupTable;
