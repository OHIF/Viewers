import React, { Component } from 'react';
import { CSSTransition } from 'react-transition-group';

const transitionDuration = 0;
const transitionClassName = 'labelling';
const transitionOnAppear = true;

interface LabellingTransitionProps {
  children: React.ReactNode;
  displayComponent: boolean;
  onTransitionExit: () => void;
}

/**
 * A simple transition wrapper used to animate/hide the labelling flow
 */
export default class LabellingTransition extends Component<LabellingTransitionProps> {
  render() {
    const { displayComponent, onTransitionExit, children } = this.props;

    return (
      <CSSTransition
        in={displayComponent}
        appear={transitionOnAppear}
        timeout={transitionDuration}
        classNames={transitionClassName}
        onExited={onTransitionExit}
      >
        {children}
      </CSSTransition>
    );
  }
}
