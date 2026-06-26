import update, { extend } from 'immutability-helper';
import JSON5 from 'json5';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import type { Customization } from './types';
import type { CommandsManager } from '../../classes';
import type ExtensionManager from '../../extensions/ExtensionManager';
import { getCustomizationUrlPolicy } from './customizationUrl';
import { getUrlCustomizationModulePayload } from './getUrlCustomizationModulePayload';
import { resolveCustomizationUrl } from './resolve';
import {
  parseCustomizationParams,
  validateCustomizationRequests,
} from './validate';
import type { ValidatedCustomization } from './validate';
import type { CustomizationUrlPolicy } from './customizationUrlDefaults';
import type {
  CustomizationModule,
  CustomizationPhaseInput,
  LoadedCustomization,
  LoadOptions,
  PhasedCustomizationConfig,
} from './customizationUrlTypes';

/**
 * Reserved key in a `mode` phase block for the "general" customizations that
 * apply to every mode. The general block is applied FIRST on each mode enter;
 * a block keyed by the entered mode's id / routeName is applied after it so a
 * single mode can override the general values.
 */
export const GENERAL_MODE_KEY = '*';

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
   * customizations are defined. These are not cleared when the service re-inits
   * for a mode change; only Mode scope is reset.
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
   * A collection of default customizations used as fallbacks. Entries are merged
   * over time (including from `init()` re-reading extension default modules) and
   * are not cleared on mode change. Mode and Global scopes override these values.
   */
  private defaultCustomizations = new Map<string, Customization>();

  /**
   * Has the transformed/final customization value.  This avoids needing to
   * transform every time a customization is requested.
   */
  private transformedCustomizations = new Map<string, Customization>();
  private configuration: AppTypes.Config;

  /**
   * URL customization modules already imported and applied (key = normalized `/prefix/name`).
   * Entries are kept for the lifetime of the page: repeated loads skip imports, and the app
   * normally applies `?customization=` only at bootstrap (see {@link applyWindowUrlCustomizations}).
   */
  private _urlCustomizationLoaded = new Map<string, LoadedCustomization>();

  private _urlCustomizationPending = new Map<string, Promise<LoadedCustomization | null>>();

  /**
   * Every URL customization module resolved this page session, in load order
   * (dependencies before dependents). The lifecycle phase appliers
   * ({@link applyPreExtensionCustomizations}, {@link applyGlobalCustomizations},
   * {@link applyModeCustomizations}) iterate this list so a module's phase
   * blocks are applied at the right time regardless of when it was fetched.
   */
  private _resolvedUrlModules: LoadedCustomization[] = [];

  /**
   * Normalized form of `appConfig.customizationService`. Either a phase-tagged
   * config ({@link PhasedCustomizationConfig}) or, for the legacy array/object
   * form, the references to add (Global) during {@link init}.
   */
  private _customizationConfig: {
    phased?: PhasedCustomizationConfig;
    legacyReferences?: unknown;
  } | null = null;

  /** Id/aliases of the mode currently entered, used to re-apply mode phase blocks. */
  private _currentModeIds: string[] = [];

  /**
   * Extension module entry ids (e.g. `${extensionId}.customizationModule.default`) whose
   * default/global payloads have already been merged via {@link init}. Matches the URL
   * loader pattern: repeated {@link init} skips work for the same slot so immutability-style
   * merges are not applied twice. A slot is recorded only after a module was present and applied;
   * if a module appears only on a later {@link init} (e.g. a newly registered extension), it is merged then.
   */
  private _extensionCustomizationModuleApplied = new Set<string>();

  constructor({ configuration, commandsManager }) {
    super(EVENTS);
    this.configuration = configuration;
    this.commandsManager = commandsManager;
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Clears mode customizations and merges each extension's `customizationModule.default` /
   * `customizationModule.global` into the service. Safe to call multiple times (e.g. from
   * {@link onModeEnter}): each extension module slot is merged at most once per page session,
   * matching the deduplication pattern used for URL-loaded modules in {@link requires}.
   * Slots with no module yet are left unmarked so a later call can merge when the module appears.
   */
  public init(extensionManager: ExtensionManager): void {
    this.extensionManager = extensionManager;
    // Mode customizations are defined per mode in onModeEnter; reset them here.
    // Default customizations are not cleared — they are merged again from
    // extension modules below so definitions stay available across mode changes.
    this.modeCustomizations.clear();

    this.extensionManager.getRegisteredExtensionIds().forEach(extensionId => {
      const keyDefault = `${extensionId}.customizationModule.default`;
      if (!this._extensionCustomizationModuleApplied.has(keyDefault)) {
        const defaultCustomizations = this._findExtensionValue(keyDefault);
        if (defaultCustomizations) {
          const { value } = defaultCustomizations;
          this._addReference(value, CustomizationScope.Default);
          this._extensionCustomizationModuleApplied.add(keyDefault);
        }
      }
      const keyGlobal = `${extensionId}.customizationModule.global`;
      if (!this._extensionCustomizationModuleApplied.has(keyGlobal)) {
        const globalCustomizations = this._findExtensionValue(keyGlobal);
        if (globalCustomizations) {
          const { value } = globalCustomizations;
          this._addReference(value, CustomizationScope.Global);
          this._extensionCustomizationModuleApplied.add(keyGlobal);
        }
      }
    });

    // Only add references for the configuration once. The phase-tagged config
    // form (preExtension/global/mode) is applied by the lifecycle appliers
    // instead, so only the legacy array/object form is added here as Global.
    const config = this._getCustomizationConfig();
    if (config.legacyReferences !== undefined && !this.configuration?._hasBeenAdded) {
      this.addReferences(config.legacyReferences);
      Object.defineProperty(this.configuration, '_hasBeenAdded', { value: true, writable: false });
    }
  }

  /**
   * Memoized, normalized view of `appConfig.customizationService`. Detects the
   * phase-tagged form (any of `requires` / `preExtension` / `global` / `mode`)
   * and otherwise treats the value as legacy Global references.
   */
  private _getCustomizationConfig(): { phased?: PhasedCustomizationConfig; legacyReferences?: unknown } {
    if (!this._customizationConfig) {
      this._customizationConfig = normalizeCustomizationConfig(this.configuration);
    }
    return this._customizationConfig;
  }

  /**
   * Loads and applies `?customization=` modules from `window.location.search`.
   *
   * **Throws on disallowed values.** A `?customization=` value whose prefix is
   * not in `appConfig.customizationUrlPrefixes` (the default — the feature is off
   * until prefixes are configured) rejects this promise, which by design aborts
   * app bootstrap rather than silently ignoring the request.
   *
   * **Intended SPA behavior:** The shell typically calls this once during startup. It does not
   * run again on client-side route changes. The query key `customization` may still appear in
   * URLs (for example preserved by worklist navigation) without implying that modules are
   * re-evaluated on every navigation. Modules resolved here are also deduplicated by normalized
   * URL for the lifetime of the page in {@link requires}. To pick up a different `?customization=`
   * set, use a full page load or call {@link applyCustomizationUrlSearchParams} /
   * {@link requires} from your own integration code when appropriate.
   *
   * **What is loaded:** Each `?customization=` entry resolves to a JSONC file (JSON with
   * comments / trailing commas) under a configured prefix directory. The file is fetched and
   * parsed as **data** — it is never executed. Executable code (plugins, modes, extensions)
   * loads only through `pluginConfig.json`, never from the customization URL path. A module's
   * `global` payload is applied as global customizations and its `requires` are loaded first.
   */
  public async applyWindowUrlCustomizations(overrides?: Partial<LoadOptions>): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    await this.applyCustomizationUrlSearchParams(
      new URLSearchParams(window.location.search),
      overrides
    );
  }

  /**
   * Parses `?customization=` values from the search string and delegates to
   * {@link requires}.
   */
  public async applyCustomizationUrlSearchParams(
    params: URLSearchParams,
    overrides?: Partial<LoadOptions>
  ): Promise<void> {
    const raws = parseCustomizationParams(params);
    if (!raws.length) {
      return;
    }
    await this.requires(raws, overrides);
  }

  /**
   * Depth-first dynamic import of URL customization modules
   * `requires` edges and `customization` field
   * references are loaded before dependents. Already-loaded modules (same normalized key) are
   * skipped for the rest of the page session; they are not unloaded when the address bar changes.
   *
   * Invalid query entries, resolve failures, failed imports, and modules without a
   * customization payload are warned and skipped.
   */
  public requires(
    names: string | string[],
    overrides?: Partial<LoadOptions>
  ): Promise<LoadedCustomization[]> {
    return this.loadCustomizationModules(names, overrides).then(newlyLoaded => {
      // Back-compat: a direct `requires()` / `applyWindowUrlCustomizations()`
      // call applies the `global` slice immediately. The `preExtension` and
      // `mode` phases are driven by the boot orchestration
      // ({@link loadAndApplyPreExtensionCustomizations}) and {@link onModeEnter}.
      this._applyLoadedUrlCustomizationModules(newlyLoaded);
      return newlyLoaded;
    });
  }

  /**
   * Resolves (fetches + parses) the given URL customization modules and their
   * `requires` dependencies depth-first, WITHOUT applying any phase block.
   * Newly resolved modules are appended to {@link _resolvedUrlModules} in load
   * order so the lifecycle appliers can apply each phase at the right time.
   *
   * Rejects (aborting the load) when any entry is disallowed by the policy.
   */
  public loadCustomizationModules(
    names: string | string[],
    overrides?: Partial<LoadOptions>
  ): Promise<LoadedCustomization[]> {
    const policy = overrides?.policy ?? getCustomizationUrlPolicy(this);
    const list = (Array.isArray(names) ? names : [names])
      .map(s => String(s).trim())
      .filter(Boolean);
    if (!list.length) {
      return Promise.resolve([]);
    }

    const { valid, rejected } = validateCustomizationRequests(list, policy);
    const logger = overrides?.logger || console;
    // A `?customization=` value that is not allowed by the configured prefixes is
    // a hard error: stop the load and let it propagate. The feature is off until
    // `appConfig.customizationUrlPrefixes` allows a prefix, so on a default build
    // any `?customization=` value throws here rather than being silently ignored.
    if (rejected.length) {
      const details = rejected.map(r => `"${r.raw}" (${r.reason})`).join('; ');
      return Promise.reject(
        new Error(
          `[customizationUrl] refusing to load customization(s): ${details}. ` +
            `Allowed prefixes are configured in appConfig.customizationUrlPrefixes.`
        )
      );
    }
    if (!valid.length) {
      return Promise.resolve([]);
    }

    const importFn = overrides?.importFn ?? this._urlDefaultImport.bind(this);
    const requestedSet = new Set<string>();
    const newlyLoaded: LoadedCustomization[] = [];

    return valid
      .reduce(
        (prev, request) =>
          prev.then(() =>
            this._urlCustomizationLoadOne(
              request,
              policy,
              importFn,
              logger,
              requestedSet,
              newlyLoaded
            )
          ),
        Promise.resolve() as Promise<void>
      )
      .then(() => {
        this._resolvedUrlModules.push(...newlyLoaded);
        return newlyLoaded;
      });
  }

  /**
   * Boot-time entry point that runs BEFORE extensions are registered. It:
   *   1. records the ExtensionManager (so the URL policy / appConfig is readable),
   *   2. resolves every customization module requested via the
   *      `appConfig.customizationService.requires` list and the `?customization=`
   *      URL parameter (their data is fetched once, up front — long before any
   *      mode loads), and
   *   3. applies the `preExtension` phase blocks.
   *
   * Rejects (aborting bootstrap) if a `?customization=` value is disallowed.
   */
  public async loadAndApplyPreExtensionCustomizations(
    extensionManager: ExtensionManager,
    overrides?: Partial<LoadOptions>
  ): Promise<void> {
    this.extensionManager = extensionManager;
    const config = this._getCustomizationConfig();

    const names: string[] = [];
    const requires = config.phased?.requires;
    if (typeof requires === 'string' && requires) {
      names.push(requires);
    } else if (Array.isArray(requires)) {
      names.push(...requires.filter(name => typeof name === 'string' && name));
    }
    if (typeof window !== 'undefined') {
      names.push(...parseCustomizationParams(new URLSearchParams(window.location.search)));
    }

    if (names.length) {
      await this.loadCustomizationModules(names, overrides);
    }

    this.applyPreExtensionCustomizations();
  }

  /**
   * Applies the `preExtension` phase (Global scope) of the structured app config
   * and every resolved URL module. App-config blocks apply first so URL modules
   * layer on top.
   */
  public applyPreExtensionCustomizations(): void {
    this._applyPhase('preExtension');
  }

  /**
   * Applies the `global` phase (Global scope) of the structured app config and
   * every resolved URL module. Call after {@link init} so extension default /
   * global customizations are already in place for `$apply`-style merges.
   */
  public applyGlobalCustomizations(): void {
    this._applyPhase('global');
  }

  /**
   * Applies the `mode` phase (Mode scope) for the entered mode. The general
   * block (`*`) is applied FIRST, then any block keyed by one of `modeIds`
   * (the mode's id / routeName), so a single mode can override the general
   * values. Call this AFTER `customizationService.onModeEnter()` has reset the
   * mode scope (i.e. after `extensionManager.onModeEnter()`).
   */
  public applyModeCustomizations(modeIds: string | string[]): void {
    const ids = (Array.isArray(modeIds) ? modeIds : [modeIds]).filter(Boolean) as string[];
    this._currentModeIds = ids;

    const blocks = this._collectPhaseBlocks('mode') as Array<{
      mode?: Record<string, CustomizationPhaseInput>;
    }>;

    // General first, for every source.
    for (const block of blocks) {
      const general = block.mode?.[GENERAL_MODE_KEY];
      if (general) {
        this.setCustomizations(general, CustomizationScope.Mode);
      }
    }
    // Then mode-specific, for every source.
    for (const block of blocks) {
      for (const id of ids) {
        const specific = block.mode?.[id];
        if (specific) {
          this.setCustomizations(specific, CustomizationScope.Mode);
        }
      }
    }
  }

  public onModeEnter(): void {
    this.clearTransformedCustomizations();

    this.init(this.extensionManager);
  }

  public onModeExit(): void {
    this.clearTransformedCustomizations();
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
   * Returns a customization value, or the provided fallback when unset.
   */
  public getValue<T = Customization>(customizationId: string, fallbackValue?: T): T | undefined {
    const value = this.getCustomization(customizationId);
    return (value === undefined ? fallbackValue : (value as T)) as T | undefined;
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

  // ===========================================================================
  // Private methods
  // ===========================================================================

  private clearTransformedCustomizations(): void {
    super.reset();

    const modeCustomizationKeys = Array.from(this.modeCustomizations.keys());
    for (const key of modeCustomizationKeys) {
      this.transformedCustomizations.delete(key);
    }

    this.modeCustomizations.clear();
  }

  /**
   * Default loader for a `?customization=` module. Customization files are
   * **data**, not code: the file is fetched and parsed as JSONC (JSON with
   * comments / trailing commas, via JSON5 which is a superset). It is never
   * executed. Executable modules — plugins, modes and extensions — load only
   * through `pluginConfig.json`, never from the customization URL path.
   */
  private async _urlDefaultImport(url: string): Promise<any> {
    if (typeof fetch !== 'function') {
      throw new Error(`No fetch implementation available to load customization ${url}`);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch customization ${url}: ${response.status} ${response.statusText}`
      );
    }
    const text = await response.text();
    return JSON5.parse(text);
  }

  private _normalizeImportedCustomizationModule(imported: any): CustomizationModule {
    return imported && typeof imported === 'object' && 'customizations' in imported
      ? imported
      : imported && typeof imported.default === 'object'
        ? imported.default
        : imported;
  }

  private _collectUrlDependencyRefs(module: CustomizationModule): string[] {
    const refs = new Set<string>();
    const payload = getUrlCustomizationModulePayload(module);
    if (!payload || typeof payload !== 'object') {
      return Array.from(refs);
    }
    const moduleRequires = (payload as any).requires;
    if (typeof moduleRequires === 'string' && moduleRequires) {
      refs.add(moduleRequires);
    } else if (Array.isArray(moduleRequires)) {
      for (const id of moduleRequires) {
        if (typeof id === 'string' && id) {
          refs.add(id);
        }
      }
    }
    return Array.from(refs);
  }

  private _urlDependencyToRequest(
    name: string,
    policy: CustomizationUrlPolicy
  ): ValidatedCustomization | null {
    // `requires` entries are module names to load; each is validated/resolved like any
    // other URL customization request. Entries that don't resolve to a valid module
    // (e.g. a bare customization-key reference) are rejected by validation and
    // skipped — there is no namespace carve-out.
    const result = validateCustomizationRequests([name], policy);
    if (result.valid.length) {
      return result.valid[0];
    }
    return null;
  }

  private _urlCustomizationLoadOne(
    request: ValidatedCustomization,
    policy: CustomizationUrlPolicy,
    importFn: (url: string) => Promise<any>,
    logger: { warn: (...args: any[]) => void; error: (...args: any[]) => void },
    requestedSet: Set<string>,
    newlyLoaded: LoadedCustomization[]
  ): Promise<LoadedCustomization | null> {
    const key = request.normalized;
    if (this._urlCustomizationLoaded.has(key)) {
      return Promise.resolve(this._urlCustomizationLoaded.get(key) || null);
    }
    if (this._urlCustomizationPending.has(key)) {
      return this._urlCustomizationPending.get(key)!;
    }

    requestedSet.add(key);

    const promise = this._urlCustomizationLoadOneBody(
      request,
      policy,
      importFn,
      logger,
      requestedSet,
      newlyLoaded
    );

    this._urlCustomizationPending.set(key, promise);
    // Use then(success, failure) for cleanup — `finally` left rejections unhandled
    // with the current Promise polyfill in the Jest/Node test stack.
    promise.then(
      () => this._urlCustomizationPending.delete(key),
      () => this._urlCustomizationPending.delete(key)
    );
    return promise;
  }

  private _urlCustomizationLoadOneBody(
    request: ValidatedCustomization,
    policy: CustomizationUrlPolicy,
    importFn: (url: string) => Promise<any>,
    logger: { warn: (...args: any[]) => void; error: (...args: any[]) => void },
    requestedSet: Set<string>,
    newlyLoaded: LoadedCustomization[]
  ): Promise<LoadedCustomization | null> {
    const key = request.normalized;
    const importFailedSentinel = Symbol('importFailed');

    let url: string;
    try {
      url = resolveCustomizationUrl(request, policy);
    } catch (err) {
      const msg = `[customizationUrl] failed to resolve "${request.raw}": ${(err as Error).message}`;
      logger.warn(msg);
      return Promise.resolve(null);
    }

    return importFn(url)
      .catch(err => {
        logger.warn(
          `[customizationUrl] failed to import customization "${request.raw}" (${url})`,
          err
        );
        return importFailedSentinel;
      })
      .then(importedOrSentinel => {
        if (importedOrSentinel === importFailedSentinel) {
          return null;
        }
        const imported = importedOrSentinel;
        const module = this._normalizeImportedCustomizationModule(imported);
        if (!module || typeof module !== 'object') {
          const msg = `[customizationUrl] missing customization module "${request.raw}" (${url}): module is not an object`;
          logger.warn(msg);
          return null;
        }
        if (!getUrlCustomizationModulePayload(module)) {
          const msg = `[customizationUrl] missing customization module "${request.raw}" (${url}): no customizations payload`;
          logger.warn(msg);
          return null;
        }

        const depRefs = this._collectUrlDependencyRefs(module);
        let depsChain: Promise<unknown> = Promise.resolve();
        for (const depRef of depRefs) {
          depsChain = depsChain.then(() => {
            const depRequest = this._urlDependencyToRequest(depRef, policy);
            if (!depRequest || requestedSet.has(depRequest.normalized)) {
              return undefined;
            }
            return this._urlCustomizationLoadOne(
              depRequest,
              policy,
              importFn,
              logger,
              requestedSet,
              newlyLoaded
            );
          });
        }

        return depsChain.then(() => {
          const loaded: LoadedCustomization = { request, module, url };
          this._urlCustomizationLoaded.set(key, loaded);
          newlyLoaded.push(loaded);
          return loaded;
        });
      });
  }

  private _applyLoadedUrlCustomizationModules(loaded: LoadedCustomization[]): void {
    if (!loaded?.length) {
      return;
    }
    for (const entry of loaded) {
      const payload = getUrlCustomizationModulePayload(entry.module);
      if (payload?.global) {
        this.setCustomizations(payload.global, CustomizationScope.Global);
      }
    }
  }

  /**
   * Collects the phase blocks for `phase` from every source, in apply order:
   * the structured app config first, then each resolved URL module in load
   * order. Used by {@link applyModeCustomizations}; the simpler `preExtension` /
   * `global` phases go through {@link _applyPhase}.
   */
  private _collectPhaseBlocks(phase: keyof PhasedCustomizationConfig): PhasedCustomizationConfig[] {
    const blocks: PhasedCustomizationConfig[] = [];
    const phased = this._getCustomizationConfig().phased;
    if (phased && phased[phase] !== undefined) {
      blocks.push(phased);
    }
    for (const entry of this._resolvedUrlModules) {
      const payload = getUrlCustomizationModulePayload(entry.module);
      if (payload && payload[phase] !== undefined) {
        blocks.push(payload);
      }
    }
    return blocks;
  }

  /** Applies a Global-scoped phase (`preExtension` / `global`) from all sources. */
  private _applyPhase(phase: 'preExtension' | 'global'): void {
    for (const block of this._collectPhaseBlocks(phase)) {
      const value = block[phase] as CustomizationPhaseInput | undefined;
      if (value) {
        this.setCustomizations(value, CustomizationScope.Global);
      }
    }
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
      buttons: this.globalCustomizations,
      button: this.globalCustomizations.get(id),
    });
  }

  private setDefaultCustomization(id: string, value: Customization): void {
    // There are two inits now, without a clear between them, so we can't warn about existing defaults
    // if (this.defaultCustomizations.has(id)) {
    //   console.warn(`Trying to update existing default for customization ${id}`);
    // }
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

const PHASE_CONFIG_KEYS: Array<keyof PhasedCustomizationConfig> = [
  'requires',
  'preExtension',
  'global',
  'mode',
];

/**
 * Normalizes `appConfig.customizationService` into either:
 *   - `{ phased }`           — the structured, phase-tagged config, detected by
 *                              the presence of any of `requires` / `preExtension`
 *                              / `global` / `mode`; or
 *   - `{ legacyReferences }` — the legacy array / object-map form, which is
 *                              added (Global scope) during `init()` exactly as
 *                              before.
 */
export function normalizeCustomizationConfig(configuration: unknown): {
  phased?: PhasedCustomizationConfig;
  legacyReferences?: unknown;
} {
  if (!configuration) {
    return {};
  }
  if (Array.isArray(configuration)) {
    return { legacyReferences: configuration };
  }
  if (typeof configuration === 'object') {
    const isPhased = PHASE_CONFIG_KEYS.some(key => key in (configuration as object));
    if (isPhased) {
      const phased: PhasedCustomizationConfig = {};
      for (const key of PHASE_CONFIG_KEYS) {
        if (key in (configuration as object)) {
          (phased as Record<string, unknown>)[key] = (configuration as Record<string, unknown>)[key];
        }
      }
      return { phased };
    }
    return { legacyReferences: configuration };
  }
  return {};
}

function hasDollarKey(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasDollarKey(item)) {
        return true;
      }
    }
  } else if (value && typeof value === 'object') {
    // React elements carry a `$$typeof` brand; they're values to render, not
    // immutability-helper command specs, so don't scan into them (otherwise
    // their `$$typeof` is misread as a command and `update()` runs on a value
    // it shouldn't).
    if (value.$$typeof) {
      return false;
    }
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
