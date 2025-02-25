import React from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import Draggable from 'react-draggable';
import { useModal } from '../../contextProviders';

import Icon from '../Icon';
import Typography from '../Typography';

import './Modal.css';

if (typeof document !== 'undefined') {
  ReactModal.setAppElement(document.getElementById('root'));
}

const Modal = ({
  closeButton,
  shouldCloseOnEsc = true,
  isOpen,
  title,
  onClose,
  children,
  shouldCloseOnOverlayClick = true,
  movable = false,
  containerDimensions = null,
  contentDimensions = null,
}) => {
  const { hide } = useModal();

  const handleClose = () => {
    hide();
  };

  const renderHeader = () =>
    title && (
      <header className="bg-primary-dark drag-handle flex items-center rounded-tl rounded-tr px-[20px] py-[13px]">
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
    );

  const modalContent = (
    <>
      {renderHeader()}
      <section
        className={
          contentDimensions
            ? `ohif-scrollbar bg-primary-dark overflow-y-auto ${contentDimensions}`
            : 'ohif-scrollbar modal-content bg-primary-dark overflow-y-auto rounded-bl rounded-br px-[20px] pt-2 pb-[20px]'
        }
      >
        {children}
      </section>
    </>
  );

  return (
    <ReactModal
      className={
        containerDimensions
          ? `relative text-white outline-none ${containerDimensions}`
          : 'relative max-h-full w-11/12 text-white outline-none lg:w-10/12 xl:w-9/12'
      }
      overlayClassName={
        movable
          ? 'fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center py-16 pointer-events-none'
          : 'fixed top-0 left-0 right-0 bottom-0 z-50 bg-overlay flex items-center justify-center py-16'
      }
      shouldCloseOnEsc={shouldCloseOnEsc}
      onRequestClose={handleClose}
      isOpen={isOpen}
      title={title}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
    >
      {movable ? (
        <Draggable
          handle=".drag-handle"
          defaultClassName="bg-primary-dark pointer-events-auto"
        >
          <div>{modalContent}</div>
        </Draggable>
      ) : (
        modalContent
      )}
    </ReactModal>
  );
};

Modal.propTypes = {
  closeButton: PropTypes.bool,
  shouldCloseOnEsc: PropTypes.bool,
  isOpen: PropTypes.bool,
  title: PropTypes.string,
  onClose: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  shouldCloseOnOverlayClick: PropTypes.bool,
  movable: PropTypes.bool,
  containerDimensions: PropTypes.string,
  contentDimensions: PropTypes.string,
};

export default Modal;
