async function _hydrateSEGDisplaySet({
  segDisplaySet,
  viewportIndex,
  toolGroupId,
  servicesManager,
}) {
  const {
    HangingProtocolService,
    ViewportGridService,
  } = servicesManager.services;

  const perViewport = await HangingProtocolService.getPerViewport(
    viewportIndex
  );

  const viewportsState = ViewportGridService.getState();

  const newViewport = '';

  const newProtocol = createProtocolFromViewports;

  return true;
}

export default _hydrateSEGDisplaySet;
