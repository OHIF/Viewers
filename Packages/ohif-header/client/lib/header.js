import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';

export class Header {
    constructor() {
        this.dropdownObserver = new Tracker.Dependency();
        this._dropdownItems = [];
        this.dropdownObserver.changed();
    }

    clearDropDownItems() {
        this._dropdownItems = [];
        this.dropdownObserver.changed();
    }

    setDropdownItems(items) {
        this._dropdownItems = items;
        this.dropdownObserver.changed();
    }

    addDropdownItem(item) {
        this._dropdownItems.push(item);
        this.dropdownObserver.changed();
    }

    removeDropdownItem(item) {
        this._dropdownItems = _.without(this._dropdownItems, item);
        this.dropdownObserver.changed();
    }

    getDropdownItems() {
        this.dropdownObserver.depend();
        return this._dropdownItems;
    }
}
