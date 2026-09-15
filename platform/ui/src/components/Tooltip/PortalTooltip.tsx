import React from 'react';
import { createRoot } from 'react-dom/client';
import PropTypes from 'prop-types';

import Card from './PortalTooltipCard';

const portalNodes = {};

/**
 * A portal based tooltip component.
 *
 * This component has been repurposed and modified
 * for OHIF usage: https://github.com/romainberger/react-portal-tooltip
 */
export default class PortalTooltip extends React.Component {
  static propTypes = {
    parent: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    active: PropTypes.bool,
    group: PropTypes.string,
    tooltipTimeout: PropTypes.number,
  };

  static defaultProps = {
    active: false,
    group: 'main',
    tooltipTimeout: 0,
  };

  createPortal() {
    const node = document.createElement('div');
    portalNodes[this.props.group] = {
      node,
      root: createRoot(node),
      timeout: false,
    };
    node.className = 'ToolTipPortal';
    document.body.appendChild(node);
  }

  renderPortal(props) {
    if (!portalNodes[this.props.group]) {
      this.createPortal();
    }
    const { parent, ...other } = props;
    const parentEl = typeof parent === 'string' ? document.querySelector(parent) : parent;
    portalNodes[this.props.group].root.render(
      <Card
        parentEl={parentEl}
        {...other}
      />
    );
  }

  componentDidMount() {
    if (!this.props.active) {
      return;
    }

    this.renderPortal(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      (!portalNodes[this.props.group] && !nextProps.active) ||
      (!this.props.active && !nextProps.active)
    ) {
      return;
    }

    const props = { ...nextProps };
    const newProps = { ...nextProps };

    if (portalNodes[this.props.group] && portalNodes[this.props.group].timeout) {
      clearTimeout(portalNodes[this.props.group].timeout);
    }

    if (this.props.active && !props.active) {
      newProps.active = true;
      portalNodes[this.props.group].timeout = setTimeout(() => {
        props.active = false;
        this.renderPortal(props);
      }, this.props.tooltipTimeout);
    }

    this.renderPortal(newProps);
  }

  componentWillUnmount() {
    if (portalNodes[this.props.group]) {
      portalNodes[this.props.group].root.unmount();
      clearTimeout(portalNodes[this.props.group].timeout);

      try {
        document.body.removeChild(portalNodes[this.props.group].node);
      } catch (e) {}

      portalNodes[this.props.group] = null;
    }
  }

  render() {
    return null;
  }
}
