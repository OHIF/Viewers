import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TableListItem, Icon } from '@ohif/ui';

import './StructureSetItem.css';

const ColoredCircle = ({ color }) => {
  return (
    <div
      className="item-color"
      style={{ backgroundColor: `rgba(${color.join(',')})` }}
    ></div>
  );
};

ColoredCircle.propTypes = {
  color: PropTypes.array.isRequired,
};

const StructureSetItem = ({
  index,
  label,
  onClick,
  itemClass,
  color,
  visible = true,
  onVisibilityChange,
  selected = false,
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible])

  return (
    <div className={`dcmrt-structure-set-item ${selected && 'selected'}`}>
      <TableListItem
        key={index}
        itemKey={index}
        itemIndex={index}
        itemClass={itemClass}
        itemMeta={<ColoredCircle color={color} />}
        itemMetaClass="item-color-section"
        onItemClick={onClick}
      >
        <div>
          <div className="item-label" style={{ marginBottom: 4 }}>
            <span>{label}</span>
            <Icon
              className={`eye-icon ${isVisible && '--visible'}`}
              name={isVisible ? 'eye' : 'eye-closed'}
              width="20px"
              height="20px"
              onClick={event => {
                event.stopPropagation();
                const newVisibility = !isVisible;
                setIsVisible(newVisibility);
                onVisibilityChange(newVisibility);
              }}
            />
          </div>
          {false && <div className="item-info">{'...'}</div>}
          {false && (
            <div className="item-actions">
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

StructureSetItem.propTypes = {
  index: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  itemClass: PropTypes.string,
  color: PropTypes.array.isRequired,
};

StructureSetItem.defaultProps = {
  itemClass: '',
  onClick: () => { },
};

export default StructureSetItem;
