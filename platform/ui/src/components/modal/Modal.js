import React from 'react';
import Modal from 'react-bootstrap-modal';

const CustomModal = ({
  className,
  closeButton,
  backdrop,
  keyboard,
  show,
  large,
  title,
  onHide,
  footer: Footer,
  header: Header,
  children: Component,
}) => (
  <Modal
    className={`modal fade themed in ${className}`}
    backdrop={backdrop}
    keyboard={keyboard}
    show={show}
    large={large}
    title={title}
    onHide={onHide}
  >
    {(Header || title) && (
      <Modal.Header closeButton={closeButton}>
        {title && <Modal.Title>{title}</Modal.Title>}
        {Header && <Header hide={onHide} />}
      </Modal.Header>
    )}
    <Modal.Body>{Component && <Component hide={onHide} />}</Modal.Body>
    {Footer && (
      <Modal.Footer>
        {' '}
        <Footer hide={onHide} />
      </Modal.Footer>
    )}
  </Modal>
);

export default CustomModal;
