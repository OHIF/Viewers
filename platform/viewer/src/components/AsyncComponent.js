/**
 * We use this component to leverage "Code Splitting"
 *
 * Link: https://serverless-stack.com/chapters/code-splitting-in-create-react-app.html
 */

import React, { Component } from 'react';

export default function asyncComponent(importComponent) {
  class AsyncComponent extends Component {
    constructor(props) {
      super(props);

      this.state = {
        component: null,
      };
    }

    async componentDidMount() {
      // Add dynamically loaded component to state
      const { default: component } = await importComponent();

      this.setState({
        component: component,
      });
    }

    render() {
      const C = this.state.component;

      // Render the loaded component, or null
      return C ? <C {...this.props} /> : null;
    }
  }

  return AsyncComponent;
}
