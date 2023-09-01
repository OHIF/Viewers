import { toolGroupIds } from '../initToolGroups';

export default function setCrosshairsConfiguration(
  matches,
  toolNames,
  toolGroupService,
  displaySetService
) {
  const matchDetails = matches.get('ctDisplaySet');

  if (!matchDetails) {
    return;
  }

  const { SeriesInstanceUID } = matchDetails;
  const displaySets = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID);

  const toolConfig = toolGroupService.getToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.Crosshairs
  );

  const crosshairsConfig = {
    ...toolConfig,
    filterActorUIDsToSetSlabThickness: [displaySets[0].displaySetInstanceUID],
  };

  toolGroupService.setToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.Crosshairs,
    crosshairsConfig
  );
}
