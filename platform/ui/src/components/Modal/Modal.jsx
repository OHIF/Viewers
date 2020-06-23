import React from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import classNames from 'classnames';

import { Typography, useModal } from '@ohif/ui';

const customStyle = {
  overlay: {
    zIndex: 1071,
    backgroundColor: 'rgb(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
};

ReactModal.setAppElement(document.getElementById('root'));

const Modal = ({
  className,
  closeButton,
  shouldCloseOnEsc,
  isOpen,
  title,
  onClose,
  children,
}) => {
  const { hide } = useModal();

  const handleClose = () => {
    hide();
  };

  const renderHeader = () => {
    return (
      title && (
        <header className="mb-6 pb-4 border-b border-secondary-main">
          <Typography variant="h4">{title}</Typography>
          {closeButton && (
            <button
              className="absolute top-0 right-0 bg-primary-main focus:outline-none text-white rounded-full text-2xl w-8 h-8 flex justify-center items-center -mr-3 -mt-3"
              data-cy="close-button"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </header>
      )
    );
  };

  return (
    <ReactModal
      className={classNames(
        `relative py-6 w-11/12 lg:w-10/12 xl:w-1/2 max-h-full outline-none bg-primary-dark border border-secondary-main text-white rounded ${className}`
      )}
      shouldCloseOnEsc={shouldCloseOnEsc}
      onRequestClose={handleClose}
      isOpen={isOpen}
      title={title}
      style={customStyle}
    >
      <>
        <div className="px-6">{renderHeader()}</div>
        <section
          className="ohif-scrollbar overflow-y-auto px-6"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {children}
        </section>
      </>
    </ReactModal>
  );
};

Modal.defaultProps = {
  shouldCloseOnEsc: true,
};

Modal.propTypes = {
  className: PropTypes.string,
  closeButton: PropTypes.bool,
  shouldCloseOnEsc: PropTypes.bool,
  isOpen: PropTypes.bool,
  title: PropTypes.string,
  onClose: PropTypes.func,
  /** The modal's content */
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default Modal;
