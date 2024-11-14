import React from 'react';
import PropTypes from 'prop-types';
import { Icons } from '../Icons';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip';

/**
 * Displays a tooltip with a list of messages of a displaySet
 * @param param0
 * @returns
 */
const DisplaySetMessageListTooltip = ({ messages, id }): React.ReactNode => {
  const { t } = useTranslation('Messages');
  if (messages?.size()) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger id={id}>
            <Icons.StatusWarning
              className="h-[20px] w-[20px]"
              aria-hidden="true"
              role="presentation"
            />
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="max-w-68 text-left text-lg text-white">
              <div
                className="break-normal text-lg font-semibold text-blue-300"
                style={{
                  marginLeft: '4px',
                  marginTop: '4px',
                }}
              >
                {t('Display Set Messages')}
              </div>
              <ol
                style={{
                  marginLeft: '4px',
                  marginRight: '4px',
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
          </TooltipContent>
        </Tooltip>
      </>
    );
  }
  return <></>;
};

DisplaySetMessageListTooltip.propTypes = {
  messages: PropTypes.object,
  id: PropTypes.string,
};

export { DisplaySetMessageListTooltip };
