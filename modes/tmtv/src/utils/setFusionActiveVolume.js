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

  // Todo: this should not take into account the loader id
  const volumeId = `cornerstoneStreamingImageVolume:${displaySets[0].displaySetInstanceUID}`;

  const windowLevelConfig = {
    ...wlToolConfig,
    volumeId,
  };

  const ellipticalROIConfig = {
    ...ellipticalToolConfig,
    volumeId,
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
