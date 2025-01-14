import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Icons } from '@ohif/ui-next';

const MeasurementItem = ({
  uid,
  index,
  label,
  displayText,
  isActive = false,
  onClick,
  onEdit,
  onDelete,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isIndexHovering, setIsIndexHovering] = useState(false);

  const onEditHandler = event => {
    event.stopPropagation();
    onEdit({ uid, isActive, event });
  };

  const onDeleteHandler = event => {
    event.stopPropagation();
    onDelete({ uid, isActive, event });
  };

  const onClickHandler = event => onClick({ uid, isActive, event });

  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);

  return <div></div>;
};

MeasurementItem.propTypes = {
  uid: PropTypes.oneOfType([PropTypes.number.isRequired, PropTypes.string.isRequired]),
  index: PropTypes.number.isRequired,
  label: PropTypes.string,
  displayText: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default MeasurementItem;
