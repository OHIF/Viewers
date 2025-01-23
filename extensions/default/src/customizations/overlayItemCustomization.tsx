import React from 'react';

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
    if (!value) {
      return null;
    }

    return (
      <span
        className="overlay-item flex flex-row"
        style={{ color: this.color || undefined }}
        title={this.title || ''}
      >
        {this.label && <span className="mr-1 shrink-0">{this.label}</span>}
        <span className="font-light">{value}</span>
      </span>
    );
  },
};
