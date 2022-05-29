import { toolGroupIds } from '../initToolGroups';

export default function setCrosshairsConfiguration(
  matches,
  toolNames,
  ToolGroupService,
  DisplaySetService
) {
  const { SeriesInstanceUID } = matches.get('ctDisplaySet');
  const displaySets = DisplaySetService.getDisplaySetsForSeries(
    SeriesInstanceUID
  );

  const toolConfig = ToolGroupService.getToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.Crosshairs
  );

  const crosshairsConfig = {
    ...toolConfig,
    filterActorUIDsToSetSlabThickness: [displaySets[0].displaySetInstanceUID],
  };

  ToolGroupService.setToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.Crosshairs,
    crosshairsConfig
  );
}
