/**
 * Helpers for resolving mode configuration (toolbar buttons, toolbar sections
 * and tool group additions) through the customization service.
 *
 * The pattern: extensions register the default values as named customizations
 * (at Default scope), modes reference those values by name, and site
 * `?customization=` JSON modules extend or replace the named values with
 * immutability-helper commands.  Wherever a list is resolved, a string entry is
 * treated as the name of another customization, so a JSON module can add a
 * whole capability block that an extension exports (for example
 * `$push: ['cornerstone.segmentationToolbarButtons']`) without having to
 * restate its contents.
 */

/**
 * Resolves a customization list value into a flat array of concrete values.
 *
 * The input may be:
 *   - a string: the name of a customization to resolve (recursively)
 *   - an array: each entry resolved recursively (strings are names, objects
 *     are literal values)
 *   - an object: a literal value, returned as a single-element array
 *
 * Names are only resolved once per call (repeats and cycles are skipped), so a
 * capability block referenced from two places is applied a single time.
 */
export function resolveCustomizationList(
  customizationService: AppTypes.CustomizationService,
  value: unknown,
  _seen = new Set<string>()
): any[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (typeof value === 'string') {
    if (_seen.has(value)) {
      return [];
    }
    _seen.add(value);
    const resolved = customizationService.getCustomization(value);
    if (resolved === undefined) {
      console.warn(`resolveCustomizationList: no customization registered for "${value}"`);
      return [];
    }
    return resolveCustomizationList(customizationService, resolved, _seen);
  }
  if (Array.isArray(value)) {
    return value.flatMap(entry => resolveCustomizationList(customizationService, entry, _seen));
  }
  return [value];
}

/**
 * Registers a mode's toolbar from customization references.
 *
 * `toolbarButtons` resolves to a flat list of button definitions which are
 * registered with the toolbar service.  `toolbarSections` resolves to one or
 * more `{ sectionKey: buttonIds[] }` objects which are shallow-merged in order
 * (later values win per section) and applied with `updateSection`.
 */
export function registerModeToolbar(
  { toolbarService, customizationService },
  { toolbarButtons, toolbarSections }
): void {
  const buttons = resolveCustomizationList(customizationService, toolbarButtons);
  toolbarService.register(buttons);

  const sections: Record<string, string[]> = Object.assign(
    {},
    ...resolveCustomizationList(customizationService, toolbarSections)
  );
  for (const [key, section] of Object.entries(sections)) {
    toolbarService.updateSection(key, section);
  }
}

/**
 * Adds extra tools to the tool groups a mode has already created.
 *
 * `toolGroupAdditions` is (the name of) an object mapping a tool group id to a
 * list of tool blocks; each block is either a literal
 * `{ active/passive/enabled/disabled }` object or the name of a customization
 * holding one (for example `cornerstone.segmentationToolGroupTools`).  Tool
 * groups the mode did not create are skipped, so a single additions object can
 * be shared between modes with different tool group sets.
 */
export function applyToolGroupAdditions(
  { toolGroupService, customizationService },
  toolGroupAdditions
): void {
  if (!toolGroupAdditions) {
    return;
  }
  for (const additions of resolveCustomizationList(customizationService, toolGroupAdditions)) {
    for (const [toolGroupId, toolBlocks] of Object.entries(additions)) {
      if (!toolGroupService.getToolGroup(toolGroupId)) {
        continue;
      }
      for (const tools of resolveCustomizationList(customizationService, toolBlocks)) {
        toolGroupService.addToolsToToolGroup(toolGroupId, tools);
      }
    }
  }
}

/**
 * Wires up a mode's ActivatePanel event triggers from data.
 *
 * `activatePanelTriggers` is a list of
 * `{ panelId, sourceServiceName, sourceEvents, forceActive? }` entries;
 * `sourceEvents` names are looked up in the source service's `EVENTS` map
 * (falling back to the raw value) so the whole entry is JSON-serializable and
 * can be supplied by a `?customization=` module or an extending mode.
 *
 * Returns the unsubscribe functions for the subscriptions created.
 */
export function addActivatePanelTriggers(
  { servicesManager },
  activatePanelTriggers
): (() => void)[] {
  const { panelService } = servicesManager.services;
  const unsubscriptions: (() => void)[] = [];
  for (const trigger of activatePanelTriggers ?? []) {
    const { panelId, sourceServiceName, sourceEvents, forceActive = true } = trigger;
    const sourcePubSubService = servicesManager.services[sourceServiceName];
    if (!sourcePubSubService) {
      console.warn(`addActivatePanelTriggers: no service registered for "${sourceServiceName}"`);
      continue;
    }
    const subscriptions = panelService.addActivatePanelTriggers(
      panelId,
      [
        {
          sourcePubSubService,
          sourceEvents: sourceEvents.map(name => sourcePubSubService.EVENTS?.[name] ?? name),
        },
      ],
      forceActive
    );
    unsubscriptions.push(...subscriptions.map(subscription => () => subscription.unsubscribe()));
  }
  return unsubscriptions;
}
