import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  getNameInitials,
  getPredefinedColor,
} from '@pubnub/react-chat-components';
import { Icon, Tooltip } from '../';

const MeasurementItem = ({
  id,
  author,
  createdAt,
  index,
  label,
  displayText,
  isActive,
  onClick,
  onEdit,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const onEditHandler = event => {
    event.stopPropagation();
    onEdit({ id, isActive, event });
  };

  const onClickHandler = event => onClick({ id, isActive, event });

  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);

  const { profile_picture, name, username } = author;

  return (
    <div
      className={classnames(
        'group flex cursor-pointer bg-black border outline-none border-transparent transition duration-300',
        {
          'rounded overflow-hidden border-primary-light': isActive,
        }
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClickHandler}
      role="button"
      tabIndex="0"
      data-cy={'measurement-item'}
    >
      <div
        className={classnames(
          'text-center w-6 py-1 text-base transition duration-300',
          {
            'bg-primary-light text-black active': isActive,
            'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
          }
        )}
      >
        {index}
      </div>
      <div className="flex flex-1 px-2 py-1 items-center">
        <div className="relative flex flex-col flex-1">
          <span className="mb-1 text-base text-primary-light">{label}</span>
          {displayText.map(line => (
            <span
              key={line}
              className="pl-2 text-base text-white border-l border-primary-light"
              dangerouslySetInnerHTML={{ __html: line }}
            ></span>
          ))}
          <Icon
            className={classnames(
              'text-white w-4 absolute cursor-pointer transition duration-300',
              { 'invisible opacity-0 mr-2': !isActive && !isHovering },
              { 'visible opacity-1': !isActive && isHovering }
            )}
            name="pencil"
            style={{
              top: 4,
              right: 4,
              transform: isActive || isHovering ? '' : 'translateX(100%)',
            }}
            onClick={onEditHandler}
          />
        </div>
        <Tooltip
          content={
            <p className="text-sm">
              Author: {name || username}
              <br />
              Created: {new Date(createdAt).toDateString()}
            </p>
          }
          position="left"
        >
          <div
            className="flex items-center justify-center bg-center bg-cover bg-no-repeat rounded-full w-8 h-8"
            style={{
              color: '#2a2a39',
              backgroundColor: getPredefinedColor(author.id),
              ...(profile_picture
                ? { backgroundImage: `url(${profile_picture})` }
                : {}),
            }}
          >
            {profile_picture ? '' : getNameInitials(author.name)}
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

MeasurementItem.propTypes = {
  id: PropTypes.oneOfType([
    PropTypes.number.isRequired,
    PropTypes.string.isRequired,
  ]),
  author: PropTypes.object,
  createdAt: PropTypes.string,
  index: PropTypes.number.isRequired,
  label: PropTypes.string,
  displayText: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
};

MeasurementItem.defaultProps = {
  isActive: false,
};

export default MeasurementItem;
