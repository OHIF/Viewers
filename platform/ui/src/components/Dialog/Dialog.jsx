import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Footer from './Footer';
import Body from './Body';
import Header from './Header';

const Dialog = ({
  title,
  text,
  onClose,
  noCloseButton,
  actions,
  onSubmit,
  header: HeaderComponent,
  body: BodyComponent,
  footer: FooterComponent,
  withHeaderDivisor,
  withFooterDivisor,
  state: defaultState
}) => {
  const [state, setState] = useState(defaultState);

  const theme = 'bg-secondary-light';
  const flex = 'flex flex-col';
  const border = 'border-0 rounded-lg shadow-lg';
  const outline = 'outline-none focus:outline-none';
  const position = 'relative';
  const width = 'w-full';

  return (
    <div
      className={classNames(theme, flex, border, outline, position, width)}
    >
      <HeaderComponent
        title={title}
        noCloseButton={noCloseButton}
        onClose={onClose}
        withDivisor={withHeaderDivisor}
        state={state}
        setState={setState}
      />
      <BodyComponent
        text={text}
        state={state}
        setState={setState}
      />
      <FooterComponent
        actions={actions}
        onSubmit={onSubmit}
        withDivisor={withFooterDivisor}
        state={state}
        setState={setState}
      />
    </div>
  );
};

Dialog.propTypes = {
  title: PropTypes.string,
  text: PropTypes.string,
  onClose: PropTypes.func,
  noCloseButton: PropTypes.bool,
  header: PropTypes.node,
  body: PropTypes.node,
  footer: PropTypes.node,
  withHeaderDivisor: PropTypes.bool,
  withFooterDivisor: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  state: PropTypes.object,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
      type: PropTypes.oneOf(['primary', 'secondary', 'cancel']).isRequired,
    })
  ).isRequired,
};

Dialog.defaultProps = {
  header: Header,
  footer: Footer,
  body: Body,
  state: {}
};

export default Dialog;
