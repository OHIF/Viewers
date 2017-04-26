import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
import { HotkeysContext } from 'meteor/ohif:hotkeys/client/classes/HotkeysContext';

export class HotkeysManager {
    constructor(retrieveFunction, storeFunction) {
        this.contexts = {};
        this.currentContextName = null;
        this.enabled = new ReactiveVar(true);
        this.retrieveFunction = retrieveFunction;
        this.storeFunction = storeFunction;

        Tracker.autorun(() => {
            const contextName = OHIF.context.get();
            this.switchToContext(contextName);
        });
    }

    store(contextName, definitions) {
        const storageKey = `hotkeysDefinitions.${contextName}`;
        if (this.storeFunction) {
            this.storeFunction(contextName, definitions);
        } else if (Meteor.userId()) {
            OHIF.user.setData(storageKey, definitions);
        } else {
            Session.setPersistent(storageKey, definitions);
        }
    }

    retrieve(contextName) {
        const storageKey = `hotkeysDefinitions.${contextName}`;
        if (this.retrieveFunction) {
            return this.retrieveFunction(contextName);
        } else if (Meteor.userId()) {
            return OHIF.user.getData(storageKey);
        } else {
            return Session.get(storageKey);
        }
    }

    disable() {
        this.enabled.set(false);
    }

    enable() {
        this.enabled.set(true);
    }

    getContext(contextName) {
        return this.contexts[contextName];
    }

    getCurrentContext() {
        return this.getContext(this.currentContextName);
    }

    load(contextName) {
        const context = this.getContext(contextName);
        if (!context) return;
        const definitions = this.retrieve(contextName);
        if (!definitions) return;
        context.extend(definitions);
    }

    set(contextName, contextDefinitions) {
        const enabled = this.enabled;
        const context = new HotkeysContext(contextName, contextDefinitions, enabled);
        const currentContext = this.getCurrentContext();
        if (currentContext && currentContext.name === contextName) {
            currentContext.destroy();
            context.initialize();
        }

        this.contexts[contextName] = context;
    }

    register(contextName, command, hotkey) {
        if (!command || !hotkey) return;
        const context = this.getContext(contextName);
        if (!context) {
            this.set(contextName, {});
        }

        context.register(command, hotkey);
    }

    unsetContext(contextName) {
        if (contextName === this.currentContextName) {
            this.getCurrentContext().destroy();
        }

        delete this.contexts[contextName];
    }

    switchToContext(contextName) {
        const currentContext = this.getCurrentContext();
        if (currentContext) {
            currentContext.destroy();
        }

        const newContext = this.contexts[contextName];
        if (!newContext) return;

        this.currentContextName = contextName;
        newContext.initialize();
        this.load(contextName);
    }
}
