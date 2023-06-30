import React from 'react';
import {
  displayServiceMessage,
  displayLocationCodes,
} from './displayServiceMessage';

export default function displaySetMessageThumbnailContent(
  messages: displayServiceMessage[]
): React.ReactNode {
  return (
    <>
      <div className="break-normal text-base text-blue-300 font-bold">
        Series Messages
      </div>
      <ol>
        {messages
          .filter(
            message =>
              (message.displayLocation = displayLocationCodes.THUMBNAIL)
          )
          .map((message, index) => (
            <li key={index}>
              {index + 1}. {message.toString()}
            </li>
          ))}
      </ol>
    </>
  );
}
