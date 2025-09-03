import React from 'react';
import { Icon } from '@ohif/ui';
interface Props {}

export const AccountBlocked = (props: Props) => {
  return (
    <div className="flex h-screen w-full items-center justify-center text-white">
      <div className="align-items-center flex flex-col justify-center">
        <Icon
          name="icon-alert-small"
          style={{ width: '6rem', height: '6rem', alignSelf: 'center', marginBottom: '1rem' }}
        />
        <span
          className=""
          style={{ textAlign: 'center', fontSize: '1.5rem' }}
        >
          Account has been temporarily locked as a result of multiple incorrect login attempts.
        </span>

        <span
          style={{
            textAlign: 'center',
            fontSize: '1rem',
          }}
        >
          Please contact us at{' '}
          <a
            href="https://www.xylexa.ai/contact"
            target="_blank"
            rel="no-referrer noreferrer"
            style={{
              color: '#32dffe',
            }}
          >
            Support
          </a>
        </span>
      </div>
    </div>
  );
};
