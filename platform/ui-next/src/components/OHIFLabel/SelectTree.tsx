import React, { Component } from 'react';
import cloneDeep from 'lodash.clonedeep';
import InputRadio from './InputRadio';
import SelectTreeBreadcrumb from './SelectTreeBreadcrumb';
import { Icons, Button, ButtonEnums } from '@ohif/ui-next'; // if referencing new library
import { LabelInfo } from './types';

interface SelectTreeProps {
  autoFocus?: boolean;
  searchEnabled?: boolean;
  selectTreeFirstTitle?: string;
  items: Array<LabelInfo>;
  onSelected: (event: any, item: LabelInfo) => void;
  exclusive: boolean;
  closePopup: () => void;
  label: string;
  columns: number;
}

interface SelectTreeState {
  searchTerm: string | null;
  currentNode: any;
  value: string | null;
  focusedIndex: number;
}

export default class SelectTree extends Component<SelectTreeProps, SelectTreeState> {
  static defaultProps = {
    searchEnabled: true,
    autoFocus: true,
    selectTreeFirstTitle: 'First Level items',
    items: [],
  };

  constructor(props: SelectTreeProps) {
    super(props);

    this.state = {
      searchTerm: props.items.length > 0 ? null : props.label,
      currentNode: null,
      value: null,
      focusedIndex: 0,
    };
  }

  render() {
    const treeItems = this.getTreeItems();

    return (
      <div className="max-h-80 w-80 text-base leading-7">
        <div className="bg-primary-dark relative flex max-h-80 w-full flex-col overflow-hidden rounded-lg border-0 text-white outline-none drop-shadow-lg focus:outline-none">
          {this.headerItem()}

          {this.props.items.length > 0 && (
            <div className="ohif-scrollbar h-full overflow-auto">
              {this.state.currentNode && (
                <SelectTreeBreadcrumb
                  onSelected={this.onBreadcrumbSelected}
                  label={this.state.currentNode.label}
                  value={this.state.currentNode.value}
                />
              )}
              <div>
                <div>{treeItems}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /** Builds the list of items to render in the UI, factoring in searchTerm. */
  getTreeItems() {
    let treeItems: LabelInfo[] = [];

    if (this.state.searchTerm) {
      const filtered = this.filterItems();
      if (!this.props.exclusive && !filtered.find(item => item.label === this.state.searchTerm)) {
        treeItems = [{ label: this.state.searchTerm, value: this.state.searchTerm }, ...filtered];
      } else {
        treeItems = filtered;
      }
    } else if (this.state.currentNode) {
      // If we have nested "items" from a node
      treeItems = cloneDeep(this.state.currentNode.items || []);
    } else {
      treeItems = cloneDeep(this.props.items);
    }

    return treeItems.map((item, index) => {
      return (
        <InputRadio
          key={index}
          id={`SelectTree_${item.value}`}
          itemData={item}
          value={item.value}
          label={item.label}
          onSelected={this.onSelected}
          index={index}
          selectTree={this}
        />
      );
    });
  }

  /** Simple search logic across items */
  filterItems() {
    const rawItems = cloneDeep(this.props.items);
    const lowerTerm = (this.state.searchTerm || '').toLowerCase();
    const filteredItems: LabelInfo[] = [];

    rawItems.forEach(topItem => {
      if (Array.isArray(topItem.items)) {
        topItem.items.forEach(child => {
          if (child.label.toLowerCase().includes(lowerTerm)) {
            filteredItems.push(child);
          }
        });
      } else {
        if (topItem.label.toLowerCase().includes(lowerTerm)) {
          filteredItems.push(topItem);
        }
      }
    });

    return filteredItems;
  }

  /** Called when a user selects a leaf node. */
  onSelected = (event: any, item: LabelInfo) => {
    if (!Array.isArray(item.items)) {
      // leaf
      this.setState({ searchTerm: null, currentNode: null, value: null });
    } else {
      // parent node
      this.setState({ currentNode: item });
    }
    return this.props.onSelected(event, item);
  };

  onBreadcrumbSelected = () => {
    this.setState({ currentNode: null });
  };

  headerItem = () => {
    const inputLeftPadding = this.props.items.length > 0 ? 'pl-8' : 'pl-4';
    const title = this.props.selectTreeFirstTitle || '';

    return (
      <div className="flex flex-col justify-between border-b-2 border-solid border-black p-4">
        <div className="text-primary-active m-0 mb-5 p-2 leading-tight">
          <span className="text-primary-light align-sub text-xl">{title}</span>
          <div className="float-right">
            <Icons.Close
              className="cursor-pointer"
              onClick={() => this.props.closePopup()}
              fill="#a3a3a3"
            />
          </div>
        </div>
        {this.props.searchEnabled && (
          <div className="relative flex w-full flex-col">
            {this.props.items.length > 0 && (
              <div className="absolute mt-2 ml-3">
                <Icons.Magnifier fill="#a3a3a3" />
              </div>
            )}
            <input
              data-cy="input-annotation"
              type="text"
              className={`border-primary-main border-primary-main appearance-none rounded border bg-black py-2 pr-3 text-sm leading-tight shadow transition duration-300 hover:border-gray-500 focus:border-gray-500 focus:outline-none ${inputLeftPadding}`}
              placeholder={this.props.items.length > 0 ? 'Search labels' : 'Enter label'}
              autoFocus={this.props.autoFocus}
              onChange={this.searchLocations}
              value={this.state.searchTerm || ''}
              onKeyDown={this.handleKeyDown}
            />
          </div>
        )}
        {this.props.items.length === 0 && (
          <div className="flex justify-end py-3">
            <Button
              disabled={!this.state.searchTerm}
              key="save"
              name="save"
              type={ButtonEnums.type.primary}
              onClick={this.onSubmitHandler}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    );
  };

  onSubmitHandler = (evt: any) => {
    if (this.state.searchTerm) {
      this.props.onSelected(evt, {
        label: this.state.searchTerm,
        value: this.state.searchTerm,
      });
    }
  };

  handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;
    const { focusedIndex } = this.state;
    const treeItems = this.getTreeItems();

    if (key === 'ArrowUp') {
      event.preventDefault();
      const newIndex = focusedIndex > 0 ? focusedIndex - 1 : treeItems.length - 1;
      this.setState({ focusedIndex: newIndex });
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      const newIndex = focusedIndex < treeItems.length - 1 ? focusedIndex + 1 : 0;
      this.setState({ focusedIndex: newIndex });
    } else if (key === 'Enter') {
      event.preventDefault();
      const selectedItem = treeItems[focusedIndex]?.props.itemData;

      if (selectedItem) {
        this.onSelected(event, selectedItem);
      } else if (this.state.searchTerm) {
        // If user pressed Enter while in input with an unsaved searchTerm
        this.onSubmitHandler(event);
      }
    }
  };

  searchLocations = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      currentNode: null,
      searchTerm: evt.currentTarget.value,
    });
  };
}
