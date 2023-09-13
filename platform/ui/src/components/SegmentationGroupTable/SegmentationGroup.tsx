import React from 'react';
import PropTypes from 'prop-types';
import SegmentationGroupSegment from './SegmentationGroupSegment';
import Dropdown from '../Dropdown';
import classnames from 'classnames';
import Icon from '../Icon';
import IconButton from '../IconButton';

const AddNewSegmentRow = ({
  id,
  onConfigChange,
  onToggleSegmentationVisibility,
  onSegmentAdd,
  isVisible,
  showAddSegment,
  disableEditing,
}) => {
  return (
    <div>
      <div className="text-primary-active flex cursor-pointer items-center bg-black py-1 pl-[29px] text-[12px] hover:opacity-80">
        {showAddSegment && !disableEditing && (
          <div
            className="flex items-center"
            onClick={() => onSegmentAdd()}
          >
            <Icon
              name="row-add"
              className="h-5 w-5"
            />
            <div className="">Add Segment</div>
          </div>
        )}
        <div className="flex-grow" />
        <div
          className="flex items-center pr-2"
          onClick={() => {
            onToggleSegmentationVisibility(id);
          }}
        >
          {isVisible ? (
            <Icon
              name="row-show-all"
              className="h-5 w-5"
            />
          ) : (
            <Icon
              name="row-hide-all"
              className="h-5 w-5"
            />
          )}
        </div>
      </div>
      {/* {isSegmentationConfigOpen && (
        <SegmentationConfig onConfigChange={onConfigChange} />
      )} */}
    </div>
  );
};

const SegmentGroupHeader = ({
  isMinimized,
  onToggleMinimizeSegmentation,
  onSegmentationClick,
  id,
  label,
  isActive,
  segmentCount,
  onSegmentationEdit,
  disableEditing,
  onSegmentationDelete,
}) => {
  return (
    <div
      className={classnames(
        'flex-static border-secondary-light flex h-[27px] cursor-pointer items-center gap-2 rounded-t-md border-b pr-2 pl-[3px] text-[12px]',
        {
          'bg-secondary-main': isActive,
          'bg-secondary-dark': !isActive,
        }
      )}
      onClick={evt => {
        evt.stopPropagation();
        onSegmentationClick(id);
      }}
    >
      <Icon
        name="panel-group-open-close"
        onClick={evt => {
          evt.stopPropagation();
          onToggleMinimizeSegmentation(id);
        }}
        className={classnames('h-5 w-5 cursor-pointer text-white transition duration-300', {
          'rotate-90 transform': !isMinimized,
        })}
      />
      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-white">
        {label.toUpperCase()}
      </span>
      <div className="flex-grow" />
      <span className="text-white ">{segmentCount}</span>
      <div
        onClick={e => {
          e.stopPropagation();
        }}
      >
        {!disableEditing && (
          <Dropdown
            id="segmentation-dropdown"
            showDropdownIcon={false}
            list={[
              {
                title: 'Rename',
                onClick: () => {
                  onSegmentationEdit(id);
                },
              },
              {
                title: 'Delete',
                onClick: () => {
                  onSegmentationDelete(id);
                },
              },
            ]}
          >
            <IconButton
              id={''}
              variant="text"
              color="inherit"
              size="initial"
              className="text-primary-active"
            >
              <Icon name="panel-group-more" />
            </IconButton>
          </Dropdown>
        )}
      </div>
    </div>
  );
};

const SegmentationGroup = ({
  label,
  id,
  segmentCount,
  isVisible,
  isActive,
  onSegmentClick,
  isMinimized,
  onSegmentColorClick,
  disableEditing,
  showAddSegment,
  segments,
  activeSegmentIndex,
  onSegmentAdd,
  onSegmentationClick,
  onClickSegmentColor,
  onSegmentationEdit,
  onToggleSegmentVisibility,
  onToggleSegmentationVisibility,
  onSegmentDelete,
  showSegmentDelete,
  onToggleMinimizeSegmentation,
  onSegmentationConfigChange,
  onSegmentationDelete,
  onSegmentEdit,
}) => {
  return (
    <div className="flex min-h-0 flex-auto flex-col">
      <SegmentGroupHeader
        id={id}
        label={label}
        isActive={isActive}
        isMinimized={isMinimized}
        onToggleMinimizeSegmentation={onToggleMinimizeSegmentation}
        onSegmentationClick={onSegmentationClick}
        segmentCount={segmentCount}
        onSegmentationEdit={onSegmentationEdit}
        onSegmentationDelete={onSegmentationDelete}
        disableEditing={disableEditing}
      />
      {!isMinimized && (
        <div className="flex min-h-0 flex-auto flex-col">
          <AddNewSegmentRow
            onConfigChange={onSegmentationConfigChange}
            onSegmentAdd={onSegmentAdd}
            isVisible={isVisible}
            onToggleSegmentationVisibility={onToggleSegmentationVisibility}
            id={id}
            disableEditing={disableEditing}
            showAddSegment={showAddSegment}
          />
          <div className="ohif-scrollbar flex min-h-0 flex-col overflow-y-hidden">
            {!!segments.length &&
              segments.map(segment => {
                if (segment === undefined || segment === null) {
                  return null;
                }

                const { segmentIndex, color, label, isVisible, isLocked } = segment;
                return (
                  <div
                    className="mb-[1px]"
                    key={segmentIndex}
                  >
                    <SegmentationGroupSegment
                      segmentationId={id}
                      segmentIndex={segmentIndex}
                      label={label}
                      color={color}
                      isActive={activeSegmentIndex === segmentIndex}
                      isLocked={isLocked}
                      isVisible={isVisible}
                      disableEditing={disableEditing}
                      onClick={onSegmentClick}
                      onEdit={onSegmentEdit}
                      onDelete={onSegmentDelete}
                      showSegmentDelete={showSegmentDelete}
                      onColor={onSegmentColorClick}
                      onToggleVisibility={onToggleSegmentVisibility}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

SegmentationGroup.propTypes = {
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  segments: PropTypes.array.isRequired,
  segmentCount: PropTypes.number.isRequired,
  isVisible: PropTypes.bool.isRequired,
  isActive: PropTypes.bool.isRequired,
  isMinimized: PropTypes.bool.isRequired,
  activeSegmentIndex: PropTypes.number,
  onClickNewSegment: PropTypes.func.isRequired,
  onClickSegment: PropTypes.func.isRequired,
  onClickSegmentEdit: PropTypes.func.isRequired,
  onClickSegmentDelete: PropTypes.func.isRequired,
  onToggleSegmentLocked: PropTypes.func,
  onToggleSegmentVisibility: PropTypes.func.isRequired,
  onToggleSegmentationVisibility: PropTypes.func.isRequired,
  onSegmentClick: PropTypes.func.isRequired,
  showAddSegment: PropTypes.bool.isRequired,
  onSegmentAdd: PropTypes.func.isRequired,
  onSegmentationClick: PropTypes.func.isRequired,
  onClickSegmentColor: PropTypes.func.isRequired,
  onSegmentationEdit: PropTypes.func.isRequired,
  onSegmentDelete: PropTypes.func.isRequired,
  onToggleMinimizeSegmentation: PropTypes.func.isRequired,
  onSegmentationConfigChange: PropTypes.func.isRequired,
  onSegmentationDelete: PropTypes.func.isRequired,
  onSegmentEdit: PropTypes.func.isRequired,
  disableEditing: PropTypes.bool,
};

SegmentationGroup.defaultProps = {
  label: '',
  segmentCount: 0,
  segments: [],
  isVisible: true,
  isMinimized: false,
  onClickNewSegment: () => {},
  onClickSegment: () => {},
  onClickSegmentEdit: () => {},
  onClickSegmentDelete: () => {},
  onToggleSegmentLocked: () => {},
  onToggleSegmentVisibility: () => {},
  onToggleSegmentationVisibility: () => {},
  onSegmentClick: () => {},
  showAddSegment: false,
  onSegmentAdd: () => {},
  onSegmentationClick: () => {},
  onClickSegmentColor: () => {},
  onSegmentationEdit: () => {},
  onSegmentDelete: () => {},
  onToggleMinimizeSegmentation: () => {},
  onSegmentationConfigChange: () => {},
  onSegmentationDelete: () => {},
  onSegmentEdit: () => {},
};

export default SegmentationGroup;
