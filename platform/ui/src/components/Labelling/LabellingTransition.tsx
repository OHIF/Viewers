import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';


// If these variables changes, CSS must be updated
const transitionDuration = 0;
const transitionClassName = 'labelling';
const transitionOnAppear = true;

export default class LabellingTransition extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    displayComponent: PropTypes.bool.isRequired,
    onTransitionExit: PropTypes.func.isRequired,
  };
  render() {
    return (
      <CSSTransition
        in={this.props.displayComponent}
        appear={transitionOnAppear}
        timeout={transitionDuration}
        classNames={transitionClassName}
        onExited={this.props.onTransitionExit}
      >
        {this.props.children}
      </CSSTransition>
    );
  }
}
