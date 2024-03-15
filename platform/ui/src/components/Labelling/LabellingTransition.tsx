import React, { Component } from 'react';
import { CSSTransition } from 'react-transition-group';

const transitionDuration = 0;
const transitionClassName = 'labelling';
const transitionOnAppear = true;

interface PropType {
  children: React.ReactNode;
  displayComponent: boolean;
  onTransitionExit: any;
}

export default class LabellingTransition extends Component<PropType> {
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
