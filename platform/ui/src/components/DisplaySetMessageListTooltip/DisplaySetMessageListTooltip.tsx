import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../Tooltip';
import Icon from '../Icon';
import { useTranslation } from 'react-i18next';

/**
 * Displays a tooltip with a list of messages of a displaySet
 * @param param0
 * @returns
 */
const DisplaySetMessageListTooltip = ({ messages }): React.ReactNode => {
  const { t } = useTranslation('Messages');
  if (messages.size()) {
    return (
      <div>
        <Tooltip
          position="right"
          tight={true}
          content={
            <div className="text-left max-w-40">
              <div
                className="break-normal text-base text-blue-300 font-bold"
                style={{
                  marginLeft: '12px',
                  marginTop: '12px',
                }}
              >
                DisplaySet Messages
              </div>
              <ol
                style={{
                  marginLeft: '12px',
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
          }
        >
          <Icon name="status-alert-warning" />
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
