import React from 'react';
import showModal from './showModal';

const modalContent = (props => {
  const { message } = props;
  return (
    <div>
      <h3 style={{ color: 'var(--text-secondary-color)' }}>{message}</h3>
    </div>
  );
});

export function showStatusModal(message= 'Please wait ...') {
  return showModal(modalContent, { message });
}

export function updateStatusModal(message) {
  showStatusModal(message);
}

