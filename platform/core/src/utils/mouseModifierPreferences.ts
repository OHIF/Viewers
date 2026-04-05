const USER_PREFERRED_MOUSE_MODIFIER_ACTIONS_STORAGE_KEY = 'user-preferred-mouse-modifier-actions';
const MOUSE_MODIFIER_KEYS = ['ctrl', 'shift', 'alt', 'meta'] as const;

type MouseModifierKey = (typeof MOUSE_MODIFIER_KEYS)[number];
type MouseModifierAssignments = Partial<Record<MouseModifierKey, string>>;
type MouseModifierStoredAssignments = Partial<Record<MouseModifierKey, string | null>>;

interface MouseModifierAction {
  id: string;
  label: string;
  defaultModifier?: MouseModifierKey;
  onChange?: (modifier?: MouseModifierKey) => void;
}

function isMouseModifierKey(value: unknown): value is MouseModifierKey {
  return typeof value === 'string' && MOUSE_MODIFIER_KEYS.includes(value as MouseModifierKey);
}

function getDefaultMouseModifierAssignments(
  actions: MouseModifierAction[] = []
): MouseModifierAssignments {
  return actions.reduce<MouseModifierAssignments>((assignments, action) => {
    if (!isMouseModifierKey(action.defaultModifier)) {
      return assignments;
    }

    Object.keys(assignments).forEach(existingModifier => {
      const modifierKey = existingModifier as MouseModifierKey;
      if (assignments[modifierKey] === action.id) {
        delete assignments[modifierKey];
      }
    });

    assignments[action.defaultModifier] = action.id;
    return assignments;
  }, {});
}

function normalizeMouseModifierAssignments(
  actions: MouseModifierAction[] = [],
  assignments: Record<string, unknown> = {}
): MouseModifierAssignments {
  const normalized = getDefaultMouseModifierAssignments(actions);
  const validActionIds = new Set(actions.map(action => action.id));

  MOUSE_MODIFIER_KEYS.forEach(modifierKey => {
    const actionId = assignments[modifierKey];

    if (actionId === null) {
      delete normalized[modifierKey];
      return;
    }

    if (typeof actionId !== 'string' || !validActionIds.has(actionId)) {
      return;
    }

    MOUSE_MODIFIER_KEYS.forEach(existingModifier => {
      if (normalized[existingModifier] === actionId) {
        delete normalized[existingModifier];
      }
    });

    normalized[modifierKey] = actionId;
  });

  return normalized;
}

function _buildStoredAssignments(
  actions: MouseModifierAction[] = [],
  assignments: MouseModifierAssignments = {}
): MouseModifierStoredAssignments {
  const defaultAssignments = getDefaultMouseModifierAssignments(actions);

  return MOUSE_MODIFIER_KEYS.reduce<MouseModifierStoredAssignments>((storedAssignments, modifierKey) => {
    const defaultActionId = defaultAssignments[modifierKey];
    const actionId = assignments[modifierKey];

    if (actionId === defaultActionId) {
      return storedAssignments;
    }

    if (actionId == null) {
      if (defaultActionId != null) {
        storedAssignments[modifierKey] = null;
      }

      return storedAssignments;
    }

    storedAssignments[modifierKey] = actionId;
    return storedAssignments;
  }, {});
}

function _parseStoredAssignments(storageKey: string): Record<string, unknown> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch (error) {
    console.warn(`Failed to parse stored mouse modifier assignments from ${storageKey}`, error);
    return {};
  }
}

function getStoredMouseModifierAssignments(
  actions: MouseModifierAction[] = []
): MouseModifierAssignments {
  const storedAssignments = _parseStoredAssignments(USER_PREFERRED_MOUSE_MODIFIER_ACTIONS_STORAGE_KEY);
  return normalizeMouseModifierAssignments(actions, storedAssignments);
}

function setStoredMouseModifierAssignments(
  actions: MouseModifierAction[] = [],
  assignments: Record<string, unknown> = {}
): MouseModifierAssignments {
  const normalizedAssignments = normalizeMouseModifierAssignments(actions, assignments);
  const storedAssignments = _buildStoredAssignments(actions, normalizedAssignments);

  if (typeof window === 'undefined') {
    return normalizedAssignments;
  }

  try {
    if (Object.keys(storedAssignments).length === 0) {
      localStorage.removeItem(USER_PREFERRED_MOUSE_MODIFIER_ACTIONS_STORAGE_KEY);
    } else {
      localStorage.setItem(
        USER_PREFERRED_MOUSE_MODIFIER_ACTIONS_STORAGE_KEY,
        JSON.stringify(storedAssignments)
      );
    }
  } catch (error) {
    console.warn('Failed to persist mouse modifier assignments', error);
  }

  return normalizedAssignments;
}

function getMouseModifierForAction(
  actions: MouseModifierAction[] = [],
  actionId: string,
  assignments?: Record<string, unknown>
): MouseModifierKey | undefined {
  const resolvedAssignments = assignments
    ? normalizeMouseModifierAssignments(actions, assignments)
    : getStoredMouseModifierAssignments(actions);

  return MOUSE_MODIFIER_KEYS.find(modifierKey => resolvedAssignments[modifierKey] === actionId);
}

function applyMouseModifierActions(
  actions: MouseModifierAction[] = [],
  assignments?: Record<string, unknown>
): MouseModifierAssignments {
  const resolvedAssignments = assignments
    ? normalizeMouseModifierAssignments(actions, assignments)
    : getStoredMouseModifierAssignments(actions);

  actions.forEach(action => {
    action.onChange?.(getMouseModifierForAction(actions, action.id, resolvedAssignments));
  });

  return resolvedAssignments;
}

export type {
  MouseModifierAction,
  MouseModifierAssignments,
  MouseModifierKey,
  MouseModifierStoredAssignments,
};
export {
  MOUSE_MODIFIER_KEYS,
  USER_PREFERRED_MOUSE_MODIFIER_ACTIONS_STORAGE_KEY,
  getDefaultMouseModifierAssignments,
  normalizeMouseModifierAssignments,
  getStoredMouseModifierAssignments,
  setStoredMouseModifierAssignments,
  getMouseModifierForAction,
  applyMouseModifierActions,
};
