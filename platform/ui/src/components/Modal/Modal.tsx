import React from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import { useModal } from '../../contextProviders';

import Icon from '../Icon';
import Typography from '../Typography';

import './Modal.css';

if (typeof document !== 'undefined') {
  ReactModal.setAppElement(document.getElementById('root'));
}

const Modal = ({
  closeButton,
  shouldCloseOnEsc,
  isOpen,
  title,
  onClose,
  children,
  shouldCloseOnOverlayClick,
}) => {
  const { hide } = useModal();

  const handleClose = () => {
    hide();
  };

  const renderHeader = () => {
    return (
      title && (
        <header className="bg-primary-dark flex items-center rounded-tl rounded-tr px-[20px] py-[13px]">
          <Typography
            variant="h6"
            color="primaryLight"
            className="flex grow !leading-[1.2]"
            data-cy="modal-header"
          >
            {title}
          </Typography>
          {closeButton && (
            <Icon
              onClick={onClose}
              name="close"
              className="text-primary-active cursor-pointer"
            />
          )}
        </header>
      )
    );
  };

  return (
    <ReactModal
      className="relative max-h-full w-11/12 text-white outline-none lg:w-10/12  xl:w-9/12"
      overlayClassName="fixed top-0 left-0 right-0 bottom-0 z-50 bg-overlay flex items-start justify-center py-16"
      shouldCloseOnEsc={shouldCloseOnEsc}
      onRequestClose={handleClose}
      isOpen={isOpen}
      title={title}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
    >
      {renderHeader()}
      <section className="ohif-scrollbar modal-content bg-primary-dark overflow-y-auto rounded-bl rounded-br px-[20px] pt-2 pb-[20px]">
        {children}
      </section>
    </ReactModal>
  );
};

Modal.defaultProps = {
  shouldCloseOnEsc: true,
  shouldCloseOnOverlayClick: true,
};

Modal.propTypes = {
  closeButton: PropTypes.bool,
  shouldCloseOnEsc: PropTypes.bool,
  isOpen: PropTypes.bool,
  title: PropTypes.string,
  onClose: PropTypes.func,
  /** The modal's content */
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  shouldCloseOnOverlayClick: PropTypes.bool,
};

export default Modal;
