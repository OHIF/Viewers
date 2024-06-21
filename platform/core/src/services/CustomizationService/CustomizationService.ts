import { mergeWith, cloneDeepWith } from 'lodash';

import { PubSubService } from '../_shared/pubSubServiceInterface';
import type { Customization, NestedStrings } from './types';
import type { CommandsManager } from '../../classes';
import type { ExtensionManager } from '../../extensions';

const EVENTS = {
  MODE_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:modeModified',
  GLOBAL_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:globalModified',
};

const flattenNestedStrings = (
  strs: NestedStrings | string,
  ret?: Record<string, string>
): Record<string, string> => {
  if (!ret) {
    ret = {};
  }
  if (!strs) {
    return ret;
  }
  if (Array.isArray(strs)) {
    for (const val of strs) {
      flattenNestedStrings(val, ret);
    }
  } else {
    ret[strs] = strs;
  }
  return ret;
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

export enum CustomizationType {
  Global = 'Global',
  Mode = 'Mode',
  Default = 'Default',
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
  public static REGISTRATION = {
    name: 'customizationService',
    create: ({ configuration = {}, commandsManager }) => {
      return new CustomizationService({ configuration, commandsManager });
    },
  };

  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;

  /**
   * mode customizations are changes to the default behaviour which are reset
   * every time a new mode is entered.  This allows the mode to define custom
   * behaviour, and not interfere with other modes.
   */
  private modeCustomizations = new Map<string, Customization>();
  /**
   * global customizations, are customizations which are set as a global default
   * This allows changes across the board to be applied, essentially as a priority
   * setting.
   */
  private globalCustomizations = new Map<string, Customization>();

  /**
   * Default customizations allow applying default values.  The intent is that
   * there is only one customization of that type, and it is registered at setup
   * time.
   */
  private defaultCustomizations = new Map<string, Customization>();

  /**
   * Has the transformed/final customization value.  This avoids needing to
   * transform every time a customization is requested.
   */
  private transformedCustomizations = new Map<string, Customization>();

  configuration: any;

  constructor({ configuration, commandsManager }) {
    super(EVENTS);
    this.commandsManager = commandsManager;
    this.configuration = configuration || {};
  }

  public init(extensionManager: ExtensionManager): void {
    this.extensionManager = extensionManager;
    // Clear defaults as those are defined by the customization modules
    this.defaultCustomizations.clear();
    // Clear modes because those are defined in onModeEnter functions.
    this.modeCustomizations.clear();
    this.initDefaults();
    this.addReferences(this.configuration);
  }

  initDefaults(): void {
    this.extensionManager.getRegisteredExtensionIds().forEach(extensionId => {
      const keyDefault = `${extensionId}.customizationModule.default`;
      const defaultCustomizations = this.findExtensionValue(keyDefault);
      if (defaultCustomizations) {
        const { value } = defaultCustomizations;
        this.addReference(value, CustomizationType.Default);
      }
      const keyGlobal = `${extensionId}.customizationModule.global`;
      const globalCustomizations = this.findExtensionValue(keyGlobal);
      if (globalCustomizations) {
        const { value } = globalCustomizations;
        this.addReference(value, CustomizationType.Global);
      }
    });
  }

  findExtensionValue(value: string) {
    const entry = this.extensionManager.getModuleEntry(value);
    return entry as { value: Customization };
  }

  public onModeEnter(): void {
    super.reset();
    this.modeCustomizations.clear();
  }

  public getModeCustomizations(): Map<string, Customization> {
    return this.modeCustomizations;
  }

  public setModeCustomization(
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

  /**
   * This is the preferred getter for all customizations,
   * getting global (priority) customizations first,
   * then mode customizations, and finally the default customization.
   *
   * @param customizationId - the customization id to look for
   * @param defaultValue - is the default value to return.
   *    This value will be assigned as the default customization if there isn't
   *    currently a default customization, and thus, the first default provided
   *    will be used as the default - you cannot update this after or have it depend
   *    on changing values.
   *    Also, the value returned by the get customization has merges/updates applied,
   *    and is thus may be modified from the value provided, and may not be the original
   *    default provided.  This allows applying the defaults for things like inheritance.
   * @return A customization to use if one is found, or the default customization,
   *    both enhanced with any customizationType inheritance (see transform)
   */
  public getCustomization(customizationId: string, defaultValue?: Customization): Customization {
    const transformed = this.transformedCustomizations.get(customizationId);
    if (transformed) {
      return transformed;
    }
    if (defaultValue && !this.defaultCustomizations.has(customizationId)) {
      this.setDefaultCustomization(customizationId, defaultValue);
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

  /** Mode customizations are changes to the behavior of the extensions
   * when running in a given mode.  Reset clears mode customizations.
   *
   * Note that global customizations over-ride mode customizations
   *
   * @param defaultValue to return if no customization specified.
   */
  public getModeCustomization = this.getCustomization;

  /**
   *  Returns true if there is a mode customization.  Doesn't include defaults, but
   * does return global overrides.
   */
  public hasModeCustomization(customizationId: string) {
    return (
      this.globalCustomizations.has(customizationId) || this.modeCustomizations.has(customizationId)
    );
  }

  /**
   * get is an alias for getModeCustomization, as it is the generic getter
   * which will return both mode and global customizations, and should be
   * used generally.
   * Note that the second parameter, defaultValue, will be expanded to include
   * any customizationType values defined in it, so it is not the same as doing:
   *   `customizationService.get('key') || defaultValue`
   * unless the defaultValue does not contain any customizationType definitions.
   */
  public get = this.getModeCustomization;

  /**
   * Applies any inheritance due to UI Type customization.
   * This will look for customizationType in the customization object
   * and if that is found, will assign all iterable values from that
   * type into the new type, allowing default behaviour to be configured.
   */
  public transform(customization: Customization): Customization {
    if (!customization) {
      return customization;
    }
    const { customizationType } = customization;
    if (!customizationType) {
      return customization;
    }
    const parent = this.getCustomization(customizationType);
    const result = parent ? Object.assign(Object.create(parent), customization) : customization;
    // Execute an nested type information
    return result.transform?.(this) || result;
  }

  public addModeCustomizations(modeCustomizations): void {
    if (!modeCustomizations) {
      return;
    }
    this.addReferences(modeCustomizations, CustomizationType.Mode);

    this._broadcastModeCustomizationModified();
  }

  _broadcastModeCustomizationModified(): void {
    this._broadcastEvent(EVENTS.MODE_CUSTOMIZATION_MODIFIED, {
      modeCustomizations: this.modeCustomizations,
      globalCustomizations: this.globalCustomizations,
    });
  }

  /** Global customizations are those that affect parts of the GUI other than
   * the modes.  They include things like settings for the search screen.
   * Reset does NOT clear global customizations.
   */
  getGlobalCustomization(id: string, defaultValue?: Customization): Customization | void {
    return this.transform(
      this.globalCustomizations.get(id) ?? this.defaultCustomizations.get(id) ?? defaultValue
    );
  }

  /**
   * Performs a merge, creating a new instance value - that is, not referencing
   * the old one.  This only works if you run once for the merge, so in general,
   * the source value should be global, while the appends should be mode based.
   * However, you can append to a global value too, as long as you ensure it
   * only gets merged once.
   */
  private mergeValue(oldValue, newValue, mergeType = MergeEnum.Replace) {
    if (mergeType === MergeEnum.Replace) {
      return newValue;
    }

    const returnValue = mergeWith({}, oldValue, newValue, mergeType === MergeEnum.Append ? appendCustomizer : mergeCustomizer);
    return returnValue;
  }

  public setGlobalCustomization(id: string, value: Customization, merge = MergeEnum.Replace): void {
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
    this._broadcastGlobalCustomizationModified();
  }

  public setDefaultCustomization(
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
  }

  protected setConfigGlobalCustomization(configuration: AppConfigCustomization): void {
    this.globalCustomizations.clear();
    const keys = flattenNestedStrings(configuration.globalCustomizations);
    this.readCustomizationTypes(v => keys[v.name] && v.customization, this.globalCustomizations);

    // TODO - iterate over customizations, loading them from the extension
    // manager.
    this._broadcastGlobalCustomizationModified();
  }

  _broadcastGlobalCustomizationModified(): void {
    this._broadcastEvent(EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED, {
      modeCustomizations: this.modeCustomizations,
      globalCustomizations: this.globalCustomizations,
    });
  }

  /**
   * A single reference is either an string to be loaded from a module,
   * or a customization itself.
   */
  addReference(value?, type = CustomizationType.Global, id?: string, merge?: MergeEnum): void {
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      const extensionValue = this.findExtensionValue(value);
      // The child of a reference is only a set of references when an array,
      // so call the addReference direct.  It could be a secondary reference perhaps
      this.addReference(extensionValue.value, type, extensionValue.name, extensionValue.merge);
    } else if (Array.isArray(value)) {
      this.addReferences(value, type);
    } else {
      const useId = value.id || id;
      const setName =
        (type === CustomizationType.Global && 'setGlobalCustomization') ||
        (type === CustomizationType.Default && 'setDefaultCustomization') ||
        'setModeCustomization';
      this[setName](useId as string, value, merge);
    }
  }

  /**
   * Customizations can be specified as an array of strings or customizations,
   * or as an object whose key is the reference id, and the value is the string
   * or customization.
   */
  addReferences(references?, type = CustomizationType.Global): void {
    if (!references) {
      return;
    }
    if (Array.isArray(references)) {
      references.forEach(item => {
        this.addReference(item, type);
      });
    } else {
      for (const key of Object.keys(references)) {
        const value = references[key];
        this.addReference(value, type, key);
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
            newList[position] = mergeWith(Array.isArray(newList[position]) ? [] : {}, newList[position], value, appendCustomizer);
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
    return { isMerge: false, position: Math.min(len, Math.max(absPosition, 0)) }
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
    return { isMerge: false, position: Math.min(len, Math.max(absPosition, 0)) }
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
