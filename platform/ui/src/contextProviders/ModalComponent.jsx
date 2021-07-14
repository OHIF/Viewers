import PropTypes from 'prop-types';
import React from 'react';

export const ModalComponent = ({
  content,
  contentProps,
  shouldCloseOnEsc,
  isOpen,
  closeButton,
  title,
  customClassName,
}) => {
  return <></>;
};

ModalComponent.defaultProps = {
  content: null,
  contentProps: null,
  shouldCloseOnEsc: true,
  isOpen: true,
  closeButton: true,
  title: null,
  customClassName: '',
};

ModalComponent.propTypes = {
  content: PropTypes.node,
  contentProps: PropTypes.object,
  shouldCloseOnEsc: PropTypes.bool,
  isOpen: PropTypes.bool,
  closeButton: PropTypes.bool,
  title: PropTypes.string,
  customClassName: PropTypes.string,
};

export default ModalComponent;
