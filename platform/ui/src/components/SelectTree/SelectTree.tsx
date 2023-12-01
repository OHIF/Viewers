import React, { Component } from 'react';
import InputRadio from './InputRadio';
import PropTypes from 'prop-types';
import SelectTreeBreadcrumb from './SelectTreeBreadcrumb';
import cloneDeep from 'lodash.clonedeep';
import Icon from '../Icon';

export class SelectTree extends Component {
  static propTypes = {
    autoFocus: PropTypes.bool,
    searchEnabled: PropTypes.bool,
    selectTreeFirstTitle: PropTypes.string,
    selectTreeSecondTitle: PropTypes.string,
    /** Called when 'componentDidUpdate' is triggered */
    onComponentChange: PropTypes.func,
    /** [{ label, value, items[]}] - An array of items than can be expanded to show child items */
    items: PropTypes.array.isRequired,
    /** fn(evt, item) - Called when a child item is selected; receives event and selected item */
    onSelected: PropTypes.func.isRequired,
  };

  static defaultProps = {
    searchEnabled: true,
    autoFocus: true,
    selectTreeFirstTitle: 'First Level itens',
    items: [],
  };

  constructor(props) {
    super(props);

    this.state = {
      searchTerm: null,
      currentNode: null,
      value: null,
    };
  }

  render() {
    const treeItems = this.getTreeItems();

    return (
      <div className="w-80 max-h-80 leading-7 text-base">
        <div className="treeContent bg-primary-dark text-white max-h-80 overflow-hidden flex flex-col border-0 rounded-lg drop-shadow-lg outline-none focus:outline-none relative w-full">
          {this.headerItem()}
          <div className="overflow-auto h-full ohif-scrollbar">
            {this.state.currentNode && (
              <SelectTreeBreadcrumb
                onSelected={this.onBreadcrumbSelected}
                label={this.state.currentNode.label}
                value={this.state.currentNode.value}
              />
            )}
            <div className="treeInputsWrapper">
              <div className="treeInputs">{treeItems}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  componentDidUpdate = () => {
    if (this.props.onComponentChange) {
      this.props.onComponentChange();
    }
  };

  isLeafSelected = item => item && !Array.isArray(item.items);

  getLabelClass = item => {
    let labelClass = 'treeLeaf';
    if (this.state.searchTerm || Array.isArray(item.items)) {
      labelClass = 'treeNode';
    }
    return labelClass;
  };

  filterItems() {
    const filteredItems = [];
    const rawItems = cloneDeep(this.props.items);
    rawItems.forEach(item => {
      if (Array.isArray(item.items)) {
        item.items.forEach(item => {
          const label = item.label.toLowerCase();
          const searchTerm = this.state.searchTerm.toLowerCase();
          if (label.indexOf(searchTerm) !== -1) {
            filteredItems.push(item);
          }
        });
      } else {
        const label = item.label.toLowerCase();
        const searchTerm = this.state.searchTerm.toLowerCase();
        if (label.indexOf(searchTerm) !== -1) {
          filteredItems.push(item);
        }
      }
    });
    return filteredItems;
  }

  getTreeItems() {
    const storageKey = 'SelectTree';
    let treeItems;

    if (this.state.searchTerm) {
      treeItems = this.filterItems();
    } else if (this.state.currentNode) {
      treeItems = cloneDeep(this.state.currentNode.items);
    } else {
      treeItems = cloneDeep(this.props.items);
    }

    return treeItems.map((item, index) => {
      let itemKey = index;
      if (this.state.currentNode) {
        itemKey += `_${this.state.currentNode.value}`;
      }
      return (
        <InputRadio
          key={itemKey}
          id={`${storageKey}_${item.value}`}
          name={index}
          itemData={item}
          value={item.value}
          label={item.label}
          labelClass={this.getLabelClass(item)}
          onSelected={this.onSelected}
        />
      );
    });
  }

  headerItem = () => {
    let title = this.props.selectTreeFirstTitle;
    if (this.state.currentNode && this.props.selectTreeSecondTitle) {
      title = this.props.selectTreeSecondTitle;
    }

    return (
      <div className="bg-secondary-main flex flex-col items-center justify-between border-b-2 border-solid border-black p-2 ">
        <div className="font-bold m-0 leading-tight text-primary-active p-2">
          {title}
        </div>
        {this.props.searchEnabled && (
          <div className="w-full flex flex-col">
            <div className="absolute w-4 h-4 mt-2 mr-2.5 mb-3 ml-3">
              <Icon name="icon-search" fill="#a3a3a3" />
            </div>
            <input
              type="text"
              className="bg-black border-primary-main shadow transition duration-300 appearance-none border border-primary-main hover:border-gray-500 focus:border-gray-500 focus:outline-none rounded py-2 pl-8 pr-3 text-sm leading-tight focus:outline-none bg-black"
              placeholder="Search labels"
              autoFocus={this.props.autoFocus}
              onChange={this.searchLocations}
              value={this.state.searchTerm ? this.state.searchTerm : ''}
            />
          </div>
        )}
      </div>
    );
  };

  searchLocations = evt => {
    this.setState({
      currentNode: null,
      searchTerm: evt.currentTarget.value,
    });
  };

  onSelected = (event, item) => {
    if (this.isLeafSelected(item)) {
      this.setState({
        searchTerm: null,
        currentNode: null,
        value: null,
      });
    } else {
      this.setState({
        currentNode: item,
      });
    }
    return this.props.onSelected(event, item);
  };

  onBreadcrumbSelected = () => {
    this.setState({
      currentNode: null,
    });
  };
}
