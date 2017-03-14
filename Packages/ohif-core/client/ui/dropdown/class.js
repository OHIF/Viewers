import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

class Dropdown {
    constructor() {
        this.observer = new Tracker.Dependency();
        this._items = [];
        this.observer.changed();
    }

    clearItems() {
        this._items = [];
        this.observer.changed();
    }

    setItems(items) {
        this._items = items;
        this.observer.changed();
    }

    addItem(item) {
        this._items.push(item);
        this.observer.changed();
    }

    removeItem(item) {
        this._items = _.without(this._items, item);
        this.observer.changed();
    }

    getItems() {
        this.observer.depend();
        return this._items;
    }
}

OHIF.ui.Dropdown = Dropdown;
