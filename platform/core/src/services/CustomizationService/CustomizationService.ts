import { mergeWith, cloneDeepWith } from 'lodash';

import { PubSubService } from '../_shared/pubSubServiceInterface';
import type { Customization, NestedStrings } from './types';
import type { CommandsManager } from '../../classes';
import type { ExtensionManager } from '../../extensions';

const EVENTS = {
  MODE_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:modeModified',
  GLOBAL_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:globalModified',
  DEFAULT_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:defaultModified',
};

export enum MergeEnum {
  /**
   * Append values in the nested arrays
   */
  Append = 'Append',
  /**
   * Merge values, replacing arrays
   */
  Merge = 'Merge',
  /**
   * Replace the given value - this is the default
   */
  Replace = 'Replace',
}

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
  public Enum = MergeEnum;

  public static REGISTRATION = {
    name: 'customizationService',
    create: ({ commandsManager }) => {
      return new CustomizationService({ commandsManager });
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

  constructor({ commandsManager }) {
    super(EVENTS);
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
  }

  public onModeEnter(): void {
    super.reset();

    const modeCustomizationKeys = Array.from(this.modeCustomizations.keys());
    for (const key of modeCustomizationKeys) {
      this.transformedCustomizations.delete(key);
    }

    this.modeCustomizations.clear();
  }

  public onModeExit(): void {
    this.onModeEnter();
  }

  /**
   * Unified getter for customizations.
   *
   * @param customizationId - The ID of the customization to retrieve.
   * @param scope - (Optional) The scope to retrieve from: 'global', 'mode', or 'default'.
   *                 If not specified, it retrieves based on priority: global > mode > default.
   * @returns The requested customization.
   */
  public getCustomization(customizationId: string): Customization {
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
   * Unified setter for customizations.
   *
   * @param customizationId - The unique identifier for the customization.
   * @param customization - The customization object containing the desired settings or
   *                  string which is the module id to load from an extension
   * @param merge - The merge strategy to apply. Defaults to `MergeEnum.Merge`.
   * @param scope - The scope to set the customization: 'global', 'mode', or 'default'.
   *                Defaults to 'mode'.
   */
  public setCustomization(
    customizationId: string,
    customization: Customization | string,
    scope: CustomizationScope,
    merge = MergeEnum.Merge
  ): void {
    if (typeof customization === 'string') {
      const extensionValue = this._findExtensionValue(customization);
      customization = extensionValue.value;
    }

    switch (scope) {
      case CustomizationScope.Global:
        this.setGlobalCustomization(customizationId, customization, merge);
        break;
      case CustomizationScope.Mode:
        this.setModeCustomization(customizationId, customization, merge);
        break;
      case CustomizationScope.Default:
        this.setDefaultCustomization(customizationId, customization, merge);
        break;
      default:
        throw new Error(`Invalid customization scope: ${scope}`);
    }
  }

  public setCustomizations(
    customizations: Customization[] | string[],
    scope: CustomizationScope,
    merge = MergeEnum.Merge
  ): void {
    customizations.forEach(customization =>
      this.setCustomization(customization.id, customization, scope, merge)
    );
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
   * type into the new type, allowing default behaviour to be configured.
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
    return result.transform?.(this) || result;
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
   * @param merge - (Optional) Specifies how the customization should be merged with existing ones.
   *                Defaults to `MergeEnum.Merge`.
   */
  private setModeCustomization(
    customizationId: string,
    customization: Customization,
    merge = MergeEnum.Merge
  ): void {
    const defaultCustomization = this.defaultCustomizations.get(customizationId);
    const modeCustomization = this.modeCustomizations.get(customizationId);
    const globCustomization = this.globalCustomizations.get(customizationId);
    const sourceCustomization =
      modeCustomization ||
      (globCustomization && cloneDeepWith(globCustomization, cloneCustomizer)) ||
      defaultCustomization ||
      {};

    // use the source merge type if not provided then fallback to merge
    this.modeCustomizations.set(
      customizationId,
      this.mergeValue(sourceCustomization, customization, sourceCustomization.merge ?? merge)
    );
    this.transformedCustomizations.clear();
    this._broadcastEvent(this.EVENTS.CUSTOMIZATION_MODIFIED, {
      buttons: this.modeCustomizations,
      button: this.modeCustomizations.get(customizationId),
    });
  }

  private setGlobalCustomization(
    id: string,
    value: Customization,
    merge = MergeEnum.Replace
  ): void {
    const defaultCustomization = this.defaultCustomizations.get(id);
    const globCustomization = this.globalCustomizations.get(id);
    const sourceCustomization =
      (globCustomization && cloneDeepWith(globCustomization, cloneCustomizer)) ||
      defaultCustomization ||
      {};

    this.globalCustomizations.set(
      id,
      this.mergeValue(sourceCustomization, value, value.merge ?? merge)
    );
    this.transformedCustomizations.clear();
    this._broadcastEvent(this.EVENTS.DEFAULT_CUSTOMIZATION_MODIFIED, {
      buttons: this.defaultCustomizations,
      button: this.defaultCustomizations.get(id),
    });
  }

  private setDefaultCustomization(
    id: string,
    value: Customization,
    merge = MergeEnum.Replace
  ): void {
    if (this.defaultCustomizations.has(id)) {
      throw new Error(`Trying to update existing default for customization ${id}`);
    }
    this.transformedCustomizations.clear();
    this.defaultCustomizations.set(
      id,
      this.mergeValue(this.defaultCustomizations.get(id), value, merge)
    );
    this._broadcastEvent(this.EVENTS.DEFAULT_CUSTOMIZATION_MODIFIED, {
      buttons: this.defaultCustomizations,
      button: this.defaultCustomizations.get(id),
    });
  }

  _findExtensionValue(value: string) {
    const entry = this.extensionManager.getModuleEntry(value);
    return entry as { value: Customization };
  }

  /**
   * Performs a merge, creating a new instance value - that is, not referencing
   * the old one.  This only works if you run once for the merge, so in general,
   * the source value should be global, while the appends should be mode based.
   * However, you can append to a global value too, as long as you ensure it
   * only gets merged once.
   */
  private mergeValue(
    oldValue: Customization,
    newValue: Customization,
    mergeType = MergeEnum.Replace
  ) {
    if (mergeType === MergeEnum.Replace) {
      return newValue;
    }

    const returnValue = mergeWith(
      {},
      oldValue,
      newValue,
      mergeType === MergeEnum.Append ? appendCustomizer : mergeCustomizer
    );
    return returnValue;
  }

  /**
   * A single reference is either an string to be loaded from a module,
   * or a customization itself.
   */
  _addReference(value?, type = CustomizationScope.Global, id?: string, merge?: MergeEnum): void {
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      const extensionValue = this._findExtensionValue(value);
      // The child of a reference is only a set of references when an array,
      // so call the _addReference direct.  It could be a secondary reference perhaps
      this._addReference(extensionValue.value, type, extensionValue.name, extensionValue.merge);
    } else if (Array.isArray(value)) {
      this._addReferences(value, type);
    } else {
      const useId = value.id || id;
      const setName =
        (type === CustomizationScope.Global && 'setGlobalCustomization') ||
        (type === CustomizationScope.Default && 'setDefaultCustomization') ||
        'setModeCustomization';
      this[setName](useId as string, value, merge);
    }
  }

  /**
   * Customizations can be specified as an array of strings or customizations,
   * or as an object whose key is the reference id, and the value is the string
   * or customization.
   */
  _addReferences(references?, type = CustomizationScope.Global): void {
    if (!references) {
      return;
    }
    if (Array.isArray(references)) {
      references.forEach(item => {
        this._addReference(item, type);
      });
    } else {
      for (const key of Object.keys(references)) {
        const value = references[key];
        this._addReference(value, type, key);
      }
    }
  }
}

/**
 * Custom merging function, to handle merging arrays and copying functions
 */
function appendCustomizer(obj, src) {
  if (Array.isArray(obj)) {
    const srcArray = Array.isArray(src);
    if (srcArray) {
      return obj.concat(...src);
    }
    if (typeof src === 'object') {
      const newList = obj.map(value => cloneDeepWith(value, cloneCustomizer));
      for (const [key, value] of Object.entries(src)) {
        const { position, isMerge } = findPosition(key, value, newList);
        if (isMerge) {
          if (typeof obj[position] === 'object') {
            newList[position] = mergeWith(
              Array.isArray(newList[position]) ? [] : {},
              newList[position],
              value,
              appendCustomizer
            );
          } else {
            newList[position] = value;
          }
        } else {
          newList.splice(position, 0, value);
        }
      }
      return newList;
    }
    return obj.concat(src);
  }
  return cloneCustomizer(src);
}

function mergeCustomizer(obj, src) {
  return cloneCustomizer(src);
}

function findPosition(key, value, newList) {
  const numVal = Number(key);
  const isNumeric = !isNaN(numVal);
  const { length: len } = newList;

  if (isNumeric) {
    if (newList[numVal < 0 ? numVal + len : numVal]) {
      return { isMerge: true, position: (numVal + len) % len };
    }
    const absPosition = Math.ceil(numVal < 0 ? len + numVal : numVal);
    return { isMerge: false, position: Math.min(len, Math.max(absPosition, 0)) };
  }
  const findIndex = newList.findIndex(it => it.id === key);
  if (findIndex !== -1) {
    return { isMerge: true, position: findIndex };
  }
  const { _priority: priority } = value;
  if (priority !== undefined) {
    if (newList[(priority + len) % len]) {
      return { isMerge: true, position: (priority + len) % len };
    }
    const absPosition = Math.ceil(priority < 0 ? len + priority : priority);
    return { isMerge: false, position: Math.min(len, Math.max(absPosition, 0)) };
  }
  return { isMerge: false, position: len };
}

/**
 * Custom cloning function to just copy function reference
 */
function cloneCustomizer(value) {
  if (typeof value === 'function') {
    return value;
  }
}
