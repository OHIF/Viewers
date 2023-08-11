import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';
import SegmentationGroup from './SegmentationGroup';
import { PanelSection, Select } from '../../components';
import SegmentationConfig from './SegmentationConfig';

// {
//   showAddSegmentation && (
//     <div
//       className="flex items-center cursor-pointer hover:opacity-80 text-primary-active bg-black text-[12px] pl-1 h-[45px]"
//       onClick={() => onSegmentationAdd()}
//     >
//       <Icon name="row-add" className="w-5 h-5" />
//       <div className="pl-1">Add New Segmentation</div>
//     </div>
//   );
// }

const SegmentationGroupTable = ({
  segmentations,
  onSegmentationAdd,
  onSegmentationEdit,
  onSegmentationClick,
  onSegmentationDelete,
  showAddSegmentation,
  showAddSegment,
  onSegmentClick,
  onSegmentAdd,
  segmentationConfig,
  onSegmentDelete,
  onSegmentEdit,
  onToggleSegmentationVisibility,
  onToggleSegmentVisibility,
  onSegmentColorClick,
  isMinimized,
  onToggleMinimizeSegmentation,
  setFillAlpha,
  setFillAlphaInactive,
  setOutlineWidthActive,
  setOutlineOpacityActive,
  setRenderFill,
  setRenderInactiveSegmentations,
  setRenderOutline,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeSegmentation, setActiveSegmentation] = useState(
    segmentations[0]
  );

  return (
    <div className="flex flex-col min-h-0 font-inter font-[300] text-xs">
      <PanelSection
        title="Segmentation"
        actionIcons={[
          {
            name: 'settings-bars',
            onClick: () => setIsConfigOpen(!isConfigOpen),
          },
        ]}
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
        {segmentations?.length === 0 ? (
          <div className="text-white">{'No Segmentation'}</div>
        ) : (
          <div className="bg-black">
            {/* segmentation row add, hover edit etc */}
            <div className="flex items-center mt-[8px] space-x-1 group">
              <div className="w-[28px] h-[28px] flex items-center justify-center hover:bg-primary-dark">
                <Icon name="icon-add"></Icon>
              </div>
              <Select
                id="segmentation-select"
                isClearable={false}
                onChange={value => {
                  setActiveSegmentation(value);
                }}
                options={segmentations.map(s => ({
                  value: s.id,
                  label: s.label,
                }))}
                value={activeSegmentation}
                className="text-aqua-pale h-[26px] w-1/2"
              />
              <div className="items-center hidden group-hover:flex">
                <div className="w-[28px] h-[28px] flex items-center justify-center hover:bg-primary-dark">
                  <Icon name="icon-rename"></Icon>
                </div>
                <div className="w-[28px] h-[28px] flex items-center justify-center hover:bg-primary-dark">
                  <Icon name="icon-delete"></Icon>
                </div>
              </div>
            </div>
            {/* add segment row  */}
            <div className="mt-[4px]"></div>
            {/* active segmentation list */}
          </div>
        )}
        {/* <div className="flex flex-col min-h-0 pr-[1px] mt-1">
          {!!segmentations.length &&
            segmentations.map((segmentation, index) => {
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
                  id={id}
                  key={id}
                  label={label}
                  isMinimized={isMinimized[id]}
                  segments={segments}
                  showAddSegment={showAddSegment}
                  segmentCount={segmentCount}
                  isActive={isActive}
                  isVisible={isVisible}
                  onSegmentColorClick={onSegmentColorClick}
                  onSegmentationClick={() => onSegmentationClick(id)}
                  activeSegmentIndex={activeSegmentIndex}
                  onToggleMinimizeSegmentation={onToggleMinimizeSegmentation}
                  onSegmentationEdit={onSegmentationEdit}
                  onSegmentationDelete={onSegmentationDelete}
                  onSegmentClick={onSegmentClick}
                  onSegmentEdit={onSegmentEdit}
                  onToggleSegmentVisibility={onToggleSegmentVisibility}
                  onToggleSegmentationVisibility={
                    onToggleSegmentationVisibility
                  }
                  onSegmentAdd={onSegmentAdd}
                  showSegmentDelete={false}
                />
              );
            })}
        </div> */}
      </PanelSection>
    </div>
  );
};

SegmentationGroupTable.propTypes = {
  title: PropTypes.string.isRequired,
  segmentations: PropTypes.array.isRequired,
  activeSegmentationId: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleLocked: PropTypes.func,
  onToggleVisibility: PropTypes.func.isRequired,
  onToggleVisibilityAll: PropTypes.func.isRequired,
  segmentationConfig: PropTypes.object,
};

SegmentationGroupTable.defaultProps = {
  title: '',
  segmentations: [],
  activeSegmentationId: '',
  showAddSegmentation: true,
  showAddSegment: true,
  onClick: () => {},
  onEdit: () => {},
  onDelete: () => {},
  onToggleLocked: () => {},
  onToggleVisibility: () => {},
  onToggleVisibilityAll: () => {},
  segmentationConfig: {
    initialConfig: {
      fillAlpha: 0.5,
      fillAlphaInactive: 0.5,
      outlineWidthActive: 1,
      outlineOpacity: 1,
      outlineOpacityInactive: 0.5,
      renderFill: true,
      renderInactiveSegmentations: true,
      renderOutline: true,
    },
  },
  setFillAlpha: () => {},
  setFillAlphaInactive: () => {},
  setOutlineWidthActive: () => {},
  setOutlineOpacityActive: () => {},
  setRenderFill: () => {},
  setRenderInactiveSegmentations: () => {},
  setRenderOutline: () => {},
};

export default SegmentationGroupTable;
