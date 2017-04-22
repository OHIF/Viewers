import { ReactiveVar } from 'meteor/reactive-var';
import { HotkeysContext } from 'meteor/ohif:hotkeys/client/classes/HotkeysContext';

export class HotkeysManager {
    constructor() {
        this.contexts = {};
        this.currentContextName = null;
        this.enabled = new ReactiveVar(true);
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

    setContext(contextName, contextDefinitions) {
        const enabled = this.enabled;
        const context = new HotkeysContext(contextName, contextDefinitions, enabled);
        const currentContext = this.getCurrentContext();
        if (currentContext && currentContext.name === contextName) {
            currentContext.destroy();
            context.initialize();
        }

        this.contexts[contextName] = context;
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
    }
}
