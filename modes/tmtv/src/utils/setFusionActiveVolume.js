import { toolGroupIds } from '../initToolGroups';

export default function setFusionActiveVolume(
  matches,
  toolNames,
  ToolGroupService,
  DisplaySetService
) {
  const matchDetails = matches.get('ptDisplaySet');

  if (!matchDetails) {
    return;
  }

  const { SeriesInstanceUID } = matchDetails;

  const displaySets = DisplaySetService.getDisplaySetsForSeries(
    SeriesInstanceUID
  );

  if (!displaySets || displaySets.length === 0) {
    return;
  }

  const wlToolConfig = ToolGroupService.getToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.WindowLevel
  );

  const ellipticalToolConfig = ToolGroupService.getToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.EllipticalROI
  );

  const windowLevelConfig = {
    ...wlToolConfig,
    volumeId: displaySets[0].displaySetInstanceUID,
  };

  const ellipticalROIConfig = {
    ...ellipticalToolConfig,
    volumeId: displaySets[0].displaySetInstanceUID,
  };

  ToolGroupService.setToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.WindowLevel,
    windowLevelConfig
  );

  ToolGroupService.setToolConfiguration(
    toolGroupIds.Fusion,
    toolNames.EllipticalROI,
    ellipticalROIConfig
  );
}
