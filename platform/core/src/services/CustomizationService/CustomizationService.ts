import merge from 'lodash.merge';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import { Customization, NestedStrings, Obj } from './types';

const EVENTS = {
  MODE_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:modeModified',
  GLOBAL_CUSTOMIZATION_MODIFIED: 'event::CustomizationService:globalModified',
};

const flattenNestedStrings = (
  strs: NestedStrings | string,
  ret?: Record<string, string>
): Record<string, string> => {
  if (!ret) ret = {};
  if (!strs) return ret;
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
  commandsManager: Record<string, unknown>;
  extensionManager: Record<string, unknown>;

  modeCustomizations: Record<string, Customization> = {};
  globalCustomizations: Record<string, Customization> = {};
  configuration: UICustomizationConfiguration;

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
      if (!defaultCustomizations) return;
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

  /**
   *
   * @param {*} interaction - can be undefined to run nothing
   * @param {*} extraOptions to include in the commands run
   */
  recordInteraction(
    interaction: Customization | void,
    extraOptions?: Record<string, unknown>
  ): void {
    if (!interaction) return;
    const commandsManager = this.commandsManager;
    const { commands = [] } = interaction;

    commands.forEach(({ commandName, commandOptions, context }) => {
      if (commandName) {
        commandsManager.runCommand(
          commandName,
          {
            interaction,
            ...commandOptions,
            ...extraOptions,
          },
          context
        );
      } else {
        console.warn('No command name supplied in', interaction);
      }
    });
  }

  public getModeCustomizations(): Record<string, Customization> {
    return this.modeCustomizations;
  }

  public setModeCustomization(
    customizationId: string,
    customization: Customization
  ): void {
    this.modeCustomizations[customizationId] = merge(
      this.modeCustomizations[customizationId] || {},
      customization
    );
    this._broadcastEvent(this.EVENTS.CUSTOMIZATION_MODIFIED, {
      buttons: this.modeCustomizations,
      button: this.modeCustomizations[customizationId],
    });
  }

  /** Mode customizations are changes to the behaviour of the extensions
   * when running in a given mode.  Reset clears mode customizations.
   * Note that global customizations over-ride mode customizations.
   * @param defautlValue to return if no customization specified.
   */
  public getModeCustomization(
    customizationId: string,
    defaultValue?: Customization
  ): Customization | void {
    const customization =
      this.globalCustomizations[customizationId] ??
      this.modeCustomizations[customizationId] ??
      defaultValue;
    return this.applyType(customization);
  }

  /** Applies any inheritance due to UI Type customization */
  public applyType(customization: Customization): Customization {
    if (!customization) return customization;
    const { customizationType } = customization;
    if (!customizationType) return customization;
    const parent = this.getModeCustomization(customizationType);
    return parent
      ? Object.assign(Object.create(parent), customization)
      : customization;
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
  getGlobalCustomization(
    id: string,
    defaultValue?: Customization
  ): Customization | void {
    return this.applyType(this.globalCustomizations[id] ?? defaultValue);
  }

  setGlobalCustomization(id: string, value: Customization): void {
    this.globalCustomizations[id] = value;
    this._broadcastGlobalCustomizationModified();
  }

  protected setConfigGlobalCustomization(
    configuration: AppConfigCustomization
  ): void {
    this.globalCustomizations = {};
    const keys = flattenNestedStrings(configuration.globalCustomizations);
    this.readCustomizationTypes(
      v => keys[v.name] && v.customization,
      this.globalCustomizations
    );

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
   * A single reference is either an an array, or a single customization value,
   * whose id is the id in the object, or the parent id.
   * This allows for general use to register customizationModule entries.
   */
  addReference(
    value?: Obj | Obj[] | string,
    isGlobal = true,
    id?: string
  ): void {
    if (!value) return;
    if (typeof value === 'string') {
      const extensionValue = this.findExtensionValue(value);
      this.addReferences(extensionValue);
    } else if (Array.isArray(value)) {
      this.addReferences(value, isGlobal);
    } else {
      const useId = value.id || id;
      this[isGlobal ? 'setGlobalCustomization' : 'setModeCustomization'](
        useId as string,
        value
      );
    }
  }

  /** References are:
   * list of customizations, added in order
   * object containing a customization id and value
   * This format allows for the original whitelist format.
   */
  addReferences(references?: Obj | Obj[], isGlobal = true): void {
    if (!references) return;
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
