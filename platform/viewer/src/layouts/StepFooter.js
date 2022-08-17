import React from 'react';
import { useSelector } from 'react-redux';
import Logo from '../components/logo';

export const StepFooter = ({ next, back }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <h2
          style={{
            fontweight: '700',
          }}
        >
          Login:{' '}
        </h2>
      </div>

      <div>
        <Logo />
      </div>
    </div>
  );
};
