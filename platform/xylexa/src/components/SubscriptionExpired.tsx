import React from 'react';
import { Icon } from '@ohif/ui';
interface Props {}

export const SubscriptionExpired = (props: Props) => {
  return (
    <div className="flex h-screen w-full items-center justify-center text-white">
      <div className="align-items-center flex flex-col justify-center">
        <Icon
          name="alert-square"
          style={{ width: '6rem', height: '6rem', alignSelf: 'center' }}
        />
        <span
          className=""
          style={{ textAlign: 'center', fontSize: '2rem' }}
        >
          License Expired
        </span>

        <span
          style={{
            textAlign: 'center',
            fontSize: '1rem',
          }}
        >
          Please contact us here,{' '}
          <a
            href="https://www.xylexa.ai/contact"
            target="_blank"
            rel="no-referrer noreferrer"
            style={{
              color: '#32dffe',
            }}
          >
            www.xylexa.ai
          </a>
        </span>
      </div>
    </div>
  );
};
