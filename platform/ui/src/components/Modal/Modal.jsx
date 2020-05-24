import React from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import classNames from 'classnames';

const customStyle = {
  overlay: {
    zIndex: 1071,
    backgroundColor: 'rgb(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  const renderHeader = () => {
    return (
      title && (
        <header>
          <h4>{title}</h4>
          {closeButton && (
            <button data-cy="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </header>
      )
    );
  };

  return (
    <ReactModal
      className={classNames(className)}
      shouldCloseOnEsc={shouldCloseOnEsc}
      isOpen={isOpen}
      title={title}
      style={customStyle}
    >
      <>
        {renderHeader()}
        <section>{children}</section>
      </>
    </ReactModal>
  );
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
