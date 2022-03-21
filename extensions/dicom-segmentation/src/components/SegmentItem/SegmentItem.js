import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TableListItem, Icon } from '@ohif/ui';
import ReactTooltip from 'react-tooltip';

import './SegmentItem.css';

const ColoredCircle = ({ color }) => {
  return (
    <div
      className="segment-color"
      style={{ backgroundColor: `rgba(${color.join(',')})` }}
    ></div>
  );
};

ColoredCircle.propTypes = {
  color: PropTypes.array.isRequired,
};

const SegmentItem = ({
  index,
  label,
  onClick,
  itemClass,
  color,
  labelmap3D,
  visible,
  onVisibilityChange,
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  const onClickHandler = () => onClick(index);

  const onVisibilityChangeHandler = event => {
    event.stopPropagation();
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    onVisibilityChange(newVisibility, index, labelmap3D);
  };

  return (
    <div className="dcmseg-segment-item">
      <TableListItem
        key={index}
        itemKey={index}
        itemIndex={index}
        itemClass={itemClass}
        itemMeta={<ColoredCircle color={color} />}
        itemMetaClass="segment-color-section"
        onItemClick={onClickHandler}
      >
        <div>
          <div className="segment-label" style={{ marginBottom: 4 }}>
            <a data-tip data-for={`SegmentHover${index}`}>
              <span>{label}</span>
            </a>
            <ReactTooltip
              id={`SegmentHover${index}`}
              delayShow={250}
              place="right"
              border={true}
              type="light"
            >
              <span>{label}</span>
            </ReactTooltip>
            <Icon
              className={`eye-icon ${isVisible && '--visible'}`}
              name={isVisible ? 'eye' : 'eye-closed'}
              width="20px"
              height="20px"
              onClick={onVisibilityChangeHandler}
            />
          </div>
          {false && <div className="segment-info">{'...'}</div>}
          {false && (
            <div className="segment-actions">
              <button
                className="btnAction"
                onClick={() => console.log('Relabelling...')}
              >
                <span style={{ marginRight: '4px' }}>
                  <Icon name="edit" width="14px" height="14px" />
                </span>
                Relabel
              </button>
              <button
                className="btnAction"
                onClick={() => console.log('Editing description...')}
              >
                <span style={{ marginRight: '4px' }}>
                  <Icon name="edit" width="14px" height="14px" />
                </span>
                Description
              </button>
            </div>
          )}
        </div>
      </TableListItem>
    </div>
  );
};

SegmentItem.propTypes = {
  index: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  itemClass: PropTypes.string,
  color: PropTypes.array.isRequired,
};

SegmentItem.defaultProps = {
  itemClass: '',
  onClick: () => {},
};

export default SegmentItem;
