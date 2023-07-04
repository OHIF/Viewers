import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../Tooltip';
import Icon from '../Icon';
import { useTranslation } from 'react-i18next';

const DisplaySetMessageListTooltip = ({ messages }): React.ReactNode => {
  const { t } = useTranslation('Messages');
  if (messages.size()) {
    return (
      <div>
        <Tooltip
          position="left"
          tight={true}
          content={
            <div className="text-left max-w-40">
              <div className="break-normal text-base text-blue-300 font-bold">
                Series Messages
              </div>
              <ol>
                {messages.messages.map((message, index) => (
                  <li key={index}>
                    {index + 1}. {t(message.id)}
                  </li>
                ))}
              </ol>
            </div>
          }
        >
          <Icon name="notifications-warning" className="w-3 h-3" />
        </Tooltip>
      </div>
    );
  }
  return <></>;
};

DisplaySetMessageListTooltip.propTypes = {
  messages: PropTypes.object,
};

export default DisplaySetMessageListTooltip;
