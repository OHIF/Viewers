import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PortalTooltip from '../Tooltip/PortalTooltip';
import Icon from '../Icon';
import { useTranslation } from 'react-i18next';

/**
 * Displays a tooltip with a list of messages of a displaySet
 * @param param0
 * @returns
 */
const DisplaySetMessageListTooltip = ({ messages, id }): React.ReactNode => {
  const { t } = useTranslation('Messages');
  const [isOpen, setIsOpen] = useState(false);
  if (messages?.size()) {
    return (
      <>
        <Icon
          id={id}
          onMouseOver={() => setIsOpen(true)}
          onFocus={() => setIsOpen(true)}
          onMouseOut={() => setIsOpen(false)}
          onBlur={() => setIsOpen(false)}
          name="status-alert-warning"
        />
        <PortalTooltip
          active={isOpen}
          position="right"
          arrow="center"
          parent={`#${id}`}
        >
          <div className="bg-primary-dark border-secondary-light max-w-64 rounded border text-left text-base text-white">
            <div
              className="break-normal text-base font-bold text-blue-300"
              style={{
                marginLeft: '12px',
                marginTop: '12px',
              }}
            >
              {t('Display Set Messages')}
            </div>
            <ol
              style={{
                marginLeft: '12px',
                marginRight: '12px',
              }}
            >
              {messages.messages.map((message, index) => (
                <li
                  style={{
                    marginTop: '6px',
                    marginBottom: '6px',
                  }}
                  key={index}
                >
                  {index + 1}. {t(message.id)}
                </li>
              ))}
            </ol>
          </div>
        </PortalTooltip>
      </>
    );
  }
  return <></>;
};

DisplaySetMessageListTooltip.propTypes = {
  messages: PropTypes.object,
};

export default DisplaySetMessageListTooltip;
