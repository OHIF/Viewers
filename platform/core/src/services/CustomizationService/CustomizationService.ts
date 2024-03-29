import merge from 'lodash.merge';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import { Customization, NestedStrings, Obj } from './types';
import { CommandsManager } from '../../classes';

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
  extensionManager: Record<string, unknown>;

  modeCustomizations: Record<string, Customization> = {};
  globalCustomizations: Record<string, Customization> = {};
  configuration: any;

  constructor({ configuration, commandsManager }) {
    super(EVENTS);
    this.commandsManager = commandsManager;
    this.configuration = configuration || {};
  }

  public init(extensionManager: ExtensionManager): void {
    this.extensionManager = extensionManager;
    this.initDefaults();
    this.addReferences(this.configuration);
  }

  initDefaults(): void {
    this.extensionManager.registeredExtensionIds.forEach(extensionId => {
      const key = `${extensionId}.customizationModule.default`;
      const defaultCustomizations = this.findExtensionValue(key);
      if (!defaultCustomizations) {
        return;
      }
      const { value } = defaultCustomizations;
      this.addReference(value, true);
    });
  }

  findExtensionValue(value: string): Obj | void {
    const entry = this.extensionManager.getModuleEntry(value);
    return entry;
  }

  public onModeEnter(): void {
    super.reset();
    this.modeCustomizations = {};
  }

  public getModeCustomizations(): Record<string, Customization> {
    return this.modeCustomizations;
  }

  public setModeCustomization(customizationId: string, customization: Customization): void {
    this.modeCustomizations[customizationId] = merge(
      this.modeCustomizations[customizationId] || {},
      customization
    );
    this._broadcastEvent(this.EVENTS.CUSTOMIZATION_MODIFIED, {
      buttons: this.modeCustomizations,
      button: this.modeCustomizations[customizationId],
    });
  }

  /** This is the preferred getter for all customizations,
   * getting mode customizations first and otherwise global customizations.
   *
   * @param customizationId - the customization id to look for
   * @param defaultValue - is the default value to return.  Note this value
   * may have been extended with any customizationType extensions provided,
   * so you cannot just use `|| defaultValue`
   * @return A customization to use if one is found, or the default customization,
   * both enhanced with any customizationType inheritance (see transform)
   */
  public getCustomization(
    customizationId: string,
    defaultValue?: Customization
  ): Customization | void {
    return this.getModeCustomization(customizationId, defaultValue);
  }

  /** Mode customizations are changes to the behavior of the extensions
   * when running in a given mode.  Reset clears mode customizations.
   * Note that global customizations over-ride mode customizations.
   * @param defaultValue to return if no customization specified.
   */
  public getModeCustomization(
    customizationId: string,
    defaultValue?: Customization
  ): Customization {
    const customization =
      this.globalCustomizations[customizationId] ??
      this.modeCustomizations[customizationId] ??
      defaultValue;
    return this.transform(customization);
  }

  public hasModeCustomization(customizationId: string) {
    return this.globalCustomizations[customizationId] || this.modeCustomizations[customizationId];
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
    this.addReferences(modeCustomizations, false);

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
    return this.transform(this.globalCustomizations[id] ?? defaultValue);
  }

  setGlobalCustomization(id: string, value: Customization): void {
    this.globalCustomizations[id] = value;
    this._broadcastGlobalCustomizationModified();
  }

  protected setConfigGlobalCustomization(configuration: AppConfigCustomization): void {
    this.globalCustomizations = {};
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
  addReference(value?: Obj | string, isGlobal = true, id?: string): void {
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      const extensionValue = this.findExtensionValue(value);
      // The child of a reference is only a set of references when an array,
      // so call the addReference direct.  It could be a secondary reference perhaps
      this.addReference(extensionValue.value, isGlobal, extensionValue.name);
    } else if (Array.isArray(value)) {
      this.addReferences(value, isGlobal);
    } else {
      const useId = value.id || id;
      this[isGlobal ? 'setGlobalCustomization' : 'setModeCustomization'](useId as string, value);
    }
  }

  /**
   * Customizations can be specified as an array of strings or customizations,
   * or as an object whose key is the reference id, and the value is the string
   * or customization.
   */
  addReferences(references?: Obj | Obj[], isGlobal = true): void {
    if (!references) {
      return;
    }
    if (Array.isArray(references)) {
      references.forEach(item => {
        this.addReference(item, isGlobal);
      });
    } else {
      for (const key of Object.keys(references)) {
        const value = references[key];
        this.addReference(value, isGlobal, key);
      }
    }
  }
}
