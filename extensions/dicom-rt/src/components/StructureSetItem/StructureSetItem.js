import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TableListItem, Icon, Tooltip, OverlayTrigger } from '@ohif/ui';
import ReactTooltip from 'react-tooltip';

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
  isDisabled,
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
  }, [visible]);

  let dcmrtClassNames = `dcmrt-structure-set-item`;

  if (selected) {
    dcmrtClassNames += ' selected';
  }

  if (isDisabled) {
    dcmrtClassNames += ' isDisabled';
  }

  const warningIcon = (
    <span>
      <Icon name="exclamation-triangle" />
    </span>
  );

  const tableListItem = (
    <TableListItem
      key={index}
      itemKey={index}
      itemIndex={index}
      itemClass={itemClass}
      itemMeta={isDisabled ? warningIcon : <ColoredCircle color={color} />}
      itemMetaClass="item-color-section"
      onItemClick={() => {
        if (isDisabled) {
          return;
        }

        onClick();
      }}
    >
      <div>
        <div className="item-label" style={{ marginBottom: 4 }}>
          <a data-tip data-for={`StructureHover${index}`}>
            <span>{label}</span>
          </a>
          <ReactTooltip
            id={`StructureHover${index}`}
            delayShow={250}
            place="right"
            border={true}
            type="light"
          >
            <span>{label}</span>
          </ReactTooltip>
          {!isDisabled && (
            <Icon
              className={`eye-icon ${isVisible && '--visible'}`}
              name={isVisible ? 'eye' : 'eye-closed'}
              width="20px"
              height="20px"
              onClick={event => {
                event.stopPropagation();

                if (isDisabled) {
                  return;
                }

                const newVisibility = !isVisible;
                setIsVisible(newVisibility);
                onVisibilityChange(newVisibility);
              }}
            />
          )}
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
  );

  return (
    <div className={dcmrtClassNames}>
      <React.Fragment>
        {isDisabled ? (
          <OverlayTrigger
            key={index}
            placement="left"
            overlay={
              <Tooltip
                placement="left"
                className="in tooltip-warning"
                id="tooltip-left"
              >
                <div className="warningTitle">Unsupported Region</div>
                <div className="warningContent">
                  Contour type currently unsupported.
                </div>
              </Tooltip>
            }
          >
            <div>{tableListItem}</div>
          </OverlayTrigger>
        ) : (
          <React.Fragment>{tableListItem} </React.Fragment>
        )}
      </React.Fragment>
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
  onClick: () => {},
};

export default StructureSetItem;
