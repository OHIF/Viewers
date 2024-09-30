import React from 'react';
import PropTypes from 'prop-types';
import { Icons } from '../Icons';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../Tooltip';

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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger id={id}>
              <Icons.StatusWarning className="h-[20px] w-[20px]" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="max-w-64 text-left text-base text-white">
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
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
