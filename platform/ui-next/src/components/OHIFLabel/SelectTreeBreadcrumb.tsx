import React, { Component } from 'react';
import { Icons } from '@ohif/ui-next';

interface SelectTreeBreadcrumbProps {
  value: string;
  label: string;
  onSelected: (event: any) => void;
}

/**
 * A simple breadcrumb to jump back “up” the tree
 */
export default class SelectTreeBreadcrumb extends Component<SelectTreeBreadcrumbProps> {
  render() {
    const { value, label, onSelected } = this.props;

    return (
      <div>
        <label
          className="block h-10 w-full cursor-pointer pr-3 leading-10"
          htmlFor="selectTreeBreadcrumb"
        >
          <input
            type="radio"
            id="selectTreeBreadcrumb"
            className="bt block h-10 overflow-hidden p-3 leading-10 shadow-[0_0_0_200px_transparent]"
            value={value}
            onChange={onSelected}
          />
          <span className="cursor-pointer whitespace-nowrap">
            <span className="pr-2.5">
              <Icons.ByName name="fast-backward" />
            </span>
            {label}
          </span>
        </label>
      </div>
    );
  }
}
