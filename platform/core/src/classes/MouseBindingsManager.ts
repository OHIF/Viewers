import {
  applyMouseModifierActions,
  getDefaultMouseModifierAssignments,
  getStoredMouseModifierAssignments,
  setStoredMouseModifierAssignments,
} from '../utils/mouseModifierPreferences';
import type {
  MouseModifierAction,
  MouseModifierAssignments,
} from '../utils/mouseModifierPreferences';

// Current storage and application are modifier-based, but the manager API is binding-oriented so it
// can grow to broader mouse gesture bindings later without another rename.
export class MouseBindingsManager {
  private actionDefinitions: MouseModifierAction[] = [];

  setActionDefinitions(actionDefinitions: MouseModifierAction[] = []) {
    this.actionDefinitions = Array.isArray(actionDefinitions) ? [...actionDefinitions] : [];
  }

  getActionDefinitions() {
    return [...this.actionDefinitions];
  }

  getDefaultBindings(): MouseModifierAssignments {
    return getDefaultMouseModifierAssignments(this.actionDefinitions);
  }

  getBindings(): MouseModifierAssignments {
    return getStoredMouseModifierAssignments(this.actionDefinitions);
  }

  setBindings(bindings: Record<string, unknown> = {}): MouseModifierAssignments {
    return setStoredMouseModifierAssignments(this.actionDefinitions, bindings);
  }

  applyBindings(bindings?: Record<string, unknown>): MouseModifierAssignments {
    return applyMouseModifierActions(this.actionDefinitions, bindings);
  }

  destroy() {
    this.actionDefinitions = [];
  }
}

export default MouseBindingsManager;
