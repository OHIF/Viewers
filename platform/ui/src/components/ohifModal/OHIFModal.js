import React from 'react';
import PropTypes from 'prop-types';
import ReactBootstrapModal from 'react-bootstrap-modal';
import classNames from 'classnames';

const OHIFModal = ({
  className,
  closeButton,
  backdrop,
  keyboard,
  show,
  title,
  onHide,
  footer: Footer,
  header: Header,
  children,
}) => (
  <ReactBootstrapModal
    className={classNames('modal fade themed in', className)}
    backdrop={backdrop}
    keyboard={keyboard}
    show={show}
    large={true}
    title={title}
    onHide={onHide}
  >
    {(Header || title) && (
      <ReactBootstrapModal.Header closeButton={closeButton}>
        {title && (
          <ReactBootstrapModal.Title>{title}</ReactBootstrapModal.Title>
        )}
        {Header && <Header hide={onHide} />}
      </ReactBootstrapModal.Header>
    )}
    <ReactBootstrapModal.Body>{children}</ReactBootstrapModal.Body>
    {Footer && (
      <ReactBootstrapModal.Footer>
        <Footer hide={onHide} />
      </ReactBootstrapModal.Footer>
    )}
  </ReactBootstrapModal>
);

OHIFModal.propTypes = {
  className: PropTypes.string,
  closeButton: PropTypes.bool,
  backdrop: PropTypes.bool,
  keyboard: PropTypes.bool,
  show: PropTypes.bool,
  title: PropTypes.string,
  onHide: PropTypes.func,
  footer: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]),
  header: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default OHIFModal;
