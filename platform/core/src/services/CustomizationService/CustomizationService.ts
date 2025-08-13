import update, { extend } from 'immutability-helper';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import type { Customization } from './types';
import type { CommandsManager } from '../../classes';
import type { ExtensionManager } from '../../extensions';

const EVENTS = {
  MODE_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:modeModified',
  GLOBAL_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:globalModified',
  DEFAULT_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:defaultModified',
};

/**
 * Enum representing the different scopes of customizations available in the system.
 */
export enum CustomizationScope {
  /**
   * Global customizations that override both mode and default customizations.
   * These are applied universally across the application.
   */
  Global = 'global',

  /**
   * Mode-specific customizations that are only active during a particular mode.
   * These are cleared and reset when switching between modes.
   */
  Mode = 'mode',

  /**
   * Default customizations that serve as fallbacks when no global or mode-specific
   * customizations are defined. These can only be defined once.
   */
  Default = 'default',
}

/**
 * The CustomizationService allows for retrieving of custom components
 * and configuration for mode and global values.
 * The intent of the items is to provide a react component.  This can be
 * done by straight out providing an entire react component or else can be
 * done by configuring a react component, or configuring a part of a react
 * component.  These are intended to be fairly indistinguishable in use of
 * it, although the internals of how that is implemented may need to know
 * about the customization service.
 *
 * A customization value can be:
 *   1. React function, taking (React, props) and returning a rendered component
 *      For example, createLogoComponentFn renders a component logo for display
 *   2. Custom UI component configuration, as defined by the component which uses it.
 *      For example, context menus define a complex structure allowing site-determined
 *      context menus to be set.
 *   3. A string name, being the extension id for retrieving one of the above.
 *
 * The default values for the extension come from the app_config value 'whiteLabeling',
 * The whiteLabelling can have lists of extensions to load for the default global and
 * mode extensions.  These are:
 *    'globalExtensions' which is a list of extension id's to load for global values
 *    'modeExtensions'   which is a list of extension id's to load for mode values
 * They default to the list ['*'] if not otherwise provided, which means to check
 * every module for the given id and to load it/add it to the extensions.
 */
export default class CustomizationService extends PubSubService {
  public static EVENTS = EVENTS;
  public Scope = CustomizationScope;

  public static REGISTRATION = {
    name: 'customizationService',
    create: ({ configuration, commandsManager }) => {
      return new CustomizationService({ configuration, commandsManager });
    },
  };

  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;

  /**
   * A collection of global customizations that act as a priority layer.
   * These customizations are applied universally, overriding both mode-specific
   * and default customizations. Ideal for system-wide changes.
   */
  private globalCustomizations = new Map<string, Customization>();

  /**
   * A collection of mode-specific customizations. These allow modes to define
   * their own behavior without impacting other modes. These customizations
   * are cleared and redefined whenever a mode changes, ensuring isolation
   * between modes. Read more about modes in the modes documentation.
   */
  private modeCustomizations = new Map<string, Customization>();

  /**
   * A collection of default customizations used as fallbacks. These serve as
   * the base configuration and are registered at setup. Default customizations
   * provide baseline values that can be overridden by mode or global customizations.
   * Use these for cases where default values are necessary for predictable behavior.
   */
  private defaultCustomizations = new Map<string, Customization>();

  /**
   * Has the transformed/final customization value.  This avoids needing to
   * transform every time a customization is requested.
   */
  private transformedCustomizations = new Map<string, Customization>();
  private configuration: AppTypes.Config;

  constructor({ configuration, commandsManager }) {
    super(EVENTS);
    this.configuration = configuration;
    this.commandsManager = commandsManager;
  }

  public init(extensionManager: ExtensionManager): void {
    this.extensionManager = extensionManager;
    // Clear defaults as those are defined by the customization modules
    this.defaultCustomizations.clear();
    // Clear modes because those are defined in onModeEnter functions.
    this.modeCustomizations.clear();

    this.extensionManager.getRegisteredExtensionIds().forEach(extensionId => {
      const keyDefault = `${extensionId}.customizationModule.default`;
      const defaultCustomizations = this._findExtensionValue(keyDefault);
      if (defaultCustomizations) {
        const { value } = defaultCustomizations;
        this._addReference(value, CustomizationScope.Default);
      }
      const keyGlobal = `${extensionId}.customizationModule.global`;
      const globalCustomizations = this._findExtensionValue(keyGlobal);
      if (globalCustomizations) {
        const { value } = globalCustomizations;
        this._addReference(value, CustomizationScope.Global);
      }
    });

    // Only add references for the configuration once.
    if (!this.configuration?._hasBeenAdded) {
      this.addReferences(this.configuration);
      Object.defineProperty(this.configuration, '_hasBeenAdded', { value: true, writable: false });
    }
  }

  public onModeEnter(): void {
    this.clearTransformedCustomizations();

    this.init(this.extensionManager);
  }

  public onModeExit(): void {
    this.clearTransformedCustomizations();
  }

  private clearTransformedCustomizations(): void {
    super.reset();

    const modeCustomizationKeys = Array.from(this.modeCustomizations.keys());
    for (const key of modeCustomizationKeys) {
      this.transformedCustomizations.delete(key);
    }

    this.modeCustomizations.clear();
  }

  /**
   * Unified getter for customizations.
   *
   * @param customizationId - The ID of the customization to retrieve.
   * @param scope - (Optional) The scope to retrieve from: 'global', 'mode', or 'default'.
   *                 If not specified, it retrieves based on priority: global > mode > default.
   * @returns The requested customization, or undefined if not found
   */
  public getCustomization(customizationId: string): Customization | undefined {
    const transformed = this.transformedCustomizations.get(customizationId);

    if (transformed) {
      return transformed;
    }
    const customization =
      this.globalCustomizations.get(customizationId) ??
      this.modeCustomizations.get(customizationId) ??
      this.defaultCustomizations.get(customizationId);
    const newTransformed = this.transform(customization);
    if (newTransformed !== undefined) {
      this.transformedCustomizations.set(customizationId, newTransformed);
    }
    return newTransformed;
  }

  /**
   * Takes an object with multiple properties, each property containing
   * immutability-helper commands, and applies them one by one.
   *
   * Example:
   *   customizationService.setCustomizations({
   *     showAddSegment: { $set: false },
   *     NumbersList: { $push: [99] },
   *   }, CustomizationScope.Mode)
   *
   * Or you can simply apply a list of strings that are customization module items in the
   * extension.
   *
   * Example:
   *   customizationService.setCustomizations(['@ohif/extension-cornerstone-dicom-seg.customizationModule.dicom-seg-sorts'], CustomizationScope.Mode)
   */
  public setCustomizations(
    customizations: string[] | Record<string, Customization>,
    scope: CustomizationScope = CustomizationScope.Mode
  ): void {
    if (Array.isArray(customizations)) {
      customizations.forEach(customization => {
        this._addReference(customization, scope);
      });
    } else {
      Object.entries(customizations).forEach(([key, value]) => {
        this._setCustomization(key, value, scope);
      });
    }
  }

  /**
   * @deprecated Use setCustomizations instead
   */
  public setCustomization(
    customizationId: string,
    customization: Customization | string,
    scope: CustomizationScope = CustomizationScope.Mode
  ): void {
    console.warn(
      'setCustomization is deprecated. Please use setCustomizations with an object instead.'
    );
    this._setCustomization(customizationId, customization, scope);
  }

  /**
   * Internal method to set a single customization
   */
  private _setCustomization(
    customizationId: string,
    customization: Customization,
    scope: CustomizationScope = CustomizationScope.Mode
  ): void {
    // if (typeof customization === 'string') {
    //   const extensionValue = this._findExtensionValue(customization);
    //   customization = extensionValue.value;
    // }

    switch (scope) {
      case CustomizationScope.Global:
        this.setGlobalCustomization(customizationId, customization);
        break;
      case CustomizationScope.Mode:
        this.setModeCustomization(customizationId, customization);
        break;
      case CustomizationScope.Default:
        this.setDefaultCustomization(customizationId, customization);
        break;
      default:
        throw new Error(`Invalid customization scope: ${scope}`);
    }
  }

  /**
   * Gets all customizations for a given scope.
   *
   * @param scope - The scope to retrieve customizations from: 'global', 'mode', or 'default'
   * @returns A Map containing all customizations for the specified scope
   */
  public getCustomizations(scope: CustomizationScope): Map<string, Customization> {
    if (scope === CustomizationScope.Global) {
      return this.globalCustomizations;
    }
    if (scope === CustomizationScope.Mode) {
      return this.modeCustomizations;
    }
    return this.defaultCustomizations;
  }

  /**
   *  Returns true if there is a mode customization.  Doesn't include defaults, but
   * does return global overrides.
   */
  public hasCustomization(customizationId: string) {
    return (
      this.globalCustomizations.has(customizationId) || this.modeCustomizations.has(customizationId)
    );
  }

  /**
   * Applies any inheritance due to UI Type customization.
   * This will look for inheritsFrom in the customization object
   * and if that is found, will assign all iterable values from that
   * type into the new type, allowing default behavior to be configured.
   */
  public transform(customization: Customization): Customization {
    if (!customization) {
      return customization;
    }
    const { inheritsFrom } = customization;
    if (!inheritsFrom) {
      return customization;
    }
    const parent = this.getCustomization(inheritsFrom);
    const result = parent ? Object.assign({}, parent, customization) : customization;
    // Execute an nested type information
    return result.$transform?.(this) || result;
  }

  /**
   *
   * Sets a mode-specific customization.
   *
   * This method allows you to define or update a customization that applies only to the current mode.
   * Mode customizations are temporary and isolated, reset whenever a mode changes.
   *
   * @param customizationId - The unique identifier for the customization.
   * @param customization - The customization object containing the desired settings.
   */
  private setModeCustomization(customizationId: string, customization: Customization): void {
    const defaultCustomization = this.defaultCustomizations.get(customizationId);
    const modeCustomization = this.modeCustomizations.get(customizationId);
    const globCustomization = this.globalCustomizations.get(customizationId);

    const sourceCustomization =
      modeCustomization || this._cloneIfNeeded(globCustomization) || defaultCustomization;

    const result = this._update(sourceCustomization, customization);
    this.modeCustomizations.set(customizationId, result);

    this.transformedCustomizations.clear();
    this._broadcastEvent(this.EVENTS.MODE_CUSTOMIZATION_MODIFIED, {
      buttons: this.modeCustomizations,
      button: this.modeCustomizations.get(customizationId),
    });
  }

  private setGlobalCustomization(id: string, value: Customization): void {
    const defaultCustomization = this.defaultCustomizations.get(id);
    const globCustomization = this.globalCustomizations.get(id);

    const sourceCustomization = this._cloneIfNeeded(globCustomization) || defaultCustomization;
    this.globalCustomizations.set(id, this._update(sourceCustomization, value));

    this.transformedCustomizations.clear();
    this._broadcastEvent(this.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED, {
      buttons: this.defaultCustomizations,
      button: this.defaultCustomizations.get(id),
    });
  }

  private setDefaultCustomization(id: string, value: Customization): void {
    if (this.defaultCustomizations.has(id)) {
      console.warn(`Trying to update existing default for customization ${id}`);
    }
    this.transformedCustomizations.clear();

    const sourceCustomization = this.defaultCustomizations.get(id);
    this.defaultCustomizations.set(id, this._update(sourceCustomization, value));

    this._broadcastEvent(this.EVENTS.DEFAULT_CUSTOMIZATION_MODIFIED, {
      buttons: this.defaultCustomizations,
      button: this.defaultCustomizations.get(id),
    });
  }

  private _findExtensionValue(value: string) {
    const entry = this.extensionManager.getModuleEntry(value);
    return entry as { value: Customization };
  }

  /**
   * Registers a custom command to be used in customization updates.
   * @param commandName - The name of the command (without the $ prefix)
   *   it will be prefixed with $
   * @param handler - Function that handles the command it receives the value and the original value
   */
  public registerCustomUpdateCommand(
    commandName: string,
    handler: (value: Customization, original: Customization) => Customization
  ): void {
    if (!commandName.startsWith('$')) {
      commandName = '$' + commandName;
    }
    extend(commandName, handler);
  }

  /**
   * Uses immutability-helper to apply the user's commands (e.g. $set, $push, $apply, etc.)
   * Takes into account the 'mergeType' if it's explicitly 'Replace'; otherwise does a normal update.
   */
  private _update(oldValue: Customization | undefined, newValue: Customization): Customization {
    if (!oldValue) {
      oldValue = undefined;
    }

    // Use immutability-helper to apply the commands
    // if $ is not part of the value in the json string, then we just return the newValue
    if (!hasDollarKey(newValue)) {
      return newValue;
    }

    const result = update(oldValue, newValue);
    return result;
  }

  private _cloneIfNeeded(value: any) {
    // If it's null/undefined or not an object, return as is
    if (!value || typeof value !== 'object') {
      return value;
    }

    // If it's an array, create a shallow copy
    if (Array.isArray(value)) {
      return [...value];
    }

    // Otherwise create a shallow copy of the object
    return { ...value };
  }

  _addReference(value?: any, type = CustomizationScope.Global): void {
    if (!value) {
      return;
    }

    if (typeof value === 'string') {
      const extensionValue = this._findExtensionValue(value);
      value = extensionValue.value;
    }

    Object.entries(value).forEach(([id, customization]) => {
      const setName =
        (type === CustomizationScope.Global && 'setGlobalCustomization') ||
        (type === CustomizationScope.Default && 'setDefaultCustomization') ||
        'setModeCustomization';
      this[setName](id as string, customization as Customization);
    });
  }

  /**
   * Customizations can be specified as an array of strings or customizations,
   * or as an object whose key is the reference id, and the value is the string
   * or customization.
   */
  addReferences(references?: any, type = CustomizationScope.Global): void {
    if (!references) {
      return;
    }
    if (Array.isArray(references)) {
      references.forEach(item => {
        this._addReference(item, type);
      });
    } else {
      this._addReference(references, type);
    }
  }
}

/** Add custom $filter command */
extend('$filter', (query, original) => {
  // This helper checks if an object matches all key/value pairs in `match`
  function objectMatches(item, matchObj) {
    return (
      item && typeof item === 'object' && Object.entries(matchObj).every(([k, v]) => item[k] === v)
    );
  }

  // Recursively walk objects/arrays. Whenever we hit an array, we either filter
  // or update items that match, depending on what was passed in via `query`.
  function deepFilter(value, filterQuery) {
    // If it's an array, apply the filtering/updating logic to each item
    if (Array.isArray(value)) {
      let result = value;

      // 1) If it's a function, filter array items
      if (typeof filterQuery === 'function') {
        return value.filter(filterQuery);
      }

      // 2) If it's a string, remove items whose .id matches that string
      if (typeof filterQuery === 'string') {
        return value.filter(item => item.id !== filterQuery);
      }

      // 3) If it's an object with .match and .merge, apply the merge to matched items
      if (typeof filterQuery === 'object' && filterQuery.match && filterQuery.$merge) {
        // First recurse into sub-objects/arrays so we handle deeply nested arrays
        result = value.map(item => deepFilter(item, filterQuery));
        // Then update items that match
        return result.map(item => {
          if (objectMatches(item, filterQuery.match)) {
            return { ...item, ...filterQuery.$merge };
          }
          return item;
        });
      }

      // 4) If it's an object with .id and .$merge, for backwards-compat
      if (typeof filterQuery === 'object' && filterQuery.id && filterQuery.$merge) {
        result = value.map(item => deepFilter(item, filterQuery));
        return result.map(item => {
          if (item.id === filterQuery.id) {
            return { ...item, ...filterQuery.$merge };
          }
          return item;
        });
      }

      // Otherwise, just recurse into sub-objects without filtering
      return value.map(item => deepFilter(item, filterQuery));
    }

    // If it's a plain object, recurse into its properties
    if (value && typeof value === 'object') {
      const newObj = { ...value };
      for (const [key, val] of Object.entries(newObj)) {
        newObj[key] = deepFilter(val, filterQuery);
      }
      return newObj;
    }

    // If it's neither array nor object, just return it
    return value;
  }

  return deepFilter(original, query);
});

function hasDollarKey(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasDollarKey(item)) {
        return true;
      }
    }
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') && key !== '$transform') {
        return true;
      }
      if (hasDollarKey(value[key])) {
        return true;
      }
    }
  }
  return false;
}
