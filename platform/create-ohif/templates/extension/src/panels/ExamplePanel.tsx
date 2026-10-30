/**
 * Example side panel. Panels usually read live viewer state from
 * `servicesManager.services` (destructure the service you need) and subscribe
 * to its events:
 *
 *   const { displaySetService } = servicesManager.services;
 *   useEffect(() => {
 *     const { unsubscribe } = displaySetService.subscribe(
 *       displaySetService.EVENTS.DISPLAY_SETS_ADDED,
 *       () => setCount(displaySetService.getActiveDisplaySets().length)
 *     );
 *     return unsubscribe;
 *   }, []);
 *
 * Prefer that pub-sub pattern over polling effects. This starter renders
 * static content only.
 */
function ExamplePanel() {
  return (
    <div className="{{dirName}}-example flex flex-col">
      <span className="text-base">Example panel from {{dirName}}</span>
      <span>Replace this with your panel content.</span>
    </div>
  );
}

export default ExamplePanel;
