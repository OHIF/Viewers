import React from 'react';
import { utils } from '@ohif/core';

export default {
  'ohif.overlayItem': function (props) {
    if (this.condition && !this.condition(props)) {
      return null;
    }

    const { instance } = props;
    const value =
      instance && this.attribute
        ? instance[this.attribute]
        : this.contentF && typeof this.contentF === 'function'
          ? this.contentF(props)
          : null;
    const displayValue = utils.formatValue(value);
    if (!displayValue) {
      return null;
    }

    return (
      <span
        className="overlay-item flex flex-row"
        style={{ color: this.color || undefined }}
        title={this.title || ''}
      >
        {this.label && <span className="mr-1 shrink-0">{this.label}</span>}
        <span className="font-light">{displayValue}</span>
      </span>
    );
  },
};
