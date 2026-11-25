/**
 * Helpers for applying a mode's toolbar / tool-group composition.
 *
 * The composition values (`toolbarButtons`, `toolbarSections`,
 * `toolGroupAdditions`) are ordinary customizations resolved through the
 * customization service. A mode lists the capability packs it uses with
 * `{ $reference: '<name>' }` markers; the service expands those at read time
 * (packs that are arrays are flattened into the surrounding list), and a site
 * `?customization=` module extends or replaces them with immutability-helper
 * commands (`$push` another `{ $reference }`, `$set` a hard-coded value, ...).
 * By the time these helpers run, the values passed in are already fully
 * resolved — so they only need to shape/register them.
 */

/** Normalizes a value to an array (wrapping a single object, dropping nullish). */
function toArray(value: unknown): any[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Registers a mode's toolbar from its resolved composition.
 *
 * `toolbarButtons` is a flat list of button definitions registered with the
 * toolbar service.  `toolbarSections` is one or more
 * `{ sectionKey: buttonIds[] }` objects shallow-merged in order (later values
 * win per section) and applied with `updateSection`.
 */
export function registerModeToolbar({ toolbarService }, { toolbarButtons, toolbarSections }): void {
  toolbarService.register(toArray(toolbarButtons));

  const sections: Record<string, string[]> = Object.assign({}, ...toArray(toolbarSections));
  for (const [key, section] of Object.entries(sections)) {
    toolbarService.updateSection(key, section);
  }
}

/**
 * Adds extra tools to the tool groups a mode has already created.
 *
 * `toolGroupAdditions` is a resolved object mapping a tool group id to a list
 * of tool blocks (each a `{ active/passive/enabled/disabled }` object). Tool
 * groups the mode did not create are skipped, so a single additions object can
 * be shared between modes with different tool group sets.
 */
export function applyToolGroupAdditions({ toolGroupService }, toolGroupAdditions): void {
  if (!toolGroupAdditions) {
    return;
  }
  for (const additions of toArray(toolGroupAdditions)) {
    for (const [toolGroupId, toolBlocks] of Object.entries(additions)) {
      if (!toolGroupService.getToolGroup(toolGroupId)) {
        continue;
      }
      for (const tools of toArray(toolBlocks)) {
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
